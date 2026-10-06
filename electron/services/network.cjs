/**
 * Kiteke Pro Desktop - Serviço de Monitorização de Rede
 */
const { ipcMain, net } = require('electron');

function registerNetworkService() {
  ipcMain.handle('network:check-status', async () => {
    return {
      isOnline: net.isOnline(),
      checkedAt: new Date().toISOString(),
    };
  });
}

module.exports = {
  registerNetworkService,
};
