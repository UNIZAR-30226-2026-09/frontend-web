import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore'
import PantallaJuego from './pantallas/PantallaJuego';
import Login from './pantallas/Login';
import Lobby from './pantallas/Lobby';

// Layout base que mantiene el Header y Footer fijos en todas las páginas
const MainLayout = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isGameScreen = location.pathname.startsWith('/partida');
  const isLoginScreen = location.pathname === '/';

  if (isLoginScreen) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <Outlet />
      </div>
    );
  }

  if (isGameScreen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header Base: Gestión de Sesión y Navegación */}
      <header style={{ flexShrink: 0, padding: '1rem 2rem', backgroundColor: '#111', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <h1 style={{ color: 'var(--primary-neon, #4db29a)', margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>SOBERANIA</h1>
          <nav style={{ display: 'flex', gap: '1.5rem', fontWeight: 'bold' }}>
            <Link to="/lobby" style={{ color: '#ccc', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Centro de Mando</Link>
            <Link to="/perfil" style={{ color: '#ccc', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Expediente</Link>
            <Link to="/ranking" style={{ color: '#ccc', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Alto Mando</Link>
          </nav>
        </div>

        {/* Estado de Usuario (Avatar, Nivel, Monedas) */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: '#222', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #444' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
              {/* Usamos String() para evitar que explote si el nombre es un número o formato raro */}
              <span style={{ color: 'white', fontWeight: 'bold' }}>
                {String(user.nombre || user.nombre_usuario || user.username || 'RECLUTA').toUpperCase()}
              </span>
              <span style={{ color: '#aaa' }}>Nvl. {user.nivel || 1}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffd700', fontWeight: 'bold' }}>
              <span>{user.monedas || 0}</span>
              <img src="/moneda.png" alt="Monedas" style={{ height: '20px' }} />
            </div>
            {/* Avatar circular con la inicial */}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-neon, #4db29a)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#111', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {String(user.nombre || user.nombre_usuario || user.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* Contenido dinámico que cambiará según la ruta */}
      <main style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Footer Base con información del sistema 
      <footer style={{ flexShrink: 0, padding: '1rem', borderTop: '1px solid var(--border-ui)', textAlign: 'center', opacity: 0.6 }}>
        <small>Soberania - Universidad de Zaragoza </small>
      </footer>*/}
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
              <PantallaJuego />
            </div>
          } />
          {/* RF.05: Perfil y Estadísticas */}
          <Route path="perfil" element={<div>Estadísticas de Usuario</div>} />
        </Route>
      </Routes>
    </Router>
  );
}