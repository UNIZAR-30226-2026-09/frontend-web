import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../services/api';
import { mockVictoriasMi } from '../../mock/menuMockData';
import PanelPerfilJugador from './PanelPerfilJugador';

const obtenerNombreJugador = (user) => user?.username || user?.nombre_usuario || user?.nombre || '';

const TopGlobalWidget = () => {
  const user = useAuthStore((state) => state.user);
  const miUsername = useMemo(() => obtenerNombreJugador(user), [user]);

  const [topUsuarios, setTopUsuarios] = useState([]);
  const [perfilViendo, setPerfilViendo] = useState(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await fetchApi('/v1/estadisticas/ranking?limite=10');
        setTopUsuarios(data);
      } catch (error) {
        console.error("Error al obtener el ranking global:", error);
      }
    };
    fetchRanking();
  }, []);

  const miPos = 67; // Mock temporal hasta que se implemente en el backend

  const top10 = useMemo(() => {
    return [...topUsuarios]
      .sort((a, b) => b.num_partidas_ganadas - a.num_partidas_ganadas)
      .slice(0, 10)
      .map((p, idx) => ({
        id: p.nombre_user || idx,
        username: p.nombre_user,
        victorias: p.num_partidas_ganadas,
        posicion: idx + 1
      }));
  }, [topUsuarios]);

  const estaEnTop10 = miPos >= 1 && miPos <= 10;
  const victoriasUsuario = estaEnTop10 ? top10[miPos - 1]?.victorias : mockVictoriasMi;

  return (
    <div className="soberania-inicial__panel" aria-label="Top global (ganadas)">
      <div className="soberania-inicial__panel-inner">
        <h3 className="soberania-inicial__titulo">Top global</h3>

        <div className="soberania-top-list">
          <div className="soberania-top-scroll" aria-label="Top 10 (ganadas)">
            {top10.map((p) => {
              const esMiFila = p.username === miUsername || (estaEnTop10 && p.posicion === miPos);
              return (
                <div
                  key={p.id}
                  className={`soberania-top-row ${esMiFila ? 'soberania-top-you' : 'soberania-top-clickable'}`}
                  onClick={() => {
                    if (!esMiFila) setPerfilViendo(p.username);
                  }}
                  style={{ cursor: esMiFila ? 'default' : 'pointer' }}
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
      {perfilViendo && createPortal(
        <PanelPerfilJugador username={perfilViendo} onCerrar={() => setPerfilViendo(null)} />,
        document.getElementById('root') || document.body
      )}
    </div>
  );
};

export default TopGlobalWidget;

