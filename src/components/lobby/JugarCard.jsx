import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../services/api';
import { useGameStore } from '../../store/gameStore';

const JugarCard = ({ onAbrirOperaciones }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleClick = async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await fetchApi('/v1/partidas/mi-partida');

      if (resultado?.tiene_partida_activa && resultado?.estado === 'activa' && resultado?.partida_id) {
        // Preparar el store para que PantallaJuego cargue el estado correctamente
        useGameStore.setState({
          salaActiva: {
            id: resultado.partida_id,
            codigoInvitacion: resultado.codigo_invitacion ?? null,
            estado: 'activa',
            config_max_players: null,
          },
          estadoPartidaLocal: 'JUGANDO',
        });
        navigate(`/partida/${resultado.partida_id}`);
        return;
      }

      // No hay partida activa: abrir menú normal de operaciones
      onAbrirOperaciones();
    } catch (err) {
      console.error('[JugarCard] Error al comprobar partida activa:', err);
      // En caso de error de red simplemente abrimos el menú normal
      onAbrirOperaciones();
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      type="button"
      className="soberania-jugar-card"
      onClick={handleClick}
      disabled={cargando}
      style={{ opacity: cargando ? 0.7 : 1, cursor: cargando ? 'wait' : 'pointer' }}
    >
      <div className="soberania-jugar-titulo">
        {cargando ? 'Conectando...' : 'Jugar'}
      </div>
      <div className="soberania-jugar-sub">
        {cargando ? 'Comprobando estado de la partida...' : 'Accede al despliegue de operaciones'}
      </div>
    </button>
  );
};

export default JugarCard;
