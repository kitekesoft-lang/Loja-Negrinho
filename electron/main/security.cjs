/**
 * Kiteke Pro Desktop - Políticas de Segurança Electron
 * Aplica: contextIsolation, bloqueio de devtools em prod, validação de URLs e IPC
 */
const { app, shell } = require('electron');

const ALLOWED_IPC_CHANNELS = new Set([
  'app:get-info',
  'app:minimize',
  'app:maximize',
  'app:unmaximize',
  'app:close',
  'app:is-maximized',
  'printer:get-list',
  'printer:print',
  'printer:print-to-pdf',
  'filesystem:save-pdf',
  'filesystem:open-path',
  'system:get-status',
  'network:check-status',
  'updater:check',
]);

function applySecurityPolicies(mainWindow, isDev) {
  // 1. Bloquear abertura de novas janelas arbitrárias (window.open)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Apenas permitir links externos seguros via navegador padrão do sistema
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // 2. Bloquear navegações não intencionais
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // Permitir apenas navegação local em ficheiro ou localhost em desenvolvimento
    if (parsedUrl.protocol !== 'file:' && !(isDev && parsedUrl.hostname === 'localhost')) {
      event.preventDefault();
      console.warn(`[Kiteke Pro Security] Navegação bloqueada para: ${navigationUrl}`);
    }
  });

  // 3. Desativar DevTools em produção por segurança empresarial
  if (!isDev) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  // 4. Injetar Content Security Policy (CSP) seguro
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: file: http://localhost:* https://*;",
        ],
      },
    });
  });
}

function isValidIpcChannel(channel) {
  return ALLOWED_IPC_CHANNELS.has(channel);
}

module.exports = {
  applySecurityPolicies,
  isValidIpcChannel,
  ALLOWED_IPC_CHANNELS,
};
