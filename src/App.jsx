import { BrowserRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import MapaAragon from './MapaAragon';
// Layout base que mantiene el Header y Footer fijos en todas las páginas
const MainLayout = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    {/* Header Base: Gestión de Sesión y Navegación */}
    <header style={{ padding: '1rem', borderBottom: '1px solid var(--border-ui)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 style={{ color: 'var(--primary-neon)', margin: 0, fontSize: '1.5rem' }}>SOBERANIA</h1>
      <nav>
        <Link to="/" style={{ color: 'white', marginRight: '1rem', textDecoration: 'none' }}>Login</Link>
        <Link to="/lobby" style={{ color: 'white', textDecoration: 'none' }}>Lobby</Link>
      </nav>
    </header>

    {/* Contenido dinámico que cambiará según la ruta */}
    <main style={{ flex: 1, padding: '2rem' }}>
      <Outlet />
    </main>

    {/* Footer Base con información del sistema */}
    <footer style={{ padding: '1rem', borderTop: '1px solid var(--border-ui)', textAlign: 'center', opacity: 0.6 }}>
      <small>Soberania 2026 - Universidad de Zaragoza - Proyecto Software </small>
    </footer>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* RF.01/RF.02: Gestión de Usuarios */}
          <Route index element={<div>Pantalla de Acceso (Login/Registro)</div>} />
          {/* RF.07: Gestión de Partidas */}
          <Route path="lobby" element={<div>Listado de Partidas (Lobby)</div>} />
          {/* RF.12: Representación del Entorno (Mapa de Aragón) */}
          <Route path="partida/:id" element={
            <div style={{ width: '100%', height: '80vh' }}>
              <MapaAragon />
            </div>
          } />
          {/* RF.05: Perfil y Estadísticas */}
          <Route path="perfil" element={<div>Estadísticas de Usuario</div>} />
        </Route>
      </Routes>
    </Router>
  );
}