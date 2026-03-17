import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import PantallaJuego from './pantallas/PantallaJuego';
import Login from './pantallas/Login';
import Lobby from './pantallas/Lobby';

/**
 * Layout principal que envuelve las diferentes rutas de la aplicación.
 * Proporciona el encabezado de navegación condicionalmente dependiendo de la pantalla actual.
 *
 * @returns {JSX.Element} El esqueleto estructural de la vista solicitada.
 */
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
      <header style={{ flexShrink: 0, padding: '1rem 2rem', backgroundColor: 'var(--color-ui-bg-primary)', borderBottom: '2px solid var(--color-border-bronze)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-text-primary)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
          <h1 style={{ color: 'var(--color-border-gold)', margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>SOBERANIA</h1>
          <nav style={{ display: 'flex', gap: '1.5rem', fontWeight: 'bold' }}>
            <Link to="/lobby" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Centro de Mando</Link>
            <Link to="/perfil" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Expediente</Link>
            <Link to="/ranking" style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', textTransform: 'uppercase', fontSize: '0.9rem' }}>Alto Mando</Link>
          </nav>
        </div>

        {/* Estado de Usuario (Avatar, Nivel, Monedas) */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--color-ui-bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border-bronze)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>
                {String(user.nombre || user.nombre_usuario || user.username || 'RECLUTA').toUpperCase()}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Nvl. {user.nivel || 1}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-border-gold)', fontWeight: 'bold' }}>
              <span>{user.monedas || 0}</span>
              <img src="/moneda.png" alt="Monedas" style={{ height: '20px' }} />
            </div>
            {/* Avatar circular con la inicial */}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-border-gold)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--color-ui-bg-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
              {String(user.nombre || user.nombre_usuario || user.username || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </header>

      {/* Contenido dinámico que cambiará según la ruta */}
      <main style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
};

/**
 * Componente raíz de la aplicación que inicializa el enrutador y asegura la persistencia de sesión.
 *
 * @returns {JSX.Element} Aplicación completa montada.
 */
export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

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