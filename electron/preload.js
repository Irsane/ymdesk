'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Безопасный мост между renderer (React) и main. Renderer не имеет
// прямого доступа к Node/сети — только к этим методам.
contextBridge.exposeInMainWorld('ym', {
  // Авторизация
  getToken: () => ipcRenderer.invoke('auth:get-token'),
  setToken: (token) => ipcRenderer.invoke('auth:set-token', token),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // API (возвращают { ok, data } | { ok:false, error })
  account: () => ipcRenderer.invoke('api:account'),
  feed: () => ipcRenderer.invoke('api:feed'),
  newPlaylists: () => ipcRenderer.invoke('api:new-playlists'),
  chart: () => ipcRenderer.invoke('api:chart'),
  playlists: () => ipcRenderer.invoke('api:playlists'),
  playlist: (ownerUid, kind) => ipcRenderer.invoke('api:playlist', ownerUid, kind),
  liked: () => ipcRenderer.invoke('api:liked'),
  search: (text, opts) => ipcRenderer.invoke('api:search', text, opts),
  trackUrl: (trackId) => ipcRenderer.invoke('api:track-url', trackId),
  like: (trackId, like) => ipcRenderer.invoke('api:like', trackId, like),

  // Моя волна
  rotorInfo: (station) => ipcRenderer.invoke('api:rotor-info', station),
  rotorSettings: (station, settings) => ipcRenderer.invoke('api:rotor-settings', station, settings),
  rotorTracks: (station, lastTrackId) => ipcRenderer.invoke('api:rotor-tracks', station, lastTrackId),

  // Управление окном
  setMini: (on, size) => ipcRenderer.invoke('window:set-mini', on, size),

  // VK
  vkAuth: (payload) => ipcRenderer.invoke('vk:auth', payload),
  vkGetToken: () => ipcRenderer.invoke('vk:get-token'),
  vkSetToken: (t) => ipcRenderer.invoke('vk:set-token', t),
  vkGetProfile: () => ipcRenderer.invoke('vk:get-profile'),
  vkLogout: () => ipcRenderer.invoke('vk:logout'),
  vkSearch: (q) => ipcRenderer.invoke('api:vk-search', q),
  vkAudios: () => ipcRenderer.invoke('api:vk-audios'),
  vkPlaylists: () => ipcRenderer.invoke('api:vk-playlists'),
  vkPlaylist: (ownerId, albumId, accessKey) => ipcRenderer.invoke('api:vk-playlist', ownerId, albumId, accessKey),
  vkRecommendations: () => ipcRenderer.invoke('api:vk-recommendations')
})
