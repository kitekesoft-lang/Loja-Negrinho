/**
 * Kiteke Pro Desktop - Serviço de Impressão Windows
 * Suporte a impressoras térmicas (58mm/80mm) e impressoras de escritório A4
 */
const { ipcMain } = require('electron');

function registerPrinterService() {
  // 1. Obter lista de impressoras instaladas no Windows
  ipcMain.handle('printer:get-list', async (event) => {
    try {
      const printers = await event.sender.getPrintersAsync();
      return { success: true, printers };
    } catch (err) {
      console.error('[Kiteke Pro Printer] Falha ao listar impressoras:', err);
      return { success: false, error: err.message, printers: [] };
    }
  });

  // 2. Executar impressão direta (silenciosa ou com diálogo do Windows)
  ipcMain.handle('printer:print', async (event, options = {}) => {
    return new Promise((resolve) => {
      const printOptions = {
        silent: options.silent || false,
        printBackground: true,
        deviceName: options.deviceName || '',
        color: options.color !== false,
        margins: options.margins || { marginType: 'none' },
        landscape: options.landscape || false,
        pagesPerSheet: 1,
        collate: true,
        copies: options.copies || 1,
        header: '',
        footer: '',
      };

      event.sender.print(printOptions, (success, errorType) => {
        if (!success) {
          console.warn('[Kiteke Pro Printer] Impressão cancelada ou falhou:', errorType);
          resolve({ success: false, error: errorType });
        } else {
          console.log('[Kiteke Pro Printer] Impressão concluída com sucesso.');
          resolve({ success: true });
        }
      });
    });
  });

  // 3. Gerar PDF directamente a partir do conteúdo
  ipcMain.handle('printer:print-to-pdf', async (event, options = {}) => {
    try {
      const pdfData = await event.sender.printToPDF({
        printBackground: true,
        landscape: options.landscape || false,
        pageSize: options.pageSize || 'A4',
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 },
      });
      return { success: true, data: pdfData.toString('base64') };
    } catch (err) {
      console.error('[Kiteke Pro Printer] Falha ao gerar PDF:', err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  registerPrinterService,
};
