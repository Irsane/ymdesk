'use strict'

const { app, BrowserWindow, Menu, ipcMain, shell, session, screen } = require('electron')
const path = require('path')
const Store = require('electron-store')
const yandex = require('./yandex')
const vk = require('./vk')

const isDev = process.env.NODE_ENV === 'development'

// Безопасное хранилище токена в userData.
const store = new Store({ name: 'ymdesk-config' })

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: 'Hailu',
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Внешние ссылки открываем в браузере, а не в окне приложения.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  // Убираем стандартное меню (File / Edit / View / Window / Help).
  Menu.setApplicationMenu(null)

  // Аудио-поток грузится через <audio> в renderer. Чтобы CDN отдал mp3,
  // подставляем нужные заголовки на запросы к storage Яндекса.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://*.music.yandex.net/*', 'https://*.storage.yandex.net/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'YandexMusicAndroid/24023621'
      callback({ requestHeaders: details.requestHeaders })
    }
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// --- IPC: токен ---
ipcMain.handle('auth:get-token', () => store.get('token') || null)

ipcMain.handle('auth:set-token', async (_e, token) => {
  // Проверяем токен прежде чем сохранить.
  const status = await yandex.getAccountStatus(token)
  store.set('token', token)
  store.set('uid', status?.account?.uid)
  return status
})

ipcMain.handle('auth:logout', () => {
  store.delete('token')
  store.delete('uid')
  return true
})

// Хелпер: достать токен или кинуть понятную ошибку.
function tokenOrThrow() {
  const token = store.get('token')
  if (!token) throw new Error('Не авторизован')
  return token
}
function uid() {
  return store.get('uid')
}

// --- IPC: данные ---
function wrap(handler) {
  return async (_e, ...args) => {
    try {
      return { ok: true, data: await handler(...args) }
    } catch (err) {
      return { ok: false, error: err.message || String(err) }
    }
  }
}

ipcMain.handle('api:account', wrap(() => yandex.getAccountStatus(tokenOrThrow())))
ipcMain.handle('api:feed', wrap(() => yandex.getFeed(tokenOrThrow())))
ipcMain.handle('api:new-playlists', wrap(() => yandex.getNewPlaylists(tokenOrThrow())))
ipcMain.handle('api:chart', wrap(() => yandex.getChart(tokenOrThrow())))
ipcMain.handle('api:playlists', wrap(() => yandex.getUserPlaylists(tokenOrThrow(), uid())))
ipcMain.handle('api:playlist', wrap((ownerUid, kind) => yandex.getPlaylist(tokenOrThrow(), ownerUid || uid(), kind)))
ipcMain.handle('api:liked', wrap(() => yandex.getLikedTracks(tokenOrThrow(), uid())))
ipcMain.handle('api:search', wrap((text, opts) => yandex.search(tokenOrThrow(), text, opts)))
ipcMain.handle('api:track-url', wrap((trackId) => yandex.getTrackUrl(tokenOrThrow(), trackId)))
ipcMain.handle('api:like', wrap((trackId, like) => yandex.setLike(tokenOrThrow(), uid(), trackId, like)))

// Мини-режим окна: компактный плеер поверх остальных окон.
const MINI_SIZES = {
  compact: { width: 330, height: 96 },
  normal: { width: 400, height: 128 },
  large: { width: 480, height: 156 }
}
let prevBounds = null
ipcMain.handle('window:set-mini', (_e, on, size = 'normal') => {
  if (!mainWindow) return
  if (on) {
    prevBounds = mainWindow.getBounds()
    const dim = MINI_SIZES[size] || MINI_SIZES.normal
    mainWindow.setMinimumSize(300, 90)
    const wa = screen.getPrimaryDisplay().workAreaSize
    mainWindow.setResizable(false)
    mainWindow.setBounds({ width: dim.width, height: dim.height, x: wa.width - dim.width - 20, y: wa.height - dim.height - 40 })
    mainWindow.setAlwaysOnTop(true)
  } else {
    mainWindow.setAlwaysOnTop(false)
    mainWindow.setMinimumSize(900, 600)
    mainWindow.setResizable(true)
    if (prevBounds) mainWindow.setBounds(prevBounds)
  }
  return on
})

