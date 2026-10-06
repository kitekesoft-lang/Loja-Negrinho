/**
 * Kiteke Pro Desktop - Informações de Sistema & Diagnóstico
 */
const { ipcMain, app } = require('electron');
const os = require('os');
const config = require('../config/app.config.cjs');
const { getWindowsTrack } = require('../main/updater.cjs');

function getWindowsFriendlyName() {
  const release = os.release();
  const major = parseInt(release.split('.')[0], 10);
  const minor = parseInt(release.split('.')[1], 10);

  if (major === 6 && minor === 1) return 'Windows 7';
  if (major === 6 && minor === 2) return 'Windows 8';
  if (major === 6 && minor === 3) return 'Windows 8.1';
  if (major === 10 && minor === 0) {
    const build = parseInt(release.split('.')[2] || '0', 10);
    return build >= 22000 ? 'Windows 11' : 'Windows 10';
  }
  return `Windows NT ${release}`;
}

function registerSystemService() {
  ipcMain.handle('system:get-status', async () => {
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const track = getWindowsTrack();

    return {
      appName: config.appName,
      appVersion: config.version,
      electronVersion: process.versions.electron || config.electronVersion,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
      platform: process.platform,
      arch: process.arch, // 'x64' ou 'ia32'
      osRelease: os.release(),
      osFriendlyName: getWindowsFriendlyName(),
      track: track.track,
      isLegacyWindows: track.isLegacyWindows,
      memory: {
        totalMb: totalMemMb,
        freeMb: freeMemMb,
        usedMb: totalMemMb - freeMemMb,
      },
    };
  });
}

module.exports = {
  registerSystemService,
  getWindowsFriendlyName,
};
