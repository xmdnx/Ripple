const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore, forward) => {
    ipcRenderer.invoke('set-ignore-mouse-events', ignore, forward);
  },
  setWindowInputShape: (rect) => ipcRenderer.send('set-window-input-shape', rect),
  getSystemMedia: () => ipcRenderer.invoke('get-system-media'),
  debugGetSystemMediaRaw: () => ipcRenderer.invoke('debug-get-system-media-raw'),
  getBluetoothStatus: () => ipcRenderer.invoke('get-bluetooth-status'),
  getCameraStatus: () => ipcRenderer.invoke('get-camera-status'),
  getMicrophoneStatus: () => ipcRenderer.invoke('get-microphone-status'),
  getBatteryStatus: () => ipcRenderer.invoke('get-battery-status'),
  controlSystemMedia: (command) => ipcRenderer.invoke('control-system-media', command),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  startDrag: (item) => ipcRenderer.send('start-drag', item),
  getPathForFile: (file) => {
    try {
      const { webUtils } = require('electron');
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (_) {}
    return file?.path || '';
  },
  launchApp: (appName) => ipcRenderer.invoke('launch-app', appName),
  buildAppCache: () => ipcRenderer.invoke('build-app-cache'),
  searchApps: (query) => ipcRenderer.invoke('search-apps', query),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  setDisplay: (displayId) => ipcRenderer.invoke('set-display', displayId),
  updateWindowPosition: (xPerc, yPx) => ipcRenderer.invoke('update-window-position', xPerc, yPx),
  setAutoLaunch: (enable) => process.platform !== 'darwin' ? ipcRenderer.invoke('set-auto-launch', enable) : Promise.resolve(),
  focusWindow: () => ipcRenderer.invoke('focus-window'),
  onSystemMediaUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('system-media-updated', handler);
    return () => ipcRenderer.removeListener('system-media-updated', handler);
  },
  onDevicesUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('devices-updated', handler);
    return () => ipcRenderer.removeListener('devices-updated', handler);
  },
  platform: process.platform
});
