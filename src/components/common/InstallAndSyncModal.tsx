import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { FiscalDatabase } from '../../core/fiscal/repository/FiscalDatabase';
import { LocalPersistenceEngine } from '../../core/fiscal/storage/LocalPersistenceEngine';
import {
  Download,
  Monitor,
  Smartphone,
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  FileDown,
  Upload,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  QrCode,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Share2,
  Globe,
  Terminal,
  Layers,
  AlertTriangle,
  FolderArchive,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import QRCode from 'qrcode';
import { AndroidInstallGuideModal } from './AndroidInstallGuideModal';
import { getPublicShareableUrl, openAndroidChrome } from '../../utils/appUrl';

interface InstallAndSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'INSTALLER' | 'STORAGE' | 'NETLIFY';
}

export const InstallAndSyncModal: React.FC<InstallAndSyncModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'INSTALLER',
}) => {
  const [activeTab, setActiveTab] = useState<'INSTALLER' | 'STORAGE' | 'NETLIFY'>(initialTab);
  const { isInstalled, isInstallable, isWindows, isAndroid, promptInstall, downloadWindowsLauncher, downloadWindowsShortcut } = usePWAInstall();
  const { isOnline, pendingSyncCount, isSyncing, lastSyncTime, triggerSync } = useNetworkStatus();

  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloadingExe, setIsDownloadingExe] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadProgressText, setDownloadProgressText] = useState<string>('');
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showHowToOpenExe, setShowHowToOpenExe] = useState(false);

  const publicUrl = getPublicShareableUrl();

  if (!isOpen) return null;

  const db = FiscalDatabase.getInstance();

  const handleManualSync = async () => {
    const res = await triggerSync();
    if (res.success) {
      setSyncFeedback(`Sincronização concluída com sucesso! ${res.syncedItems} transações enviadas para a nuvem.`);
    } else {
      setSyncFeedback('Erro ao conectar ao servidor de nuvem. Dados seguros localmente no dispositivo.');
    }
    setTimeout(() => setSyncFeedback(null), 4500);
  };

  const handleExportBackup = () => {
    const jsonStr = LocalPersistenceEngine.exportFullBackupJSON(db);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup-MinhaLoja-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSyncFeedback('Cópia de segurança local descarregada com sucesso!');
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = LocalPersistenceEngine.importBackupJSON(content, db);
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleGenerateQr = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(publicUrl, {
        width: 260,
        margin: 1.5,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrCodeDataUrl(dataUrl);
      setShowQrCode(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInstallAndroidClick = async () => {
    if (isInstallable) {
      const res = await promptInstall();
      if (res === 'accepted') {
        setSyncFeedback('Aplicação instalada com sucesso no dispositivo!');
        return;
      }
    }
    // Abrir o guia visual completo e interativo
    setShowAndroidGuideModal(true);
  };

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedUrl(true);
      setSyncFeedback('Link público copiado com sucesso! Pode colar no Chrome do telemóvel.');
      setTimeout(() => setCopiedUrl(false), 3000);
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch {
      setSyncFeedback('Não foi possível copiar automaticamente.');
    }
  };

  const handleDownloadWindowsZip = async () => {
    setIsDownloadingExe(true);
    setDownloadProgress(0);
    setDownloadProgressText('A iniciar transferência segura do pacote Windows (90.4 MB)...');
    setDownloadError(null);

    try {
      const response = await fetch('/downloads/Kiteke-Pro-Portable-x64.zip', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Servidor retornou erro HTTP ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 94809066;

      if (!response.body) {
        const blob = await response.blob();
        await validateAndSaveZipBlob(blob);
        return;
      }

      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          const pct = totalBytes > 0 ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : 0;
          setDownloadProgress(pct);
          const currentMb = (receivedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
          setDownloadProgressText(`${currentMb} MB / ${totalMb} MB (${pct}%)`);
        }
      }

      const blob = new Blob(chunks as unknown as BlobPart[], { type: 'application/zip' });
      await validateAndSaveZipBlob(blob);
    } catch (err: unknown) {
      console.error('Erro no download:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setDownloadError(
        `O download foi interrompido antes do fim: ${msg}. Pode utilizar como alternativa recomendada a instalação em 1-clique (PWA) ou o Lançador .BAT.`
      );
    } finally {
      setIsDownloadingExe(false);
    }
  };

  const validateAndSaveZipBlob = async (blob: Blob) => {
    if (blob.size < 5000000) {
      const textSample = await blob.slice(0, 500).text();
      if (textSample.includes('<html') || textSample.includes('302 Found') || textSample.includes('cookie_check')) {
        throw new Error(
          'O servidor retornou uma página de verificação HTML em vez do arquivo binário completo.'
        );
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Kiteke-Pro-Portable-x64.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setShowHowToOpenExe(true);
    setSyncFeedback('Download concluído com sucesso (90.4 MB)! Extraia o ficheiro ZIP antes de executar.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Instalador &amp; Armazenamento Local / Nuvem
              </h2>
              <p className="text-xs text-slate-500">
                Instalação nativa para Windows e Android • Operação Offline com Sincronização em Nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('INSTALLER')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'INSTALLER'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Instalador (Windows &amp; Android)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STORAGE')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'STORAGE'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Armazenamento Local &amp; Nuvem</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('NETLIFY')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'NETLIFY'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Publicação Netlify</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {syncFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* ========================================================
            ABA 1: INSTALADOR PARA WINDOWS E ANDROID
            ======================================================== */}
        {activeTab === 'INSTALLER' && (
          <div className="space-y-4 text-xs">
            {isInstalled && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-blue-900 font-medium">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  A aplicação já está a ser executada em <strong>Modo Nativo Standalone</strong> no seu dispositivo.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bloco Windows */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">Windows (PC / Caixa)</span>
                    </div>
                    {isWindows && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        Detectado
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    Instale como aplicativo nativo no computador de caixa. Abre sem barras de navegação, cria atalho no ambiente de trabalho e menu iniciar.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-200">
                  {/* Botão de Download Interativo com Barra de Progresso */}
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={handleDownloadWindowsZip}
                      disabled={isDownloadingExe}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-wait shadow-xs text-xs"
                      title="Descarregar pacote portátil com Kiteke Pro.exe nativo para Windows 7, 8, 8.1, 10 e 11"
                    >
                      {isDownloadingExe ? (
                        <>
                          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          <span>A transferir pacote completo (90.4 MB)...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-amber-400" />
                          <span>Descarregar Pacote Windows (Kiteke Pro.exe)</span>
                        </>
                      )}
                    </button>

                    {/* Barra de Progresso em Tempo Real */}
                    {isDownloadingExe && (
                      <div className="space-y-1 p-2 bg-slate-100 rounded-xl border border-slate-200 text-[11px]">
                        <div className="flex justify-between font-mono font-bold text-slate-700 text-[10.5px]">
                          <span>Progresso da Transferência</span>
                          <span>{downloadProgressText || `${downloadProgress}%`}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-150 rounded-full"
                            style={{ width: `${downloadProgress || 5}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Aguarde o download integral de 90.4 MB para que o arquivo não fique corrompido.
                        </p>
                      </div>
                    )}

                    {/* Mensagem de Erro com Explicação Clara */}
                    {downloadError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Bloqueio de Download no Navegador Cloud</span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-rose-700">
                          O ambiente de visualização da Cloud bloqueou a transferência de ficheiros binários pesados de 90 MB. 
                          Pode abrir o ficheiro diretamente numa nova aba ou instalar a versão nativa em 1-clique abaixo:
                        </p>
                        <div className="flex gap-2 pt-1">
                          <a
                            href="/downloads/Kiteke-Pro-Portable-x64.zip"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10.5px] text-center flex items-center justify-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir em Nova Aba</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              const fullUrl = `${window.location.origin}/downloads/Kiteke-Pro-Portable-x64.zip`;
                              navigator.clipboard.writeText(fullUrl);
                              setSyncFeedback('Link de download copiado! Cole na barra de endereço do Chrome.');
                              setTimeout(() => setSyncFeedback(null), 4000);
                            }}
                            className="py-1.5 px-2.5 bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 font-semibold rounded-lg text-[10.5px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3 text-rose-600" />
                            <span>Copiar Link</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Caixa Explicativa: Como Extrair e Executar no Windows */}
                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-[11px] text-amber-950 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <FolderArchive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Como abrir o sistema no Windows:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-amber-900/90 leading-relaxed pl-1">
                      <li>O ficheiro descarregado é um arquivo compactado <strong>.ZIP de 90.4 MB</strong>.</li>
                      <li>Clique com o <strong>botão direito</strong> do rato no arquivo e selecione <strong>"Extrair Tudo..."</strong> (ou extraia com o WinRAR).</li>
                      <li>Entre na pasta extraída e execute o ficheiro <strong>"Kiteke Pro.exe"</strong>.</li>
                    </ol>
                    <div className="pt-1 text-[10px] text-amber-800/90 border-t border-amber-200/60 flex items-start gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Aviso WinRAR "formato desconhecido ou danificado":</strong> Ocorre se o ficheiro tiver apenas alguns KB (download incompleto/interrompido). Verifique se o ficheiro atinge os <strong>90 MB</strong> completos.
                      </span>
                    </div>
                  </div>

                  {/* Opção Recomendada: PWA Instantâneo */}
                  <div className="space-y-1 pt-1">
                    <button
                      type="button"
                      onClick={promptInstall}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs text-xs"
                    >
                      <Monitor className="w-4 h-4 text-cyan-300" />
                      <span>Instalação Rápida PWA no Windows (1-Clique)</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      ⭐ Recomendado: Abre em janela nativa, cria ícone no Desktop e funciona offline sem precisar de extrair ZIP.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={downloadWindowsLauncher}
                      className="flex-1 py-2 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Descarregar script executável .bat para arranque instantâneo"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lançador .BAT</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadWindowsShortcut}
                      className="flex-1 py-2 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Descarregar atalho de internet para a área de trabalho"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>Atalho Desktop</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bloco Android */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-sm text-slate-900">Android (Telemóvel &amp; Tablet)</span>
                    </div>
                    {isAndroid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Detectado
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11.5px] leading-relaxed">
                    Instalação direta no smartphone ou tablet Android via WebAPK com ícone no ecrã principal, suporte à câmara para leitura de códigos e ecrã inteiro.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleInstallAndroidClick}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Instalar no Android (Guia &amp; App)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    className="w-full py-2 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>QR Code para Abrir no Telemóvel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* QR Code Modal Display com Ações Interativas */}
            {showQrCode && qrCodeDataUrl && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code de Instalação Android"
                  className="w-32 h-32 rounded-xl bg-white p-2 border border-emerald-200 shadow-xs shrink-0"
                />
                <div className="space-y-2 flex-1 w-full text-emerald-950">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs flex items-center justify-center sm:justify-start gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Aponte a câmara do seu telemóvel Android</span>
                    </div>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      Abre a versão pública oficial sem necessidade de login. Para instalar, abra no <strong>Google Chrome</strong> e toque em &quot;Instalar aplicativo&quot;.
                    </p>
                  </div>

                  {/* URL e Botões de Ação Imediata */}
                  <div className="bg-white/80 border border-emerald-200/80 rounded-xl p-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-emerald-900 truncate px-1">
                      {publicUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10.5px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs transition-colors"
                    >
                      {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => openAndroidChrome(publicUrl)}
                      className="py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-[10.5px] flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir no Android / Chrome</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAndroidGuideModal(true)}
                      className="py-1.5 px-2.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg font-semibold text-[10.5px] flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Smartphone className="w-3 h-3 text-emerald-600" />
                      <span>Ver Guia Passo a Passo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            ABA 2: ARMAZENAMENTO LOCAL & NUVEM
            ======================================================== */}
        {activeTab === 'STORAGE' && (
          <div className="space-y-4 text-xs">
            {/* Estado de Ligação Online / Offline */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    isOnline ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}
                >
                  {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>{isOnline ? 'Ligado à Internet (Online)' : 'Modo Offline (Sem Internet)'}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isOnline ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {isOnline ? 'NUVEM ACTIVA' : 'LOCAL ATIVO'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isOnline
                      ? 'Sincronização bidirecional em tempo real com o servidor de nuvem.'
                      : 'Todas as vendas e operações são gravadas no armazenamento local persistente do dispositivo.'}
                  </p>
                </div>
              </div>

              {isOnline && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>
              )}
            </div>

            {/* Explicação da Arquitetura Híbrida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>1. Armazenamento Local (Offline)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Os artigos, preços, códigos de barras, clientes e o histórico fiscal de documentos são mantidos no armazenamento persistente do browser/dispositivo. Não depende de internet para vender.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>2. Sincronização em Nuvem (Online)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Logo que o dispositivo detecta conexão à internet, a fila de pendentes sincroniza automaticamente com a nuvem, garantindo segurança contra perda de dados do equipamento físico.
                </p>
              </div>
            </div>

            {/* Cópias de Segurança Manuais */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Cópia de Segurança do Sistema (Backup Local)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Exporte ou importe a totalidade da base de dados em formato JSON portátil.
                  </p>
                </div>
                {lastSyncTime && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Último: {new Date(lastSyncTime).toLocaleTimeString('pt-AO')}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Exportar Backup (Ficheiro JSON)</span>
                </button>

                <label className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Restaurar Ficheiro de Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            ABA 3: PUBLICAÇÃO NO NETLIFY (ACESSO PÚBLICO)
            ======================================================== */}
        {activeTab === 'NETLIFY' && (
          <div className="space-y-4 text-xs">
            {/* Status de Prontidão Netlify */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-teal-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span>Publicação no Netlify 100% Configurada</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-200 text-teal-900">
                      PRONTO PARA DEPLOY
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-900/80 mt-0.5">
                    Os ficheiros <code>netlify.toml</code> e <code>public/_redirects</code> já estão incluídos no projeto com suporte a PWA e SPA Routing.
                  </p>
                </div>
              </div>
            </div>

            {/* Parâmetros de Configuração Netlify */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-600" />
                <span>Parâmetros de Construção no Netlify (Build Settings)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">Build Command:</span>
                  <div className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded-md">
                    npm run build
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-sans font-bold">Publish Directory:</span>
                  <div className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded-md">
                    dist
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Métodos de Publicação */}
            <div className="space-y-2.5">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Como Publicar no Netlify: 3 Opções Rápidas</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11.5px]">
                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                    1
                  </div>
                  <div className="font-bold text-slate-900">Netlify Drop (Sem Código)</div>
                  <p className="text-slate-600 leading-snug">
                    Execute <code>npm run build</code> e arraste a pasta <strong>dist</strong> para <span className="text-teal-700 font-semibold">app.netlify.com/drop</span>. Fica online em segundos!
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs">
                    2
                  </div>
                  <div className="font-bold text-slate-900">Git / GitHub (Automático)</div>
                  <p className="text-slate-600 leading-snug">
                    Conecte o repositório ao Netlify. O Netlify deteta o <code>netlify.toml</code> e atualiza o site automaticamente a cada commit.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center text-xs">
                    3
                  </div>
                  <div className="font-bold text-slate-900">Netlify CLI (Terminal)</div>
                  <p className="text-slate-600 leading-snug">
                    No terminal do projeto, execute <code>npx netlify deploy --prod</code> para enviar e publicar diretamente da linha de comandos.
                  </p>
                </div>
              </div>
            </div>

            {/* Vantagens do Netlify para o POS */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600 text-[11px]">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Vantagens para o Ponto de Venda e Telemóveis:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>HTTPS / SSL gratuito automático (obrigatório para scanner de código de barras por câmara e PWA offline).</li>
                <li>Domínio gratuito imediato (ex: <code>minhaloja-pos.netlify.app</code>) ou domínio próprio personalizado (ex: <code>loja.ao</code>).</li>
                <li>CDN ultrarrápido global com suporte completo a Service Workers e cache de produtos local.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal Específico do Guia de Instalação Android */}
      <AndroidInstallGuideModal
        isOpen={showAndroidGuideModal}
        onClose={() => setShowAndroidGuideModal(false)}
      />
    </div>
  );
};
