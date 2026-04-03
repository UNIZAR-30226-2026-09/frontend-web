// src/components/lobby/MenuCrearPartida.jsx
import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/Lobby.css';

/**
 * Panel de configuración para crear una nueva partida.
 * @param {{ onCreada: () => void, onCancelar: () => void }} props
 */
const MenuCrearPartida = ({ onCreada, onCancelar }) => {
  const crearPartidaBackend = useGameStore((state) => state.crearPartidaBackend);

  const [maxJugadores, setMaxJugadores] = useState(4);
  const [visibilidad, setVisibilidad] = useState('publica');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleFundar = async () => {
    setCargando(true);
    setError(null);

    try {
      const resultado = await crearPartidaBackend({
        config_max_players: maxJugadores,
        config_visibility: visibilidad,
        config_timer_seconds: 1200
      });
      if (resultado) {
        onCreada();
      }
    } catch (err) {
      setError(err?.message || 'No se pudo crear la partida. Comprueba tu conexión o el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-panel">

        <h2 className="lobby-titulo">Nueva Operación</h2>
        <p className="lobby-subtitulo">Define los parámetros de tu sala antes de comenzar.</p>

        <hr className="lobby-separador" />

        <span className="lobby-label">Número de Comandantes (2 – 4)</span>
        <div className="lobby-selector-numero">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              className={`lobby-selector-numero__boton${maxJugadores === n ? ' lobby-selector-numero__boton--activo' : ''}`}
              onClick={() => setMaxJugadores(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <span className="lobby-label">Visibilidad de la sala</span>
        <div className="lobby-selector-numero">
          {['publica', 'privada'].map((v) => (
            <button
              key={v}
              className={`lobby-selector-numero__boton${visibilidad === v ? ' lobby-selector-numero__boton--activo' : ''}`}
              style={{ width: 'auto', padding: '0 1rem', fontSize: '0.8rem', letterSpacing: '1px' }}
              onClick={() => setVisibilidad(v)}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>

        <hr className="lobby-separador" />

        {error && <p className="lobby-error">⚠ {error}</p>}

        <div className="lobby-acciones">
          <button
            className="lobby-boton-primario"
            onClick={handleFundar}
            disabled={cargando}
          >
            {cargando ? 'Fundando...' : 'Fundar Operación ➔'}
          </button>
          <button
            className="lobby-boton-secundario"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default MenuCrearPartida;
