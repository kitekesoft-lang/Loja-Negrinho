/**
 * Kiteke Pro Desktop - Gestor da Janela Principal
 */
const { BrowserWindow } = require('electron');
const config = require('../config/app.config.cjs');
const { applySecurityPolicies } = require('./security.cjs');

let mainWindow = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: config.window.title,
    width: config.window.defaultWidth,
    height: config.window.defaultHeight,
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    center: true,
    show: false, // Revela apenas no 'ready-to-show' para evitar flash em branco
    backgroundColor: config.window.backgroundColor,
    icon: config.paths.iconPng,
    autoHideMenuBar: true,
    webPreferences: {
      preload: config.paths.preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Aplica políticas de segurança
  applySecurityPolicies(mainWindow, config.isDev);

  // Evita tela branca antes de renderizar
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Tratamento de falhas do processo de renderização (Crash Recovery)
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Kiteke Pro] Processo de renderização falhou:', details.reason);
    if (details.reason !== 'clean-exit') {
      mainWindow.reload();
    }
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('[Kiteke Pro] Janela temporariamente não responsiva.');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('[Kiteke Pro] Janela recuperada e responsiva.');
  });

  // Carregamento de conteúdo
  if (config.isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(config.paths.rendererDist);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createMainWindow,
  getMainWindow,
};
