import { useEffect, useState } from 'react';
import { getPublicShareableUrl, openAndroidChrome } from '../utils/appUrl';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? window.__deferredPrompt || null : null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isSamsung, setIsSamsung] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  useEffect(() => {
    // Detectar modo standalone (já instalado como app no Windows/Android/iOS)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const android = /android/.test(ua);
    const ios = /iphone|ipad|ipod/.test(ua);
    const win = /windows/.test(ua);
    const samsung = /samsungbrowser/.test(ua);
    const chrome = /chrome|chromium|crios/.test(ua) && !samsung && !/edg|opr/.test(ua);
    const inApp = /fban|fbav|instagram|whatsapp|line|wv|webview/.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);
    setIsWindows(win);
    setIsSamsung(samsung);
    setIsChrome(chrome);
    setIsInAppBrowser(inApp);

    // Se já havia prompt capturado antes de hidratar o React
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvt = e as BeforeInstallPromptEvent;
      window.__deferredPrompt = promptEvt;
      setDeferredPrompt(promptEvt);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredPrompt = null;
    };

    const handleCustomPromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-prompt-ready', handleCustomPromptReady);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-prompt-ready', handleCustomPromptReady);
    };
  }, []);

  /**
   * Dispara o prompt nativo de instalação.
   * Se o prompt nativo não estiver disponível (ex: desktop sem Chrome, ou Chrome no Android ainda sem evento),
   * devolve 'manual' para acionar o guia passo a passo do dispositivo.
   */
  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') window.__deferredPrompt = null;
        }
        return choice.outcome;
      } catch (err) {
        console.error('Erro ao acionar prompt nativo de instalação:', err);
      }
    }
    // Quando não há prompt automático imediato disponível no navegador
    setShowAndroidGuide(true);
    return 'manual';
  };

  /**
   * Descarrega o lançador executável .bat para Windows que abre o POS em modo nativo
   */
  const downloadWindowsLauncher = () => {
    const currentUrl = getPublicShareableUrl();
    const batContent = `@echo off
title Minha Loja - POS & Facturacao Fiscal
echo ========================================================
echo   Iniciando Minha Loja (POS Standalone Desktop)...
echo ========================================================

:: Abrir Microsoft Edge ou Google Chrome em modo App Nativo sem barra de browser
start msedge.exe --app="${currentUrl}" || start chrome.exe --app="${currentUrl}" || start "" "${currentUrl}"

exit
`;

    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalador-MinhaLoja-POS.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Descarrega um atalho para a área de trabalho do Windows (.url)
   */
  const downloadWindowsShortcut = () => {
    const currentUrl = getPublicShareableUrl();
    const urlContent = `[InternetShortcut]
URL=${currentUrl}
IconIndex=0
IconFile=${typeof window !== 'undefined' ? window.location.origin : ''}/icon.svg
`;

    const blob = new Blob([urlContent], { type: 'application/internet-shortcut;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MinhaLoja-POS.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Descarrega um lançador Android (.html) que pode ser guardado no telemóvel
   * e abre o sistema imediatamente no Chrome ou navegador padrão com tela inteira
   */
  const downloadAndroidLauncher = () => {
    const currentUrl = getPublicShareableUrl();
    const htmlContent = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Minha Loja - POS & Caixa</title>
  <meta name="theme-color" content="#061224">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #061224; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
    .card { background: #0b1a33; border: 1px solid rgba(56,189,248,0.2); border-radius: 24px; padding: 32px 24px; max-width: 400px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.7); }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #f8fafc; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: block; width: 100%; box-sizing: border-box; padding: 14px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 15px; margin-bottom: 12px; transition: background 0.2s; }
    .btn:active { background: #1d4ed8; }
    .btn-alt { background: #1e293b; color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
    .steps { text-align: left; background: #061224; border-radius: 16px; padding: 16px; margin-top: 20px; font-size: 12px; color: #cbd5e1; }
    .steps ol { margin: 0; padding-left: 20px; }
    .steps li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 12px;">🏪</div>
    <h1>Minha Loja POS</h1>
    <p>A iniciar aplicação no seu telemóvel...</p>
    <a href="${currentUrl}" id="openBtn" class="btn">🚀 Abrir no Navegador</a>
    <a href="intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end" class="btn btn-alt">🌐 Abrir no Google Chrome</a>
    <div class="steps">
      <strong style="color: #38bdf8;">Como Instalar no Ecrã Principal do Telemóvel:</strong>
      <ol>
        <li>No Chrome, toque nos 3 pontinhos (<strong>⋮</strong>) no canto superior direito.</li>
        <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar ao ecrã inicial"</strong>.</li>
        <li>O ícone fica disponível no ecrã como aplicativo autónomo e funciona offline!</li>
      </ol>
    </div>
  </div>
  <script>
    const targetUrl = "${currentUrl}";
    try {
      window.location.href = targetUrl;
    } catch (e) {
      console.log(e);
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Instalador-Android-MinhaLoja.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Partilha ou copia o URL público da aplicação
   */
  const shareAppUrl = async (): Promise<boolean> => {
    const publicUrl = getPublicShareableUrl();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Loja Negrinho - POS & Caixa Fiscal',
          text: 'Aceda ao sistema POS no seu telemóvel Android com suporte offline e scanner de câmara:',
          url: publicUrl,
        });
        return true;
      } catch {
        // Ignorar se utilizador cancelou a partilha
      }
    }
    // Fallback: copiar para clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(publicUrl);
        return true;
      } catch (err) {
        console.error(err);
      }
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isWindows,
    isChrome,
    isSamsung,
    isInAppBrowser,
    showAndroidGuide,
    setShowAndroidGuide,
    publicUrl: getPublicShareableUrl(),
    openInAndroidChrome: () => openAndroidChrome(getPublicShareableUrl()),
    promptInstall,
    downloadWindowsLauncher,
    downloadWindowsShortcut,
    downloadAndroidLauncher,
    shareAppUrl,
  };
}
