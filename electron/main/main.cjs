/**
 * Kiteke Pro Desktop - Processo Principal (Electron Main)
 *
 * Arquitectura:
 * ERP Existente (Vite/React + Fiscal Engine + AGT) -> Electron Shell -> Windows
 */
const { app, ipcMain } = require('electron');
const os = require('os');
const config = require('../config/app.config.cjs');
const { createMainWindow, getMainWindow } = require('./window.cjs');
const { registerPrinterService } = require('../services/printer.cjs');
const { registerFilesystemService } = require('../services/filesystem.cjs');
const { registerNetworkService } = require('../services/network.cjs');
const { registerSystemService } = require('../services/system.cjs');
const { checkForUpdates } = require('./updater.cjs');

// 1. Garantir Instância Única (Impede múltiplas instâncias do Kiteke Pro em execução)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.warn('[Kiteke Pro] Uma instância da aplicação já está em execução. Encerrando segunda instância.');
  app.quit();
  process.exit(0);
} else {
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// 2. Otimizações de Desempenho e Compatibilidade (Windows 7 SP1 / 8 / 8.1 / 10 / 11)
app.commandLine.appendSwitch('disable-http-cache', 'false');
// Desativa recursos desnecessários em background
app.commandLine.appendSwitch('disable-background-timer-throttling', 'false');

// Compatibilidade específica para sistemas Windows 7 (NT 6.1) e Windows 8/8.1 (NT 6.2/6.3)
if (process.platform === 'win32') {
  const release = os.release();
  const isLegacyWindows = release.startsWith('6.1') || release.startsWith('6.2') || release.startsWith('6.3');
  if (isLegacyWindows) {
    console.log(`[Kiteke Pro] Compatibilidade ativa para Windows Legado (NT Kernel ${release})`);
    // Previne erros de GPU sandbox com drivers de vídeo clássicos do Windows 7
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('disable-software-rasterizer');
  }
}

// 3. Registo dos Serviços IPC
function setupIpcHandlers() {
  registerPrinterService();
  registerFilesystemService();
  registerNetworkService();
  registerSystemService();

  // Controlo da Janela
  ipcMain.handle('app:minimize', () => {
    const win = getMainWindow();
    if (win) win.minimize();
  });

  ipcMain.handle('app:maximize', () => {
    const win = getMainWindow();
    if (win) win.maximize();
  });

  ipcMain.handle('app:unmaximize', () => {
    const win = getMainWindow();
    if (win) win.unmaximize();
  });

  ipcMain.handle('app:close', () => {
    const win = getMainWindow();
    if (win) win.close();
  });

  ipcMain.handle('app:is-maximized', () => {
    const win = getMainWindow();
    return win ? win.isMaximized() : false;
  });

  ipcMain.handle('app:get-info', () => ({
    name: config.appName,
    version: config.version,
    electronVersion: config.electronVersion,
  }));

  ipcMain.handle('updater:check', async () => {
    return await checkForUpdates();
  });
}

// 4. Inicialização do Ciclo de Vida da Aplicação
app.whenReady().then(() => {
  setupIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (getMainWindow() === null) {
      createMainWindow();
    }
  });

  console.log(`[Kiteke Pro] Desktop Shell iniciado com sucesso. Motor: Electron ${config.electronVersion}`);
});

// 5. Encerramento
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 6. Tratamento de Exceções Não Capturadas (Sem expor stack traces a utilizadores finais)
process.on('uncaughtException', (error) => {
  console.error('[Kiteke Pro Main Error]:', error.message || error);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Kiteke Pro Unhandled Rejection]:', reason);
});
