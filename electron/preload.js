const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  listPorts:   ()                    => ipcRenderer.invoke('list-ports'),
  readBaseId:  (path, baud, proto)   => ipcRenderer.invoke('read-base-id', path, baud, proto),
  detectGateway: (preferredPath)     => ipcRenderer.invoke('detect-gateway', preferredPath),
  learnDeviceId: (path, gatewayType, timeoutMs) => ipcRenderer.invoke('learn-device-id', path, gatewayType, timeoutMs),
  writeSenderIdsToDevices: (payload) => ipcRenderer.invoke('write-sender-ids-to-devices', payload),
  disconnectGateway: (payload) => ipcRenderer.invoke('disconnect-gateway', payload),
  saveProjectAs: (payload) => ipcRenderer.invoke('save-project-as', payload),
  openProject: () => ipcRenderer.invoke('open-project'),
  saveProject: (payload) => ipcRenderer.invoke('save-project', payload),
  getLanguage: () => ipcRenderer.invoke('get-language'),
  setLanguage: (language) => ipcRenderer.invoke('set-language', language),
  onMenuAction: (callback) => { const listener = (_event, action) => callback(action); ipcRenderer.on('menu-action', listener); return () => ipcRenderer.removeListener('menu-action', listener); },
  onLanguageChanged: (callback) => { const listener = (_event, language) => callback(language); ipcRenderer.on('language-changed', listener); return () => ipcRenderer.removeListener('language-changed', listener); },
  isElectron:  true,
});
