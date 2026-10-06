/**
 * Kiteke Pro Desktop - Gestor de Atualizações
 *
 * REGRA CRÍTICA:
 * A versão LEGACY do Kiteke Pro (Electron 22.3.27) mantém compatibilidade estrita
 * com Windows 7, Windows 8 e Windows 8.1.
 * O atualizador NUNCA deve atualizar automaticamente esta versão para o Electron 23+,
 * sob pena de quebrar a execução em máquinas legadas de clientes em Angola.
 */
const os = require('os');
const config = require('../config/app.config.cjs');

function getWindowsTrack() {
  const release = os.release(); // ex: '6.1.7601' para Windows 7
  const major = parseInt(release.split('.')[0], 10);
  const minor = parseInt(release.split('.')[1], 10);

  // Windows 7 = 6.1, Windows 8 = 6.2, Windows 8.1 = 6.3
  // Windows 10/11 = 10.0+
  const isLegacyWindows = major === 6 && (minor === 1 || minor === 2 || minor === 3);

  return {
    track: isLegacyWindows ? 'LEGACY' : 'MODERN',
    osRelease: release,
    isLegacyWindows,
    electronVersion: config.electronVersion,
  };
}

async function checkForUpdates() {
  const trackInfo = getWindowsTrack();
  console.log(`[Kiteke Pro Updater] Verificação de atualizações. Linha ativa: ${trackInfo.track} (OS: ${trackInfo.osRelease})`);

  // Em modo Legacy, garantimos que atualizações automáticas de motor Electron estão bloqueadas
  if (trackInfo.isLegacyWindows) {
    return {
      updateAvailable: false,
      currentVersion: config.version,
      electronVersion: config.electronVersion,
      track: 'LEGACY',
      message: 'Sistema a correr em Windows Legado (Win 7/8/8.1). Atualizações de motor Electron travadas em 22.3.27 por estabilidade.',
    };
  }

  return {
    updateAvailable: false,
    currentVersion: config.version,
    electronVersion: config.electronVersion,
    track: 'MODERN',
    message: 'Sistema atualizado na versão mais recente.',
  };
}

module.exports = {
  getWindowsTrack,
  checkForUpdates,
};