// --- VK ---
function vkTokenOrThrow() {
  const t = store.get('vkToken')
  if (!t) throw new Error('VK не подключён')
  return t
}
const vkUid = () => store.get('vkUid')

// Вход через настоящую страницу VK в отдельном окне — токен ловим из
// редиректа на blank.html. Пользователь логинится на сайте VK, не у нас.
// scope=1073737727 — полный набор прав Kate Mobile (включает audio).
// Без него VK выдаёт токен без доступа к музыке (ошибка 3).
const VK_OAUTH = 'https://oauth.vk.com/authorize?client_id=2685278&scope=1073737727&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&revoke=1&v=5.131'
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

ipcMain.handle('vk:oauth', async () => {
  return new Promise((resolve) => {
    const authWin = new BrowserWindow({
      width: 520, height: 720, title: 'Вход в VK', autoHideMenuBar: true,
      parent: mainWindow, modal: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, partition: 'vk-oauth' }
    })
    let done = false
    const tryUrl = async (url) => {
      if (done || !url) return
      const m = url.match(/[#&]access_token=([^&]+)/)
      if (!m) return
      done = true
      const token = m[1]
      try {
        store.set('vkToken', token)
        const profile = await vk.getProfile(token)
        store.set('vkUid', profile.id)
        store.set('vkProfile', profile)
        resolve({ status: 'ok', profile })
      } catch (e) {
        resolve({ status: 'error', error: e.message })
      }
      try { authWin.close() } catch { /* */ }
    }
    const wc = authWin.webContents
    wc.on('will-redirect', (_e, url) => tryUrl(url))
    wc.on('did-redirect-navigation', (_e, url) => tryUrl(url))
    wc.on('did-navigate', (_e, url) => tryUrl(url))
    wc.on('did-navigate-in-page', (_e, url) => tryUrl(url))
    authWin.on('closed', () => { if (!done) resolve({ status: 'cancelled' }) })
    authWin.loadURL(VK_OAUTH, { userAgent: DESKTOP_UA })
  })
})

ipcMain.handle('vk:get-token', () => store.get('vkToken') || null)
ipcMain.handle('vk:set-token', async (_e, token) => {
  const profile = await vk.getProfile(token)
  if (!profile?.id) throw new Error('Неверный VK-токен')
  store.set('vkToken', token)
  store.set('vkUid', profile.id)
  store.set('vkProfile', profile)
  return profile
})
ipcMain.handle('vk:get-profile', () => store.get('vkProfile') || null)
ipcMain.handle('vk:logout', () => {
  store.delete('vkToken'); store.delete('vkUid'); store.delete('vkProfile'); return true
})

ipcMain.handle('api:vk-search', wrap((q) => vk.search(vkTokenOrThrow(), q)))
ipcMain.handle('api:vk-audios', wrap(() => vk.userAudios(vkTokenOrThrow(), vkUid())))
ipcMain.handle('api:vk-playlists', wrap(() => vk.getPlaylists(vkTokenOrThrow(), vkUid())))
ipcMain.handle('api:vk-playlist', wrap((ownerId, albumId, accessKey) => vk.getPlaylist(vkTokenOrThrow(), ownerId, albumId, accessKey)))
ipcMain.handle('api:vk-recommendations', wrap(() => vk.getRecommendations(vkTokenOrThrow())))

// Моя волна (rotor)
ipcMain.handle('api:rotor-info', wrap((station) => yandex.getRotorInfo(tokenOrThrow(), station)))
ipcMain.handle('api:rotor-settings', wrap((station, settings) => yandex.setRotorSettings(tokenOrThrow(), station, settings)))
ipcMain.handle('api:rotor-tracks', wrap((station, lastTrackId) => yandex.getRotorTracks(tokenOrThrow(), station, lastTrackId)))
