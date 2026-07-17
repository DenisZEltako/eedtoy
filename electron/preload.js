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
  isElectron:  true,
});
