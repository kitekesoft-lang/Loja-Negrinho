import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registo do Service Worker PWA apenas em produção / Netlify para garantir estabilidade no preview
if (import.meta.env.PROD && typeof window !== 'undefined' && !window.location.hostname.includes('ais-dev-')) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('Nova versão da app disponível.');
    },
    onOfflineReady() {
      console.log('App pronta para funcionar offline.');
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
