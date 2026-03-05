import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore'
import Tablero from './pantallas/Tablero';
import CabeceraJuego from './components/CabeceraJuego';
import Login from './pantallas/Login';
import Lobby from './pantallas/Lobby';

// Layout base que mantiene el Header y Footer fijos en todas las páginas
const MainLayout = () => {
  const location = useLocation();
  const isGameScreen = location.pathname.startsWith('/partida');
  const isFullScreenMode = location.pathname === '/' || location.pathname === '/lobby';

  if (isFullScreenMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Outlet />
      </div>
    );
  }

  if (isGameScreen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <CabeceraJuego />
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header Base: Gestión de Sesión y Navegación */}
      <header style={{ flexShrink: 0, padding: '1rem', borderBottom: '1px solid var(--border-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--primary-neon)', margin: 0, fontSize: '1.5rem' }}>SOBERANIA</h1>
        <nav>
          <Link to="/" style={{ color: 'black', marginRight: '1rem', textDecoration: 'none' }}>Login</Link>
          <Link to="/lobby" style={{ color: 'black', textDecoration: 'none' }}>Lobby</Link>
        </nav>
      </header>

      {/* Contenido dinámico que cambiará según la ruta */}
      <main style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Footer Base con información del sistema */}
      <footer style={{ flexShrink: 0, padding: '1rem', borderTop: '1px solid var(--border-ui)', textAlign: 'center', opacity: 0.6 }}>
        <small>Soberania - Universidad de Zaragoza </small>
      </footer>
    </div>
  );
};

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Esto se ejecuta al abrir la aplicación (solamente una vez)
  useEffect(() => {
    checkSession();
  }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* RF.01/RF.02: Gestión de Usuarios */}
          <Route index element={<Login />} />
          {/* RF.07: Gestión de Partidas */}
          <Route path="lobby" element={<Lobby />} />
          {/* RF.12: Representación del Entorno (Mapa de Aragón) */}
          <Route path="partida/:id" element={
            <div style={{ flex: 1, width: '100%', height: '100%' }}>
              <Tablero />
            </div>
          } />
          {/* RF.05: Perfil y Estadísticas */}
          <Route path="perfil" element={<div>Estadísticas de Usuario</div>} />
        </Route>
      </Routes>
    </Router>
  );
}