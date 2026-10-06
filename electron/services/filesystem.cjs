/**
 * Kiteke Pro Desktop - Serviço de Ficheiros e PDFs
 */
const { ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');

function registerFilesystemService() {
  // Salvar PDF no disco com diálogo nativo do Windows
  ipcMain.handle('filesystem:save-pdf', async (event, { defaultName, base64Data }) => {
    try {
      const window = event.sender.getOwnerBrowserWindow();
      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Guardar Documento PDF — Kiteke Pro',
        defaultPath: defaultName || 'Documento_Kiteke_Pro.pdf',
        filters: [
          { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] },
          { name: 'Todos os Ficheiros (*.*)', extensions: ['*'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }

      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      return { success: true, filePath };
    } catch (err) {
      console.error('[Kiteke Pro Filesystem] Falha ao guardar PDF:', err);
      return { success: false, error: err.message };
    }
  });

  // Abrir ficheiro com leitor nativo do sistema (ex: Adobe Acrobat, Foxit)
  ipcMain.handle('filesystem:open-path', async (event, filePath) => {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, error: 'Caminho inválido' };
      }
      const result = await shell.openPath(filePath);
      if (result) {
        return { success: false, error: result };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  registerFilesystemService,
};
