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
const PanelPerfilJugador = ({ username, onCerrar, esAmigo = false, onCortarAmistad, avatarProp }) => {
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

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const inicial = username ? username.charAt(0).toUpperCase() : '?';

  const handleClickCortar = () => {
    setMostrarConfirmacion(true);
  };

  const confirmarCortarAmistad = () => {
    setMostrarConfirmacion(false);
    if (onCortarAmistad) {
      onCortarAmistad(username);
    }
  };

  const cancelarCortarAmistad = () => {
    setMostrarConfirmacion(false);
  };

  return (
    <div className="intel-overlay" style={{ zIndex: 9999 }}>
      {/* Pop-up de confirmación incrustado */}
      {mostrarConfirmacion && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--color-ui-bg-secondary)', border: '2px solid var(--color-border-bronze)',
            padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ color: 'var(--color-state-danger)', marginTop: 0 }}>¿Romper Tratado?</h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              ¿Estás seguro de que deseas revocar el tratado de alianza con <strong style={{color: 'var(--color-border-gold-vivo)'}}>{username}</strong>? 
              <br/><br/>Esta acción es permanente y tendrías que enviar una nueva propuesta para recuperarla.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={cancelarCortarAmistad}
                className="lobby-boton-secundario" 
                style={{ flex: 1, padding: '0.6rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarCortarAmistad}
                style={{ 
                  flex: 1, padding: '0.6rem', background: 'var(--color-state-danger)', 
                  border: '1px solid transparent', color: 'white', borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase' 
                }}
              >
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="intel-panel" style={mostrarConfirmacion ? { filter: 'blur(4px)' } : {}}>

        <button className="intel-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>

        {/* Zona scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>

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

        {esAmigo && (
          <>
            <hr className="lobby-separador" style={{ width: '100%' }} />
            <button
              onClick={handleClickCortar}
              style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--color-state-danger)', border: '1px solid var(--color-state-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background 0.2s', flexShrink: 0 }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(211,47,47,0.15)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Eliminar Alianza
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PanelPerfilJugador;
