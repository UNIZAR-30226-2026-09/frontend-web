import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { socialApi } from '../../services/socialApi';
import { BASE_URL } from '../../services/api';
import PanelPerfilJugador from './PanelPerfilJugador';

const configEstado = (estado) => {
  switch (estado) {
    case 'ONLINE':
    case 'CONECTADO':
      return { texto: 'Conectado', dotClase: 'dot-online' };
    case 'JUGANDO':
    case 'EN_PARTIDA':
      return { texto: 'En Combate', dotClase: 'dot-jugando' };
    case 'EN_LOBBY':
      return { texto: 'En Sala', dotClase: 'dot-lobby' };
    default:
      return { texto: 'Desconectado', dotClase: 'dot-offline' };
  }
};

const AmigosActivosWidget = ({ onAbrirAmigos }) => {
  const [activos, setActivos] = useState([]);
  const [perfilViendo, setPerfilViendo] = useState(null);

  useEffect(() => {
    const fetchAmigos = async () => {
      try {
        const data = await socialApi.obtenerAmigosActivos();
        if (Array.isArray(data)) {
          // Filtramos solo a los que esten conectados (ONLINE, JUGANDO, EN_LOBBY, CONECTADO, EN_PARTIDA)
          const conectados = data.filter(a => {
            const estado = (a.estado_conexion || a.estado || '').toUpperCase();
            return estado !== 'DESCONECTADO' && estado !== 'OFFLINE';
          });
          setActivos(conectados);
        }
      } catch (error) {
        console.error("Error al obtener amigos conectados:", error);
      }
    };
    fetchAmigos();
  }, []);

  return (
    <div className="soberania-inicial__panel" aria-label="Amigos (preview)">
      <div className="soberania-inicial__panel-inner">
        <h3 className="soberania-inicial__titulo">Amigos</h3>

        <div className="soberania-friends-scroll">
          <div className="soberania-friends-list">
            {activos.length === 0 ? (
              <div className="soberania-friends-row" style={{ justifyContent: 'center', color: '#888', fontStyle: 'italic', cursor: 'default' }}>
                No tienes amigos conectados en este momento.
              </div>
            ) : (
              activos.map((amigo, idx) => {
                const estadoSano = amigo.estado_conexion || amigo.estado;
                const conf = configEstado(estadoSano);
                const username = amigo.username;
                const urlAvatar = amigo.avatar || '/static/perfiles/default.png';
                
                // Usamos username si no hay id para no tener errores de key
                const clave = amigo.id || username || idx;

                return (
                  <div
                    key={clave}
                    className="soberania-friends-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setPerfilViendo({ username, avatar: amigo.avatar })}
                  >
                    <div className="soberania-friends-info">
                      <img src={`${BASE_URL}${urlAvatar}`} alt={username} className="soberania-friends-avatar" style={{ border: 'none', background: 'transparent', objectFit: 'cover' }} />
                      <div className="soberania-friends-nombre">{username}</div>
                    </div>
                    <div className="soberania-friends-estado">
                      <span className={`estado-dot ${conf.dotClase}`} />
                      {conf.texto}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="soberania-amigos-cta">
          <button type="button" className="lobby-boton-primario soberania-ver-alianzas-btn" onClick={onAbrirAmigos}>
            Ver alianzas
          </button>
        </div>
      </div>
      
      {perfilViendo && createPortal(
        <PanelPerfilJugador 
          username={perfilViendo.username}
          avatarProp={perfilViendo.avatar}
          onCerrar={() => setPerfilViendo(null)} 
        />,
        document.getElementById('root') || document.body
      )}
    </div>
  );
};

export default AmigosActivosWidget;

