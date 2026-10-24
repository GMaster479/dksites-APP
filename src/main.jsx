import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Makes the app installable ("Add to Home Screen") and shows an offline page.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
