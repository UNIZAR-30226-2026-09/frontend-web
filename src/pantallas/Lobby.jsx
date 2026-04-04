// src/pantallas/Lobby.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/gameStore';
import { fetchApi } from '../services/api';
import MenuCrearPartida from '../components/lobby/MenuCrearPartida';
import SalaLobby from '../components/lobby/SalaLobby';
import MenuUnirsePartida from '../components/lobby/MenuUnirsePartida';
import PanelInteligencia from '../components/lobby/PanelInteligencia';
import '../styles/Lobby.css';

/**
 * Pantalla principal del lobby (fullscreen, sin navbar).
 * Tres botones en la mesa: Archivos de Inteligencia | Operaciones | Alianzas.
 * Vista activa: 'mando' | 'inteligencia' | 'operaciones' | 'crear' | 'sala' | 'unirse' | 'amigos'
 */
const Lobby = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const crearPartidaBackend = useGameStore((state) => state.crearPartidaBackend);
  const unirsePartidaBackend = useGameStore((state) => state.unirsePartidaBackend);

  const [vistaActual, setVistaActual] = useState('mando');
  const [cargandoRapida, setCargandoRapida] = useState(false);
  const [errorRapida, setErrorRapida] = useState(null);

  // Datos mock de partidas de amigos (se sustituirán por llamada real)
  const [partidas] = useState([
    { id: '101', nombre: 'PRUEBA1', jugadores: 1, maxJugadores: 2, estado: 'Esperando rival' },
    { id: '102', nombre: 'PRUEBA2', jugadores: 2, maxJugadores: 2, estado: 'En curso' },
    { id: '103', nombre: 'ALPHA_TEAM', jugadores: 1, maxJugadores: 4, estado: 'Esperando rival' },
  ]);

  const handleLogout = () => { logout(); navigate('/'); };

  /** Busca sala pública disponible o crea una nueva. */
  const handlePartidaRapida = async () => {
    setCargandoRapida(true);
    setErrorRapida(null);
    try {
      const listaPublicas = await fetchApi('/v1/partidas');
      const salaDisponible = listaPublicas.find((p) => p.estado === 'creando');
      const resultado = salaDisponible
        ? await unirsePartidaBackend(salaDisponible.codigo_invitacion)
        : await crearPartidaBackend({ config_max_players: 4, config_visibility: 'publica', config_timer_seconds: 1200 });

      if (resultado) {
        setVistaActual('sala');
      }
    } catch (error) {
      console.error('Error en partida rápida:', error);
      setErrorRapida(error?.message || 'Error de conexión con el servidor.');
    } finally {
      setCargandoRapida(false);
    }
  };

  const estiloBotonMesa = {
    background: 'var(--color-ui-bg-secondary)',
    color: 'var(--color-border-gold)',
    border: '2px solid var(--color-border-bronze)',
    padding: '1rem',
    fontFamily: 'var(--font-family-title)',
    fontSize: '1.2vw',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    height: '6vw'
  };

  const estiloTarjeta = {
    background: 'var(--color-map-land-neutral)',
    border: '2px solid var(--color-border-bronze)',
    borderRadius: '8px',
    width: '30%',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    color: 'var(--color-ui-bg-primary)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-ui-bg-primary)' }}>

      {/* Fondo de imagen */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/mesa-mando.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden'
      }}>

        {vistaActual === 'mando' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>

            {/* IZQUIERDA: Archivos de Inteligencia */}
            <button
              onClick={() => setVistaActual('inteligencia')}
              style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '15%', width: '18%' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
            >
              Archivos de Inteligencia
            </button>

            {/* CENTRO: Operaciones */}
            <button
              onClick={() => { setVistaActual('operaciones'); setErrorRapida(null); }}
              style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '41%', width: '18%' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
            >
              Operaciones
            </button>

            {/* DERECHA: Alianzas */}
            <button
              onClick={() => setVistaActual('amigos')}
              style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', right: '15%', width: '18%' }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
            >
              Alianzas
            </button>

          </div>
        )}

        {vistaActual === 'inteligencia' && (
          <PanelInteligencia onCerrar={() => setVistaActual('mando')} />
        )}

        {vistaActual === 'operaciones' && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
          }}>
            <div style={{
              width: '75%', background: 'var(--color-ui-panel-overlay)', border: '2px solid var(--color-border-gold)',
              borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
            }}>
              <h2 style={{ color: 'var(--color-border-gold)', fontFamily: 'var(--font-family-title)', margin: 0, fontSize: '2vw', letterSpacing: '2px' }}>
                OPERACIONES
              </h2>

              {errorRapida && <p className="lobby-error">⚠ {errorRapida}</p>}

              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1.5rem' }}>

                <div
                  style={{ ...estiloTarjeta, opacity: cargandoRapida ? 0.6 : 1, cursor: cargandoRapida ? 'not-allowed' : 'pointer' }}
                  onClick={cargandoRapida ? undefined : handlePartidaRapida}
                  onMouseOver={(e) => { if (!cargandoRapida) e.currentTarget.style.transform = 'translateY(-10px)'; }}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Partida Rápida</h3>
                  <p style={{ flex: 1, fontSize: '0.9vw' }}>Busca una sala pública disponible y te une automáticamente. Si no hay, crea una nueva.</p>
                  <button disabled={cargandoRapida} style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: cargandoRapida ? 'var(--color-state-disabled)' : 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: cargandoRapida ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                    {cargandoRapida ? 'Buscando...' : 'INICIAR ➔'}
                  </button>
                </div>

                <div
                  style={estiloTarjeta}
                  onClick={() => setVistaActual('crear')}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Crear Partida</h3>
                  <p style={{ flex: 1, fontSize: '0.9vw' }}>Establece una nueva sala con tu configuración y genera un código para tus contrincantes.</p>
                  <button style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>FUNDAR ➔</button>
                </div>

                <div
                  style={estiloTarjeta}
                  onClick={() => setVistaActual('unirse')}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Unirse con Código</h3>
                  <p style={{ flex: 1, fontSize: '0.9vw' }}>Introduce el código de operaciones que te ha facilitado el comandante que fundó la sala.</p>
                  <button style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>INFILTRARSE ➔</button>
                </div>

              </div>

              <button className="lobby-boton-secundario" onClick={() => setVistaActual('mando')}>
                CANCELAR ORDEN
              </button>
            </div>
          </div>
        )}

        {/* CREAR PARTIDA */}
        {vistaActual === 'crear' && (
          <MenuCrearPartida
            onCreada={() => setVistaActual('sala')}
            onCancelar={() => setVistaActual('operaciones')}
          />
        )}

        {/* SALA DE ESPERA */}
        {vistaActual === 'sala' && (
          <SalaLobby onVolver={() => setVistaActual('mando')} />
        )}

        {/* UNIRSE CON CÓDIGO */}
        {vistaActual === 'unirse' && (
          <MenuUnirsePartida
            onUnido={() => setVistaActual('sala')}
            onCancelar={() => setVistaActual('operaciones')}
          />
        )}

        {/* ALIANZAS (partidas de amigos — mock) */}
        {vistaActual === 'amigos' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <button
              onClick={() => setVistaActual('mando')}
              style={{ position: 'absolute', top: '2%', right: '2%', padding: '0.6rem 1.2rem', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9vw' }}
            >
              ⬅ Volver a la Mesa
            </button>

            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: 'var(--color-ui-bg-primary)', textAlign: 'center', fontFamily: 'var(--font-family-title)', borderBottom: '2px solid var(--color-ui-bg-primary)', paddingBottom: '0.5rem', margin: 0 }}>
                Alianzas — Partidas de Amigos
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {partidas.map((p) => {
                  const llena = p.jugadores === p.maxJugadores;
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-ui-bg-secondary)', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1vw', color: 'var(--color-ui-bg-primary)', fontFamily: 'var(--font-family-title)' }}>{p.nombre}</span>
                        <span style={{ fontSize: '0.75vw', color: 'var(--color-ui-bg-secondary)', fontStyle: 'italic' }}>{p.jugadores}/{p.maxJugadores} — {p.estado}</span>
                      </div>
                      <button
                        disabled={llena}
                        onClick={() => navigate(`/partida/${p.id}`)}
                        style={{ padding: '0.4rem 1rem', background: llena ? 'transparent' : 'var(--color-state-danger)', color: llena ? 'var(--color-state-disabled)' : 'var(--color-text-primary)', border: llena ? '1px solid var(--color-state-disabled)' : 'none', cursor: llena ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8vw' }}
                      >
                        {llena ? 'CERRADA' : 'UNIRSE'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Lobby;