import React, { useState, useEffect } from 'react';
import { fetchApi, BASE_URL } from '../../services/api';
import PanelEstadisticas from '../social/PanelEstadisticas';
import '../../styles/Lobby.css';
import '../../styles/PanelInteligencia.css';

/**
 * Pantalla para visualizar el perfil de otro jugador (Top global, amigos, etc.)
 * Muestra el usuario y sus estadísticas públicas sin permitir edición ni mostrar información privada.
 * @param {{ username: string, onCerrar: () => void, avatarProp?: string }} props
 */
const PanelPerfilJugador = ({ username, onCerrar, avatarProp }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Cargar estadísticas al abrir el panel
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoadingStats(true);
      try {
        const statsData = await fetchApi(`/v1/estadisticas/${username}`, { method: 'GET' });
        setEstadisticas(statsData);
      } catch (error) {
        console.error(`Error al obtener las estadísticas del jugador ${username}:`, error);
        setEstadisticas(null);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (username) {
      cargarDatos();
    }
  }, [username]);

  const inicial = username ? username.charAt(0).toUpperCase() : '?';

  return (
    <div className="intel-overlay" style={{ zIndex: 9999 }}>
      <div className="intel-panel">

        <button className="intel-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>

        {/* Zona scrollable */}
        <div className="intel-scroll-area" style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>

          <div className="intel-perfil-grid">

            {/* COLUMNA IZQUIERDA: Perfil y Título */}
            <div className="intel-perfil-izq">
              <img 
                src={`${BASE_URL}${avatarProp || estadisticas?.avatar || '/static/perfiles/default.png'}`} 
                alt={username} 
                className="intel-avatar" 
                style={{ border: 'none', objectFit: 'cover', background: 'transparent' }} 
              />
              <h2 className="intel-titulo">Perfil de {username}</h2>
            </div>

            {/* COLUMNA DERECHA: Datos del perfil */}
            <div className="intel-perfil-der">
              <div className="intel-campo">
                <span className="intel-campo__label">Nombre de usuario</span>
                <div className="intel-campo__fila">
                  <span className="intel-campo__valor" style={{ color: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                    {username}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="lobby-separador" style={{ width: '100%' }} />

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <PanelEstadisticas estadisticas={estadisticas} isLoading={isLoadingStats} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanelPerfilJugador;
