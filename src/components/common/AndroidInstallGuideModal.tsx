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
  ArrowRight,
  AlertTriangle,
  Globe,
  Compass,
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
  const {
    isInstallable,
    isInstalled,
    isAndroid,
    isIOS,
    isChrome,
    isSamsung,
    isInAppBrowser,
    promptInstall,
    downloadAndroidLauncher,
    shareAppUrl,
  } = usePWAInstall();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [activeBrowserTab, setActiveBrowserTab] = useState<'CHROME' | 'SAMSUNG' | 'XIAOMI' | 'IOS'>(() => {
    if (isIOS) return 'IOS';
    if (isSamsung) return 'SAMSUNG';
    return 'CHROME';
  });

  const publicUrl = getPublicShareableUrl();

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(publicUrl, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#061224',
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
      setActionFeedback('Link copiado com sucesso! Pode colar no Google Chrome do telemóvel.');
      setTimeout(() => {
        setCopied(false);
        setActionFeedback(null);
      }, 3500);
    } catch {
      setActionFeedback('Não foi possível copiar automaticamente. Selecione e copie o endereço.');
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const handleOpenChrome = () => {
    setActionFeedback('A abrir no navegador Google Chrome...');
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
    setActionFeedback('A verificar permissões de instalação do navegador...');
    const res = await promptInstall();
    if (res === 'accepted') {
      setActionFeedback('🎉 Aplicação instalada com sucesso no telemóvel!');
      setTimeout(() => setActionFeedback(null), 4000);
    } else if (res === 'dismissed') {
      setActionFeedback('Instalação cancelada. Pode tentar novamente quando desejar.');
      setTimeout(() => setActionFeedback(null), 3500);
    } else {
      setActionFeedback('Siga os passos abaixo no menu do navegador para fixar no ecrã.');
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  const isMobileDevice = isAndroid || isIOS || (typeof window !== 'undefined' && window.innerWidth < 768);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-[#061224] text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg">Instalação no Telemóvel</h3>
                {isAndroid && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400 text-emerald-950 uppercase tracking-wider">
                    Android
                  </span>
                )}
                {isIOS && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-300 text-sky-950 uppercase tracking-wider">
                    iOS / iPhone
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-xs">
                App autónoma &bull; Sem barra de URL &bull; Funciona 100% Offline
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
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 text-xs text-blue-900 font-semibold flex items-center gap-2 animate-in slide-in-from-top-1">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Alerta de Navegador In-App (WhatsApp, Facebook, Instagram) */}
          {isInAppBrowser && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Navegador Interno Detectado (WhatsApp / Redes Sociais)</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                O navegador embutido do WhatsApp ou redes sociais <strong>bloqueia a instalação de PWAs</strong>. Para instalar a App:
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenChrome}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir no Google Chrome</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="py-2 px-3 bg-white border border-amber-300 text-amber-900 font-bold rounded-xl flex items-center gap-1.5 shadow-2xs hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </button>
              </div>
            </div>
          )}

          {/* Botão de Ação Direta Principal */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Instalação Direta no Ecrã Principal</span>
                </h4>
                <p className="text-[11.5px] text-slate-600">
                  {isInstallable
                    ? 'O seu navegador suporta instalação imediata em 1 toque.'
                    : 'Toque abaixo para disparar o instalador ou siga o guia do seu navegador.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleNativePrompt}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer text-sm"
              >
                <Smartphone className="w-4.5 h-4.5" />
                <span>Instalar Aplicativo Agora</span>
              </button>

              <button
                type="button"
                onClick={downloadAndroidLauncher}
                className="py-3 px-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Descarregar ficheiro de lançamento rápido para o telemóvel"
              >
                <FileDown className="w-4 h-4 text-blue-600" />
                <span>Lançador Offline (.html)</span>
              </button>
            </div>
          </div>

          {/* Guias Específicos por Navegador */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Passo a Passo Manual no Telemóvel:</span>
              </h4>
            </div>

            {/* Abas de Navegadores */}
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveBrowserTab('CHROME')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeBrowserTab === 'CHROME'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Chrome
              </button>
              <button
                type="button"
                onClick={() => setActiveBrowserTab('SAMSUNG')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeBrowserTab === 'SAMSUNG'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Samsung Internet
              </button>
              <button
                type="button"
                onClick={() => setActiveBrowserTab('XIAOMI')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeBrowserTab === 'XIAOMI'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Xiaomi / Outros
              </button>
              <button
                type="button"
                onClick={() => setActiveBrowserTab('IOS')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  activeBrowserTab === 'IOS'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                iPhone (Safari)
              </button>
            </div>

            {/* Conteúdo da Aba Chrome */}
            {activeBrowserTab === 'CHROME' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="font-bold text-slate-900">Abra no Chrome</div>
                  <p className="text-slate-600 leading-snug">
                    Aceda ao link da aplicação directamente no <strong>Google Chrome</strong> do telemóvel.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-slate-900">Toque nos 3 Pontos (⋮)</div>
                  <p className="text-slate-600 leading-snug">
                    Toque no menu <strong>⋮</strong> no canto superior direito do Google Chrome.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-slate-900">Instalar Aplicativo</div>
                  <p className="text-slate-600 leading-snug">
                    Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar ao ecrã inicial&quot;</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba Samsung */}
            {activeBrowserTab === 'SAMSUNG' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="font-bold text-slate-900">Menu Inferior (☰)</div>
                  <p className="text-slate-600 leading-snug">
                    Toque no botão de menu <strong>☰</strong> (três linhas) no canto inferior direito.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-slate-900">+ Adicionar Página A</div>
                  <p className="text-slate-600 leading-snug">
                    Selecione a opção <strong>&quot;+ Adicionar página a&quot;</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-slate-900">Ecrã Principal</div>
                  <p className="text-slate-600 leading-snug">
                    Escolha <strong>&quot;Ecrã principal&quot;</strong>. O ícone oficial é criado imediatamente!
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba Xiaomi */}
            {activeBrowserTab === 'XIAOMI' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="font-bold text-slate-900">Menu do Navegador (⋯)</div>
                  <p className="text-slate-600 leading-snug">
                    Toque no botão de opções ou ferramentas no navegador Mi Browser.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-orange-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-slate-900">Ferramentas / Ecrã</div>
                  <p className="text-slate-600 leading-snug">
                    Selecione <strong>&quot;Adicionar atalho ao ecrã inicial&quot;</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-slate-900">Permissão do Sistema</div>
                  <p className="text-slate-600 leading-snug">
                    Confirme a adição para colocar o aplicativo no seu lançador MIUI/HyperOS.
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba iOS */}
            {activeBrowserTab === 'IOS' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="font-bold text-slate-900">Abra no Safari</div>
                  <p className="text-slate-600 leading-snug">
                    No iPhone/iPad, a instalação exige que abra a página no navegador <strong>Safari</strong>.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="font-bold text-slate-900">Botão Partilhar (⎋)</div>
                  <p className="text-slate-600 leading-snug">
                    Toque no botão central de partilha (ícone de quadrado com seta para cima).
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="font-bold text-slate-900">Ecrã Principal</div>
                  <p className="text-slate-600 leading-snug">
                    Role para baixo e toque em <strong>&quot;Ecrã Principal&quot;</strong> (+) e confirme &quot;Adicionar&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Endereço Público e Ações de Partilha */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-700">Endereço da Aplicação no Netlify:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2 font-mono text-[10.5px] text-slate-600 truncate select-all">
              {publicUrl}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenChrome}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no Chrome</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-[11px]"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Partilhar</span>
              </button>
            </div>
          </div>

          {/* Seção QR Code (Mais relevante quando visualizado no PC ou para partilhar com colega) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code de Instalação Móvel"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-white p-1.5 border border-slate-200 shadow-xs shrink-0"
              />
            )}
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-bold text-xs text-slate-900 flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>QR Code para outro telemóvel</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Se estiver no computador de caixa ou quiser passar para o telemóvel de um operador, aponte a câmara do aparelho ao código acima para abrir de imediato.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Funciona offline e armazena os dados no dispositivo.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
