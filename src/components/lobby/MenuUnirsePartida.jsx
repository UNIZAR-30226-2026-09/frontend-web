// src/components/lobby/MenuUnirsePartida.jsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { fetchApi } from '../../services/api';
import '../../styles/Lobby.css';

/**
 * Panel ampliado para unirse a una sala pública o introducir código.
 * @param {{ onUnido: () => void, onCancelar: () => void }} props
 */
const MenuUnirsePartida = ({ onUnido, onCancelar }) => {
  const unirsePartidaBackend = useGameStore((state) => state.unirsePartidaBackend);
  const reanudarPartidaBackend = useGameStore((state) => state.reanudarPartidaBackend);

  const [codigo, setCodigo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState('publicas'); // 'publicas' | 'pausadas'
  const [partidasPausadas, setPartidasPausadas] = useState([]);
  const [cargandoPausadas, setCargandoPausadas] = useState(true);

  const [partidasPublicas, setPartidasPublicas] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);

  // Nombres simulados hasta que backend devuelva la información del host real
  const nombresRandom = ["Comandante Alpha", "Coronel Furia", "Gral. Patton", "Teniente Cero", "Sgt. Acero"];

  const cargarPartidas = async () => {
    setCargandoLista(true);
    try {
      const resp = await fetchApi('/v1/partidas');
      // Inyectar datos mock de "jugadores actuales" e "inventor" por petición del usuario
      const enriquecidas = resp.map(p => ({
        ...p,
        jugadoresActuales: 67,
        nombreCreador: nombresRandom[Math.floor(Math.random() * nombresRandom.length)]
      }));
      setPartidasPublicas(enriquecidas);
    } catch (err) {
      console.error("Error cargando partidas:", err);
    } finally {
      setCargandoLista(false);
    }
  };

  const cargarPartidasPausadas = async () => {
    setCargandoPausadas(true);
    try {
      const data = await fetchApi('/v1/partidas/pausadas');
      setPartidasPausadas(data || []);
    } catch (err) {
      console.error("Error cargando partidas pausadas:", err);
    } finally {
      setCargandoPausadas(false);
    }
  };

  useEffect(() => {
    cargarPartidas();
    cargarPartidasPausadas();
  }, []);

  const handleUnirse = async (codigoUso = null) => {
    const codFinal = typeof codigoUso === 'string' ? codigoUso.trim() : codigo.trim();

    if (!codFinal) {
      setError('Introduce o selecciona un código de invitación válido.');
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const resultado = await unirsePartidaBackend(codFinal);
      if (resultado) {
        onUnido();
      }
    } catch (err) {
      setError(err?.message || 'Código no válido, sala llena o error de conexión.');
    } finally {
      setCargando(false);
    }
  };

  const handleReanudar = async (codigoPausa) => {
    setCargando(true);
    setError(null);
    try {
      await reanudarPartidaBackend(codigoPausa);
      onUnido(); // Esto avisa al Lobby para que cambie la vista a la sala
    } catch (err) {
      setError("No se pudo reanudar. ¿Quizás no eres el creador o el código es inválido?");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-panel" style={{ maxWidth: '750px', width: '90%', padding: '2.5rem' }}>

        <h2 className="lobby-titulo" style={{ marginBottom: '0.5rem' }}>Listado de Incursiones</h2>
        <p className="lobby-subtitulo">Selecciona una sala pública desplegada o accede con tu código clasificado.</p>

        <hr className="lobby-separador" />

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>

          {/* Columna Izquierda: Listado de Salas Públicas */}
          <div style={{ flex: '2', minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button
                  onClick={() => setPestanaActiva('publicas')}
                  style={{ background: 'transparent', border: 'none', borderBottom: pestanaActiva === 'publicas' ? '2px solid var(--color-primary-gold)' : '2px solid transparent', color: pestanaActiva === 'publicas' ? 'var(--color-primary-gold)' : 'var(--color-text-secondary)', padding: '0 0 0.3rem 0', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1rem', transition: 'all 0.2s' }}
                >
                  Salas Públicas
                </button>
                <button
                  onClick={() => setPestanaActiva('pausadas')}
                  style={{ background: 'transparent', border: 'none', borderBottom: pestanaActiva === 'pausadas' ? '2px solid var(--color-primary-gold)' : '2px solid transparent', color: pestanaActiva === 'pausadas' ? 'var(--color-primary-gold)' : 'var(--color-text-secondary)', padding: '0 0 0.3rem 0', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '1rem', transition: 'all 0.2s' }}
                >
                  En Suspenso
                </button>
              </div>
              <button
                onClick={pestanaActiva === 'publicas' ? cargarPartidas : cargarPartidasPausadas}
                disabled={pestanaActiva === 'publicas' ? cargandoLista : cargandoPausadas}
                style={{
                  background: 'transparent', color: 'var(--color-primary-gold)', border: '1px solid var(--color-primary-gold)',
                  borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem'
                }}>
                ⟳ Refrescar
              </button>
            </div>

            <div style={{
              flex: 1, maxHeight: '220px', overflowY: 'auto', background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--color-border-neutral)', borderRadius: '6px', padding: '0.5rem'
            }}>
              {pestanaActiva === 'publicas' ? (
                cargandoLista ? (
                  <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>Buscando inteligencia en la red...</p>
                ) : partidasPublicas.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>No hay salas públicas disponibles en este momento.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {partidasPublicas.map((p) => (
                      <div key={p.id} style={{ background: 'var(--color-ui-bg-secondary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>{p.nombreCreador}</span>
                          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Sala: #{p.codigo_invitacion}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: 'var(--color-primary-gold)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {p.jugadoresActuales}/{p.config_max_players}
                          </span>
                          <button onClick={() => handleUnirse(p.codigo_invitacion)} disabled={cargando} style={{ background: 'var(--color-map-ally)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                            ENTRAR
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                cargandoPausadas ? (
                  <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>Recuperando expedientes clasificados...</p>
                ) : partidasPausadas.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>No tienes operaciones en suspenso.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {partidasPausadas.map(p => (
                      <div key={p.id} style={{ background: 'var(--color-ui-bg-secondary)', border: '1px solid var(--color-border-gold)', borderLeft: '4px solid var(--color-border-gold)', borderRadius: '4px', padding: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>Partida #{p.id}</span>
                          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Acceso: {p.codigo_invitacion}</span>
                        </div>
                        <button onClick={() => handleReanudar(p.codigo_invitacion)} disabled={cargando} style={{ background: 'var(--color-border-gold)', color: '#1A1200', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: cargando ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          REANUDAR
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Columna Derecha: Entrada Manual y Acciones */}
          <div style={{ flex: '1', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid rgba(255, 237, 185, 0.2)', paddingLeft: '2rem' }}>
            <h3 style={{ color: 'var(--color-border-bronze)', margin: 0, textTransform: 'uppercase', fontSize: '1rem' }}>Código Directo</h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
              Si tienes un pase clasificado (sala privada), insértalo a continuación.
            </p>
            <input
              className="lobby-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              type="text"
              placeholder="Ej: ABC-123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleUnirse()}
              maxLength={12}
            />

            {error && <p className="lobby-error" style={{ fontSize: '0.85rem', margin: 0 }}>⚠ {error}</p>}

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                className="lobby-boton-primario"
                onClick={() => handleUnirse(codigo)}
                disabled={cargando}
                style={{ width: '100%' }}
              >
                {cargando ? 'Accediendo...' : 'INFILTRARSE ➔'}
              </button>
              <button
                className="lobby-boton-secundario"
                onClick={onCancelar}
                disabled={cargando}
                style={{ width: '100%' }}
              >
                Cancelar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MenuUnirsePartida;
