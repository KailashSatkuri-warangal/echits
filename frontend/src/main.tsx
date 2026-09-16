import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ Sudhakar Chits PWA Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ Sudhakar Chits PWA Service Worker registration error:', err);
      });
  });
}
