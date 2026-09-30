/**
 * Utilitário de URL para partilha, instalação e acesso móvel (Android & iOS).
 * Garante que utilizadores externos ou smartphones acedem ao endereço público
 * partilhado sem barreiras de autenticação de desenvolvimento.
 */

export function getPublicShareableUrl(): string {
  if (typeof window === 'undefined') {
    return 'https://ais-pre-deykmqn4eveyvldmwtrk37-85170282891.europe-west2.run.app';
  }

  const origin = window.location.origin;

  // Se estiver a ser executado no ambiente dev do AI Studio (ais-dev-...),
  // o URL 'ais-dev' exige sessão/cookie interna do AI Studio e falha no telemóvel com "nenhuma acção" ou 403.
  // O URL 'ais-pre' é o endereço público de partilha direta, que abre de imediato em qualquer telemóvel Android.
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-') + (window.location.pathname || '/');
  }

  // Se estiver em localhost ou 127.0.0.1 num PC, o telemóvel não alcança o localhost do PC
  // Portanto, usamos o URL de preview público oficial na Cloud
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return 'https://ais-pre-deykmqn4eveyvldmwtrk37-85170282891.europe-west2.run.app';
  }

  return window.location.href;
}

/**
 * Dispara a abertura do endereço diretamente no Google Chrome do Android através de Android Intent.
 * Se o Intent falhar ou o dispositivo for desktop, abre numa nova aba de navegação.
 */
export function openAndroidChrome(customUrl?: string): void {
  const url = customUrl || getPublicShareableUrl();
  const cleanUrl = url.replace(/^https?:\/\//, '');
  const chromeIntent = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;

  try {
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = chromeIntent;
      setTimeout(() => {
        window.open(url, '_blank');
      }, 700);
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}
