/**
 * Punto de entrada primordial del entorno web.
 * Inyecta y renderiza el árbol completo de la aplicación sobre el DOM.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
