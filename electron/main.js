'use strict'

const { app, BrowserWindow, Menu, ipcMain, shell, session, screen } = require('electron')
const path = require('path')
const Store = require('electron-store')
const yandex = require('./yandex')

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
ipcMain.handle('api:artist', wrap((artistId) => yandex.getArtist(tokenOrThrow(), artistId)))
ipcMain.handle('api:album', wrap((albumId) => yandex.getAlbum(tokenOrThrow(), albumId)))
ipcMain.handle('api:track-url', wrap((trackId) => yandex.getTrackUrl(tokenOrThrow(), trackId)))
ipcMain.handle('api:like', wrap((trackId, like) => yandex.setLike(tokenOrThrow(), uid(), trackId, like)))

// Мини-режим окна: компактный плеер поверх остальных окон.
const MINI_SIZES = {
  rect: { width: 450, height: 142 },
  square: { width: 300, height: 360 }
}
let prevBounds = null
ipcMain.handle('window:set-mini', (_e, on, shape = 'rect') => {
  if (!mainWindow) return
  if (on) {
    prevBounds = mainWindow.getBounds()
    const dim = MINI_SIZES[shape] || MINI_SIZES.rect
    mainWindow.setMinimumSize(280, 120)
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

// Моя волна (rotor)
ipcMain.handle('api:rotor-info', wrap((station) => yandex.getRotorInfo(tokenOrThrow(), station)))
ipcMain.handle('api:rotor-settings', wrap((station, settings) => yandex.setRotorSettings(tokenOrThrow(), station, settings)))
ipcMain.handle('api:rotor-tracks', wrap((station, queue) => yandex.getRotorTracks(tokenOrThrow(), station, queue)))
ipcMain.handle('api:rotor-feedback', wrap((station, payload) => yandex.rotorFeedback(tokenOrThrow(), station, payload)))
ipcMain.handle('api:rotor-session-new', wrap((seeds) => yandex.rotorSessionNew(tokenOrThrow(), seeds)))
ipcMain.handle('api:rotor-session-tracks', wrap((id, batchId, queue) => yandex.rotorSessionTracks(tokenOrThrow(), id, batchId, queue)))
ipcMain.handle('api:rotor-session-feedback', wrap((id, payload) => yandex.rotorSessionFeedback(tokenOrThrow(), id, payload)))
