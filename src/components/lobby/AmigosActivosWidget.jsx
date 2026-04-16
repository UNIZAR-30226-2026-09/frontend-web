import React, { useMemo } from 'react';
import { mockAmigosActivos } from '../../mock/menuMockData';

const configEstado = (estado) => {
  switch (estado) {
    case 'ONLINE':
      return { texto: 'Conectado', dotClase: 'dot-online' };
    case 'JUGANDO':
      return { texto: 'En Combate', dotClase: 'dot-jugando' };
    case 'EN_LOBBY':
      return { texto: 'En Sala', dotClase: 'dot-lobby' };
    default:
      return { texto: 'Desconectado', dotClase: 'dot-offline' };
  }
};

const AmigosActivosWidget = ({ onAbrirAmigos }) => {
  const activos = useMemo(() => {
    // MOCKUP: la lista es mock; el scroll controla cuántos se ven.
    return mockAmigosActivos;
  }, []);

  return (
    <div className="soberania-inicial__panel" aria-label="Amigos activos (preview)">
      <div className="soberania-inicial__panel-inner">
        <h3 className="soberania-inicial__titulo">Amigos activos</h3>

        <div className="soberania-friends-scroll">
          <div className="soberania-friends-list">
            {activos.map((amigo) => {
              const conf = configEstado(amigo.estado);
              const inicial = (amigo.username?.charAt(0) || '?').toUpperCase();

              return (
                <div
                  key={amigo.id}
                  className="soberania-friends-row"
                  role="button"
                  tabIndex={0}
                  onClick={onAbrirAmigos}
                >
                  <div className="soberania-friends-info">
                    <div className="soberania-friends-avatar">{inicial}</div>
                    <div className="soberania-friends-nombre">{amigo.username}</div>
                  </div>
                  <div className="soberania-friends-estado">
                    <span className={`estado-dot ${conf.dotClase}`} />
                    {conf.texto}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="soberania-amigos-cta">
          <button type="button" className="lobby-boton-primario soberania-ver-alianzas-btn" onClick={onAbrirAmigos}>
            Ver alianzas
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmigosActivosWidget;

