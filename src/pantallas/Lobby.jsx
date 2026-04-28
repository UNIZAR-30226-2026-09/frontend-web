// src/pantallas/Lobby.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useGameStore } from '../store/gameStore';
import { fetchApi } from '../services/api';
import MenuCrearPartida from '../components/lobby/MenuCrearPartida';
import SalaLobby from '../components/lobby/SalaLobby';
import MenuUnirsePartida from '../components/lobby/MenuUnirsePartida';
import PanelInteligencia from '../components/lobby/PanelInteligencia';
import PanelAlianzas from '../components/lobby/PanelAlianzas';
import MenuInicialSoberania from '../components/lobby/MenuInicialSoberania';
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
  const reanudarPartidaBackend = useGameStore((state) => state.reanudarPartidaBackend);

  const [vistaActual, setVistaActual] = useState('mando');
  const [cargandoRapida, setCargandoRapida] = useState(false);
  const [errorRapida, setErrorRapida] = useState(null);
  const [popupSalaCerrada, setPopupSalaCerrada] = useState(null);
  const [partidasPausadas, setPartidasPausadas] = useState([]);

  useEffect(() => {
    const handleSalaCerrada = (e) => {
      setVistaActual('mando');
      setPopupSalaCerrada(e.detail?.mensaje || "El host ha abandonado la sala y la partida ha sido cancelada.");
    };
    window.addEventListener('sala_cerrada', handleSalaCerrada);
    return () => window.removeEventListener('sala_cerrada', handleSalaCerrada);
  }, []);

  useEffect(() => {
    if (vistaActual === 'operaciones') {
      const cargarPartidasPausadas = async () => {
        try {
          const data = await fetchApi('/v1/partidas/pausadas');
          setPartidasPausadas(data || []);
        } catch (error) {
          console.error("Error al cargar operaciones en suspenso:", error);
        }
      };
      cargarPartidasPausadas();
    }
  }, [vistaActual]);

  // Datos mock de partidas de amigos (se sustituirán por llamada real)
  const [partidas] = useState([
    { id: '101', nombre: 'PRUEBA1', jugadores: 1, maxJugadores: 2, estado: 'Esperando rival' },
    { id: '102', nombre: 'PRUEBA2', jugadores: 2, maxJugadores: 2, estado: 'En curso' },
    { id: '103', nombre: 'ALPHA_TEAM', jugadores: 1, maxJugadores: 4, estado: 'Esperando rival' },
  ]);

  const handleLogout = () => { logout(); navigate('/'); };

  const handleReanudarPartida = async (codigo) => {
    try {
      await reanudarPartidaBackend(codigo);
      setVistaActual('sala');
    } catch (error) {
      alert("No se pudo reanudar la partida. ¿Quizás no eres el creador o el código es inválido?");
    }
  };

  /** Busca sala pública disponible o crea una nueva. */
  const handlePartidaRapida = async () => {
    setCargandoRapida(true);
    setErrorRapida(null);
    try {
      const listaPublicas = await fetchApi('/v1/partidas');
      const salaDisponible = listaPublicas.find((p) => p.estado === 'creando');
      const resultado = salaDisponible
        ? await unirsePartidaBackend(salaDisponible.codigo_invitacion)
        : await crearPartidaBackend({ config_max_players: 4, config_visibility: 'publica', config_timer_seconds: 60 });

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
        backgroundImage: 'url(/fondoLobby.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        overflow: 'hidden'
      }}>

        {vistaActual === 'mando' && (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <MenuInicialSoberania
              onAbrirPerfil={() => setVistaActual('inteligencia')}
              onAbrirOperaciones={() => { setVistaActual('operaciones'); setErrorRapida(null); }}
              onAbrirAmigos={() => setVistaActual('amigos')}
            />
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
                  <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Unirse a una Partida</h3>
                  <p style={{ flex: 1, fontSize: '0.9vw' }}>Explora el listado de salas públicas disponibles o introduce un código de invitación directo.</p>
                  <button style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>INFILTRARSE ➔</button>
                </div>

              </div>

              {/* PANEL DE PARTIDAS PAUSADAS */}
              {partidasPausadas.length > 0 && (
                <div style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-border-bronze)', borderRadius: '8px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <h3 style={{ color: 'var(--color-border-gold)', margin: 0, textAlign: 'center', fontSize: '1.2rem', letterSpacing: '1px' }}>OPERACIONES EN SUSPENSO</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {partidasPausadas.map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-ui-bg-secondary)', padding: '0.8rem 1.2rem', borderRadius: '6px', borderLeft: '4px solid var(--color-border-gold)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Partida #{p.id}</span>
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Código de Acceso: {p.codigo_invitacion}</span>
                        </div>
                        <button
                          onClick={() => handleReanudarPartida(p.codigo_invitacion)}
                          style={{ padding: '0.6rem 1.5rem', background: 'var(--color-border-gold)', color: '#1A1200', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}
                        >
                          Reanudar Misión ➔
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

        {/* ALIANZAS Y AMIGOS */}
        {vistaActual === 'amigos' && (
          <PanelAlianzas onCerrar={() => setVistaActual('mando')} />
        )}

      </div>

      {/* POPUP: SALA CERRADA */}
      {popupSalaCerrada && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--color-ui-bg-secondary)', border: '2px solid var(--color-border-bronze)',
            padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '400px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ color: 'var(--color-state-danger)', marginTop: 0 }}>Sala Cerrada</h3>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              {popupSalaCerrada}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setPopupSalaCerrada(null)}
                style={{
                  flex: 1, padding: '0.6rem', background: 'var(--color-state-danger)',
                  border: '1px solid transparent', color: 'white', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Lobby;