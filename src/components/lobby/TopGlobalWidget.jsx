import React, { useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { mockMiPosicion, mockTopJugadores, mockVictoriasMi } from '../../mock/menuMockData';

const obtenerNombreJugador = (user) => user?.username || user?.nombre_usuario || user?.nombre || '';

const TopGlobalWidget = () => {
  const user = useAuthStore((state) => state.user);
  const miUsername = useMemo(() => obtenerNombreJugador(user), [user]);

  const miPos = mockMiPosicion;
  const topOrdenado = useMemo(() => {
    return [...mockTopJugadores].sort((a, b) => b.victorias - a.victorias);
  }, []);

  const top10 = useMemo(() => {
    return topOrdenado.slice(0, 10).map((p, idx) => ({
      ...p,
      posicion: idx + 1
    }));
  }, [topOrdenado]);

  const estaEnTop10 = miPos >= 1 && miPos <= 10;
  const victoriasUsuario = estaEnTop10 ? top10[miPos - 1]?.victorias : mockVictoriasMi;

  return (
    <div className="soberania-inicial__panel" aria-label="Top global (ganadas)">
      <div className="soberania-inicial__panel-inner">
        <h3 className="soberania-inicial__titulo">Top global</h3>

        <div className="soberania-top-list">
          <div className="soberania-top-scroll" aria-label="Top 10 (ganadas)">
            {top10.map((p) => {
              const esMiFila = estaEnTop10 && p.posicion === miPos;
              return (
                <div
                  key={p.id}
                  className={`soberania-top-row ${esMiFila ? 'soberania-top-you' : ''}`}
                >
                  <div className="soberania-top-left">
                    <div className="soberania-top-rank">{p.posicion}</div>
                    <div className="soberania-top-user">{p.username}</div>
                  </div>
                  <div className="soberania-top-victorias">{p.victorias}</div>
                </div>
              );
            })}
          </div>

          {!estaEnTop10 && (
            <div className="soberania-top-you soberania-top-you-fixed">
              <div className="soberania-top-left">
                <div className="soberania-top-rank">{miPos}</div>
                <div className="soberania-top-user">{miUsername || 'COMANDANTE'}</div>
              </div>
              <div className="soberania-top-victorias">{victoriasUsuario}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopGlobalWidget;

