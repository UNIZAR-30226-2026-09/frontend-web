// src/components/lobby/SalaLobby.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socketService';
import { fetchApi } from '../../services/api';
import '../../styles/Lobby.css';

/**
 * Sala de espera tras crear o unirse a una partida.
 * Conecta el WebSocket de la sala al montar y lo desconecta al salir.
 * Reacciona al evento PARTIDA_INICIADA para navegar automáticamente.
 * @param {{ onVolver: () => void }} props
 */
const SalaLobby = ({ onVolver }) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const salaActiva = useGameStore((state) => state.salaActiva);
  const jugadoresLobby = useGameStore((state) => state.jugadoresLobby);

  const [empezando, setEmpezando] = useState(false);
  const [errorEmpezar, setErrorEmpezar] = useState(null);

  const maxJugadores = salaActiva.config_max_players || 4;
  const codigo = salaActiva.codigoInvitacion || '—';
  const usernameLocal = user?.username || user?.nombre_usuario || user?.nombre || '';
  // esCreadorSala lo fija el store: true al crear, false al unirse
  const esHost = useGameStore((state) => state.esCreadorSala);

  // Conectar WS de la sala al montar con la URL correcta: /ws/{id}/{username}
  useEffect(() => {
    if (!salaActiva.id || !usernameLocal) return;

    socketService.connectToPartida(salaActiva.id, usernameLocal);
  }, [salaActiva.id, usernameLocal]);

  // Navegar automáticamente cuando el backend notifica que la partida ha iniciado
  useEffect(() => {
    if (salaActiva.estado === 'activa' && salaActiva.id) {
      navigate(`/partida/${salaActiva.id}`);
    }
  }, [salaActiva.estado, salaActiva.id, navigate]);

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(codigo).catch(() => { });
  };

  const handleEmpezar = async () => {
    if (!salaActiva.id || empezando) return;
    setEmpezando(true);
    setErrorEmpezar(null);
    try {
      await fetchApi(`/v1/partidas/${salaActiva.id}/empezar`, { method: 'POST' });
      // La navegación ocurre automáticamente via WS PARTIDA_INICIADA
    } catch (err) {
      setErrorEmpezar(err.message || 'No se puede iniciar la partida.');
    } finally {
      setEmpezando(false);
    }
  };

  const handleInvitarAmigos = () => {
    console.log('Abrir panel amigos');
  };

  // Construye los huecos: rellena con datos reales y completa los vacíos
  const huecos = Array.from({ length: maxJugadores }, (_, i) => {
    const jugador = jugadoresLobby[i];
    return jugador
      ? { ocupado: true, nombre: jugador.username, numero: i + 1, esCreador: jugador.esCreador }
      : { ocupado: false, nombre: null, numero: i + 1, esCreador: false };
  });

  const handleAbandonar = async () => {
    if (salaActiva.id) {
      try {
        await fetchApi(`/v1/partidas/${salaActiva.id}/abandonar`, { method: 'POST' });
      } catch (err) {
        console.error("Error al abandonar la sala:", err);
      }
    }
    
    // Desconexión explícita requerida aquí en lugar de hacerlo en cleanup
    socketService.disconnect();
    
    useGameStore.setState({
      salaActiva: { id: null, codigoInvitacion: null, estado: null, config_max_players: null },
      jugadoresLobby: [],
      esCreadorSala: false
    });
    onVolver();
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-panel">

        <h2 className="lobby-titulo">Sala de Operaciones</h2>

        <p className="lobby-subtitulo">
          Comparte este código con tus contrincantes
        </p>

        <div
          className="lobby-codigo"
          onClick={handleCopiarCodigo}
          title="Clic para copiar"
        >
          {codigo}
        </div>
        <p className="lobby-subtitulo" style={{ marginTop: '-0.5rem', fontSize: '0.7rem' }}>
          Haz clic en el código para copiarlo al portapapeles
        </p>

        <hr className="lobby-separador" />

        <span className="lobby-label">
          Comandantes ({jugadoresLobby.length}/{maxJugadores})
        </span>

        <div className="lobby-lista-jugadores">
          {huecos.map((hueco) => {
            let slotContenido = null;

            if (hueco.ocupado) {
              slotContenido = (
                <div className="lobby-jugador-slot">
                  <div className="lobby-jugador-numero">{hueco.numero}</div>
                  <span className="lobby-jugador-nombre">{hueco.nombre}</span>
                  {hueco.esCreador && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-border-gold)', fontWeight: 'bold' }}>
                      ★ HOST
                    </span>
                  )}
                </div>
              );
            } else {
              slotContenido = (
                <div className="lobby-jugador-slot lobby-jugador-slot--vacio">
                  <div className="lobby-jugador-numero">{hueco.numero}</div>
                  <span className="lobby-jugador-nombre lobby-jugador-nombre--vacio">
                    Esperando comandante...
                  </span>
                </div>
              );
            }

            return <React.Fragment key={hueco.numero}>{slotContenido}</React.Fragment>;
          })}
        </div>

        <hr className="lobby-separador" />

        <div className="lobby-acciones">
          <button className="lobby-boton-secundario" onClick={handleInvitarAmigos}>
            Invitar Amigos
          </button>

          {esHost && (
            <button
              className="lobby-boton-exito"
              onClick={handleEmpezar}
              disabled={jugadoresLobby.length < 2}
              title={jugadoresLobby.length < 2 ? 'Se necesitan al menos 2 jugadores' : ''}
            >
              Empezar Partida ➔
            </button>
          )}

          <button className="lobby-boton-secundario" onClick={handleAbandonar}>
            Abandonar
          </button>
        </div>

      </div>
    </div>
  );
};

export default SalaLobby;
