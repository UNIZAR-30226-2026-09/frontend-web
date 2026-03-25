// src/components/lobby/MenuUnirsePartida.jsx
import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/Lobby.css';

/**
 * Panel para unirse a una sala existente mediante código de invitación.
 * @param {{ onUnido: () => void, onCancelar: () => void }} props
 */
const MenuUnirsePartida = ({ onUnido, onCancelar }) => {
  const unirsePartidaBackend = useGameStore((state) => state.unirsePartidaBackend);

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleUnirse = async () => {
    if (!codigo.trim()) {
      setError('Introduce un código de invitación válido.');
      return;
    }

    setCargando(true);
    setError(null);

    const resultado = await unirsePartidaBackend(codigo.trim());

    setCargando(false);

    if (resultado) {
      onUnido();
    } else {
      setError('Código no válido, sala llena o error de conexión.');
    }
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-panel" style={{ maxWidth: '480px' }}>

        <h2 className="lobby-titulo">Infiltrarse</h2>
        <p className="lobby-subtitulo">Introduce el código de operaciones proporcionado por el host.</p>

        <hr className="lobby-separador" />

        <input
          className="lobby-input"
          type="text"
          placeholder="Ej: ABC-123"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleUnirse()}
          maxLength={12}
          autoFocus
        />

        {error && <p className="lobby-error">⚠ {error}</p>}

        <div className="lobby-acciones">
          <button
            className="lobby-boton-primario"
            onClick={handleUnirse}
            disabled={cargando}
          >
            {cargando ? 'Conectando...' : 'Infiltrarse ➔'}
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

export default MenuUnirsePartida;
