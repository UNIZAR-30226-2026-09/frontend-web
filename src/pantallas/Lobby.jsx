// src/pantallas/Lobby.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Pantalla de vestíbulo donde el jugador puede crear, unirse o buscar partidas.
 * @returns {JSX.Element}
 */
const Lobby = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const [vistaActual, setVistaActual] = useState('mando');
    const [mostrarSelector, setMostrarSelector] = useState(false);
    const [codigoSala, setCodigoSala] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const [partidas, setPartidas] = useState([
        { id: '101', nombre: 'PRUEBA1', jugadores: 1, maxJugadores: 2, estado: 'Esperando rival' },
        { id: '102', nombre: 'PRUEBA2', jugadores: 2, maxJugadores: 2, estado: 'En curso' },
        { id: '103', nombre: 'TEEEEEEEETE67', jugadores: 1, maxJugadores: 2, estado: 'Esperando rival' },
        { id: '104', nombre: 'ALE ZARAGOZA ALE ALE', jugadores: 1, maxJugadores: 2, estado: 'Esperando rival' },
    ]);

    const handleUnirse = (idPartida) => {
        navigate(`/partida/${idPartida}`);
    };

    const handleCrearPartida = () => {
        const nuevaId = Math.floor(Math.random() * 1000).toString();
        navigate(`/partida/${nuevaId}`);
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

    let fondoPantalla = 'url(/cuaderno-partidas.png)';
    if (vistaActual === 'mando') {
        fondoPantalla = 'url(/mesa-mando.png)';
    }

    let nombreRecluta = 'DESCONOCIDO';
    if (user) {
        nombreRecluta = String(user.nombre || user.nombre_usuario || user.username || 'DESCONOCIDO').toUpperCase();
    }

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-ui-bg-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundImage: fondoPantalla,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                transition: 'background-image 0.5s ease-in-out'
            }}>

                <button
                    onClick={handleLogout}
                    style={{ position: 'absolute', top: '2%', left: '2%', padding: '0.6rem 1.2rem', background: 'var(--color-state-danger)', color: 'var(--color-text-primary)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9vw', textTransform: 'uppercase', zIndex: 10, transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Abandonar Campo
                </button>

                {vistaActual === 'mando' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

                        <button
                            onClick={() => setMostrarSelector(true)}
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '15%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
                        >
                            Crear Operación
                        </button>

                        <button
                            onClick={() => setVistaActual('amigos')}
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '41%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
                        >
                            Partidas de Amigos
                        </button>

                        <button
                            onClick={() => alert('Sin implementar')}
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', right: '15%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'var(--color-ui-panel-overlay)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'var(--color-ui-bg-secondary)'; }}
                        >
                            Archivos De Inteligencia
                        </button>

                        {mostrarSelector && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
                            }}>
                                <div style={{
                                    width: '70%', background: 'var(--color-ui-panel-overlay)', border: '2px solid var(--color-border-gold)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
                                }}>
                                    <h2 style={{ color: 'var(--color-border-gold)', fontFamily: 'var(--font-family-title)', margin: 0, fontSize: '2vw', letterSpacing: '2px' }}>MODALIDAD DE DESPLIEGUE</h2>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1.5rem' }}>

                                        <div
                                            style={estiloTarjeta}
                                            onClick={handleCrearPartida}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Partida Rápida</h3>
                                            <p style={{ flex: 1, fontSize: '0.9vw' }}>Despliegue inmediato. Únete a una operación aleatoria en curso en el frente.</p>
                                            <button style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>DESPLEGAR ➔</button>
                                        </div>

                                        <div
                                            style={estiloTarjeta}
                                            onClick={handleCrearPartida}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Crear Partida</h3>
                                            <p style={{ flex: 1, fontSize: '0.9vw' }}>Establece una nueva sala de operaciones y genera un código para tus contrincantes.</p>
                                            <button style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>FUNDAR ➔</button>
                                        </div>

                                        <div style={{ ...estiloTarjeta, cursor: 'default' }}>
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid var(--color-border-bronze)', paddingBottom: '0.5rem', width: '100%' }}>Unirse con Código</h3>
                                            <p style={{ fontSize: '0.9vw', marginBottom: '0.5rem' }}>Introduce las coordenadas:</p>
                                            <input
                                                type="text"
                                                placeholder="Ej: 102"
                                                value={codigoSala}
                                                onChange={(e) => setCodigoSala(e.target.value)}
                                                style={{ width: '70%', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1vw', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', marginBottom: '1rem', background: 'var(--color-text-primary)' }}
                                            />
                                            <button
                                                onClick={() => codigoSala ? handleUnirse(codigoSala) : alert('Comandante, debe introducir un código válido.')}
                                                style={{ padding: '0.5rem 1rem', background: 'var(--color-ui-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                INFILTRARSE ➔
                                            </button>
                                        </div>

                                    </div>

                                    <button
                                        onClick={() => setMostrarSelector(false)}
                                        style={{ padding: '0.6rem 2rem', background: 'transparent', color: 'var(--color-text-secondary)', border: '1px solid var(--color-text-secondary)', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' }}
                                    >
                                        CANCELAR ORDEN
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {vistaActual === 'amigos' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

                        <button
                            onClick={() => setVistaActual('mando')}
                            style={{ position: 'absolute', top: '2%', right: '2%', padding: '0.6rem 1.2rem', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-bronze)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9vw' }}
                        >
                            ⬅ Volver a la Mesa
                        </button>

                        <div style={{ width: '40%', height: '60%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '10%' }}>
                            <h2 style={{ color: 'var(--color-ui-bg-primary)', textAlign: 'center', fontFamily: 'var(--font-family-title)', borderBottom: '2px solid var(--color-ui-bg-primary)', paddingBottom: '0.5rem', margin: 0 }}>Registro de Operaciones</h2>

                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '1rem' }}>
                                {partidas.map((partida) => {
                                    const estaLlena = partida.jugadores === partida.maxJugadores;

                                    let colorFondoUnirse = 'var(--color-state-danger)';
                                    let colorTextoUnirse = 'var(--color-text-primary)';
                                    let bordeUnirse = 'none';
                                    let cursorUnirse = 'pointer';
                                    let textoBotonUnirse = 'UNIRSE';

                                    if (estaLlena) {
                                        colorFondoUnirse = 'transparent';
                                        colorTextoUnirse = 'var(--color-state-disabled)';
                                        bordeUnirse = '1px solid var(--color-state-disabled)';
                                        cursorUnirse = 'not-allowed';
                                        textoBotonUnirse = 'CERRADA';
                                    }

                                    return (
                                        <div key={partida.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--color-ui-bg-secondary)', paddingBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold', fontSize: '1.2vw', color: 'var(--color-ui-bg-primary)', fontFamily: 'var(--font-family-title)' }}>{partida.nombre}</span>
                                                <span style={{ fontSize: '0.8vw', color: 'var(--color-ui-bg-secondary)', fontStyle: 'italic' }}>{partida.jugadores}/{partida.maxJugadores} Comandantes - {partida.estado}</span>
                                            </div>
                                            <button
                                                disabled={estaLlena}
                                                onClick={() => handleUnirse(partida.id)}
                                                style={{ padding: '0.4rem 1rem', background: colorFondoUnirse, color: colorTextoUnirse, border: bordeUnirse, cursor: cursorUnirse, fontWeight: 'bold', fontSize: '0.8vw' }}
                                            >
                                                {textoBotonUnirse}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ position: 'absolute', bottom: '2%', right: '2%', background: 'var(--color-ui-panel-overlay)', padding: '0.5rem 1rem', border: '1px solid var(--color-border-bronze)', color: 'var(--color-text-primary)', fontFamily: 'monospace', fontSize: '0.9vw', borderRadius: '4px' }}>
                    ID RECLUTA: {nombreRecluta}
                </div>

            </div>
        </div>
    );
};

export default Lobby;