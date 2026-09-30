import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Share2,
  FileDown,
  X,
  Sparkles,
  HelpCircle,
  WifiOff,
  ScanBarcode,
  Layers,
} from 'lucide-react';
import { getPublicShareableUrl, openAndroidChrome } from '../../utils/appUrl';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AndroidInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallGuideModal: React.FC<AndroidInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstalled, isAndroid, promptInstall, downloadAndroidLauncher, shareAppUrl } =
    usePWAInstall();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const publicUrl = getPublicShareableUrl();

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(publicUrl, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code Android:', err));
    }
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setActionFeedback('Link copiado com sucesso! Pode colar no Chrome ou partilhar.');
      setTimeout(() => {
        setCopied(false);
        setActionFeedback(null);
      }, 3500);
    } catch {
      setActionFeedback('Não foi possível copiar automaticamente. Selecione e copie o link acima.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const handleOpenChrome = () => {
    setActionFeedback('A abrir no navegador...');
    openAndroidChrome(publicUrl);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleShare = async () => {
    const success = await shareAppUrl();
    if (success) {
      setActionFeedback('Partilhado com sucesso!');
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleNativePrompt = async () => {
    const res = await promptInstall();
    if (res === 'accepted') {
      setActionFeedback('Aplicação instalada com sucesso no dispositivo!');
      setTimeout(() => setActionFeedback(null), 4000);
    } else if (res === 'manual') {
      setActionFeedback('Siga os 3 passos abaixo no Chrome do seu telemóvel para instalar.');
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg">Instalador &amp; Acesso Android</h3>
                {isAndroid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-300 text-emerald-950 uppercase tracking-wider">
                    Android Detectado
                  </span>
                )}
              </div>
              <p className="text-emerald-100 text-xs">
                Smartphone &bull; Tablet &bull; Operação Offline &bull; Leitor de Câmara
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback visual dinâmico */}
        {actionFeedback && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-900 font-semibold flex items-center gap-2 animate-in slide-in-from-top-1">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Conteúdo Principal Rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Seção 1: QR Code & Link Direto */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="relative group shrink-0">
              {qrCodeUrl ? (
                <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code para Telemóvel Android"
                    className="w-36 h-36 sm:w-40 sm:h-40 rounded-xl"
                  />
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                    <QrCode className="w-3 h-3 text-emerald-600" />
                    <span>Leitura Instantânea</span>
                  </div>
                </div>
              ) : (
                <div className="w-40 h-40 bg-slate-200 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">
                  <QrCode className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2.5 text-center sm:text-left">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  URL Público Verificado
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Aponte a câmara do seu telemóvel
                </h4>
                <p className="text-slate-600 text-[11.5px] leading-relaxed">
                  Abra a app de câmara ou scanner do Android para abrir o sistema diretamente. Sem necessidade de logins externos.
                </p>
              </div>

              {/* Caixa com o endereço e botão de copiar */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between gap-2 shadow-2xs">
                <div className="font-mono text-[11px] text-slate-700 truncate select-all px-1">
                  {publicUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                  title="Copiar endereço"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenChrome}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Android</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs text-center"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Partilhar Link</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seção 2: Passos para Instalar como App Nativa no Android */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Como instalar no Android em 3 passos:
              </h4>
              <span className="text-[10px] text-slate-500 font-medium">
                Google Chrome &bull; Samsung Browser
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11.5px]">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  1
                </div>
                <div className="font-bold text-slate-900">Abra o Link</div>
                <p className="text-slate-600 leading-snug">
                  Abra o endereço no <strong>Google Chrome</strong> do seu smartphone ou tablet Android.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div className="font-bold text-slate-900">Menu de Opções</div>
                <p className="text-slate-600 leading-snug">
                  Toque nos <strong>3 pontinhos (&vellip;)</strong> no canto superior direito do navegador.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </div>
                <div className="font-bold text-slate-900">Instalar Aplicativo</div>
                <p className="text-slate-600 leading-snug">
                  Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar ao ecrã inicial&quot;</strong>.
                </p>
              </div>
            </div>

            {/* Botão de Instalação Automática Direta */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={handleNativePrompt}
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Instalar Agora neste Dispositivo</span>
              </button>

              <button
                type="button"
                onClick={downloadAndroidLauncher}
                className="w-full sm:w-auto py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Descarregar ficheiro HTML para abrir no telemóvel"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Descarregar Lançador (.html)</span>
              </button>
            </div>
          </div>

          {/* Seção 3: Vantagens no Android */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold text-[11px]">100% Offline (Local)</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2">
              <ScanBarcode className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold text-[11px]">Scanner por Câmara</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2 col-span-2 sm:col-span-1">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold text-[11px]">Sem Barras / Ecrã Total</span>
            </div>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Compatível com Android 8.0 ou superior (WebAPK nativo).</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
