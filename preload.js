const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  
  // NEW: Function to save the file
  saveFile: (defaultFilename, content) => ipcRenderer.invoke('dialog:saveFile', defaultFilename, content),
});