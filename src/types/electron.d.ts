export interface ElectronAPI {
  isDesktop: boolean;
  isElectron: boolean;
  platform: string;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getPrinters: () => Promise<{ success: boolean; printers: any[]; error?: string }>;
  print: (options?: any) => Promise<{ success: boolean; error?: string }>;
  printToPDF: (options?: any) => Promise<{ success: boolean; data?: string; error?: string }>;
  savePDF: (defaultName: string, base64Data: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  getSystemInfo: () => Promise<any>;
  checkNetwork: () => Promise<{ isOnline: boolean; checkedAt: string }>;
  checkForUpdates: () => Promise<any>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
