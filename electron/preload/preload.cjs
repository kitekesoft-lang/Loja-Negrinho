/**
 * Kiteke Pro Desktop - Preload Script Seguro
 * Exposição controlada e tipada via contextBridge sem expor require/Node.js diretamente
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  isElectron: true,
  platform: process.platform,

  // Controlo da Janela
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  unmaximize: () => ipcRenderer.invoke('app:unmaximize'),
  close: () => ipcRenderer.invoke('app:close'),
  isMaximized: () => ipcRenderer.invoke('app:is-maximized'),

  // Sistema de Impressão Windows (Facturas, Recibos e Talões Térmicos)
  getPrinters: () => ipcRenderer.invoke('printer:get-list'),
  print: (options) => ipcRenderer.invoke('printer:print', options),
  printToPDF: (options) => ipcRenderer.invoke('printer:print-to-pdf', options),

  // Ficheiros & PDF
  savePDF: (defaultName, base64Data) =>
    ipcRenderer.invoke('filesystem:save-pdf', { defaultName, base64Data }),
  openPath: (filePath) => ipcRenderer.invoke('filesystem:open-path', filePath),

  // Diagnóstico & Sistema Operativo
  getSystemInfo: () => ipcRenderer.invoke('system:get-status'),
  checkNetwork: () => ipcRenderer.invoke('network:check-status'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
});
