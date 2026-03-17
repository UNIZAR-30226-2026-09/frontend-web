// src/pantallas/Lobby.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Lobby = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    // Controlamos en qué "pantalla" del Lobby estamos (mando o amigos)
    const [vistaActual, setVistaActual] = useState('mando');
    const [mostrarSelector, setMostrarSelector] = useState(false); // Para mostrar las 3 tarjetas
    const [codigoSala, setCodigoSala] = useState(''); // Para el input de "Unirse con Código"

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

    // Estilos compartidos para los botones de la mesa
    const estiloBotonMesa = {
        background: 'rgba(0, 0, 0, 0.6)',
        color: '#e0c097', // Color pergamino
        border: '2px solid #e0c097',
        padding: '1rem',
        fontFamily: 'serif',
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
        height: '6vw' // Le damos una altura fija basada en el ancho de la pantalla
    };

    const estiloTarjeta = {
        background: 'rgba(238, 222, 198, 0.95)', // Tono papel viejo claro
        border: '2px solid #3e2723',
        borderRadius: '8px',
        width: '30%',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        color: '#111',
        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    };

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            {/* El contenedor principal cambia de fondo según la vista */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                backgroundImage: vistaActual === 'mando' ? 'url(/mesa-mando.png)' : 'url(/cuaderno-partidas.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                overflow: 'hidden',
                transition: 'background-image 0.5s ease-in-out' // Transición suave al cambiar de fondo
            }}>

                {/* --- BOTÓN FIJO: ABANDONAR CAMPO --- */}
                <button
                    onClick={handleLogout}
                    style={{ position: 'absolute', top: '2%', left: '2%', padding: '0.6rem 1.2rem', background: 'rgba(139, 0, 0, 0.8)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9vw', textTransform: 'uppercase', zIndex: 10, transition: 'transform 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Abandonar Campo
                </button>

                {/* =========================================================
                    VISTA 1: LA MESA DE MANDO (Tus 3 opciones principales)
                   ========================================================= */}
                {vistaActual === 'mando' && (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

                        {/* 1. Crear Partida (Izquierda, sobre los soldados) */}
                        <button
                            onClick={() => setMostrarSelector(true)} // AHORA ABRE EL MENÚ
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '15%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                        >
                            Crear Operación
                        </button>

                        {/* 2. Partidas de Amigos (Centro, sobre el mapa) */}
                        <button
                            onClick={() => setVistaActual('amigos')}
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', left: '41%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                        >
                            Partidas de Amigos
                        </button>

                        {/* 3. Inteligencia (Derecha, sobre la carpeta Top Secret) */}
                        <button
                            onClick={() => alert('Sección de Inteligencia en desarrollo. ¡Próximamente!')}
                            style={{ ...estiloBotonMesa, position: 'absolute', top: '55%', right: '15%', width: '18%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                        >
                            Archivos De Inteligencia
                        </button>

                        {/* --- REQUISITO 2: SELECTOR DE JUEGO (MODAL CON TARJETAS) --- */}
                        {mostrarSelector && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                                display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
                            }}>
                                <div style={{
                                    width: '70%', background: 'rgba(20, 20, 20, 0.95)', border: '2px solid #e0c097', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem'
                                }}>
                                    <h2 style={{ color: '#e0c097', fontFamily: 'serif', margin: 0, fontSize: '2vw', letterSpacing: '2px' }}>MODALIDAD DE DESPLIEGUE</h2>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '1.5rem' }}>

                                        {/* TARJETA 1: Partida Rápida */}
                                        <div
                                            style={estiloTarjeta}
                                            onClick={handleCrearPartida}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #333', paddingBottom: '0.5rem', width: '100%' }}>Partida Rápida</h3>
                                            <p style={{ flex: 1, fontSize: '0.9vw' }}>Despliegue inmediato. Únete a una operación aleatoria en curso en el frente.</p>
                                            <button style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>DESPLEGAR ➔</button>
                                        </div>

                                        {/* TARJETA 2: Crear Partida */}
                                        <div
                                            style={estiloTarjeta}
                                            onClick={handleCrearPartida}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #333', paddingBottom: '0.5rem', width: '100%' }}>Crear Partida</h3>
                                            <p style={{ flex: 1, fontSize: '0.9vw' }}>Establece una nueva sala de operaciones y genera un código para tus contrincantes.</p>
                                            <button style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>FUNDAR ➔</button>
                                        </div>

                                        {/* TARJETA 3: Unirse con Código */}
                                        <div style={{ ...estiloTarjeta, cursor: 'default' }}>
                                            <h3 style={{ margin: '0 0 1rem 0', borderBottom: '1px solid #333', paddingBottom: '0.5rem', width: '100%' }}>Unirse con Código</h3>
                                            <p style={{ fontSize: '0.9vw', marginBottom: '0.5rem' }}>Introduce las coordenadas:</p>
                                            <input
                                                type="text"
                                                placeholder="Ej: 102"
                                                value={codigoSala}
                                                onChange={(e) => setCodigoSala(e.target.value)}
                                                style={{ width: '70%', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1vw', border: '1px solid #333', borderRadius: '4px', marginBottom: '1rem' }}
                                            />
                                            <button
                                                onClick={() => codigoSala ? handleUnirse(codigoSala) : alert('Comandante, debe introducir un código válido.')}
                                                style={{ padding: '0.5rem 1rem', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                INFILTRARSE ➔
                                            </button>
                                        </div>

                                    </div>

                                    {/* Botón para cerrar el panel */}
                                    <button
                                        onClick={() => setMostrarSelector(false)}
                                        style={{ padding: '0.6rem 2rem', background: 'transparent', color: '#ccc', border: '1px solid #555', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' }}
                                    >
                                        CANCELAR ORDEN
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =========================================================
                    VISTA 2: EL CUADERNO (Lista de partidas)
                   ========================================================= */}
                {vistaActual === 'amigos' && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>

                        {/* Botón para volver atrás */}
                        <button
                            onClick={() => setVistaActual('mando')}
                            style={{ position: 'absolute', top: '2%', right: '2%', padding: '0.6rem 1.2rem', background: '#333', color: 'white', border: '1px solid #777', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9vw' }}
                        >
                            ⬅ Volver a la Mesa
                        </button>

                        {/* Área donde pintamos el texto simulando estar escrito en el cuaderno */}
                        <div style={{ width: '40%', height: '60%', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '10%' }}>
                            <h2 style={{ color: '#1a1a1a', textAlign: 'center', fontFamily: 'serif', borderBottom: '2px solid #1a1a1a', paddingBottom: '0.5rem', margin: 0 }}>Registro de Operaciones</h2>

                            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '1rem' }}>
                                {partidas.map((partida) => (
                                    <div key={partida.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #555', paddingBottom: '0.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '1.2vw', color: '#111', fontFamily: 'serif' }}>{partida.nombre}</span>
                                            <span style={{ fontSize: '0.8vw', color: '#444', fontStyle: 'italic' }}>{partida.jugadores}/{partida.maxJugadores} Comandantes - {partida.estado}</span>
                                        </div>
                                        <button
                                            disabled={partida.jugadores === partida.maxJugadores}
                                            onClick={() => handleUnirse(partida.id)}
                                            style={{ padding: '0.4rem 1rem', background: partida.jugadores === partida.maxJugadores ? 'transparent' : '#8b0000', color: partida.jugadores === partida.maxJugadores ? '#888' : 'white', border: partida.jugadores === partida.maxJugadores ? '1px solid #888' : 'none', cursor: partida.jugadores === partida.maxJugadores ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '0.8vw' }}
                                        >
                                            {partida.jugadores === partida.maxJugadores ? 'CERRADA' : 'UNIRSE'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ID RECLUTA FIJO --- */}
                <div style={{ position: 'absolute', bottom: '2%', right: '2%', background: 'rgba(0, 0, 0, 0.7)', padding: '0.5rem 1rem', border: '1px solid #555', color: '#ccc', fontFamily: 'monospace', fontSize: '0.9vw', borderRadius: '4px' }}>
                    ID RECLUTA: {user ? String(user.nombre || user.nombre_usuario || user.username || 'DESCONOCIDO').toUpperCase() : 'DESCONOCIDO'}
                </div>

            </div>
        </div>
    );
};

export default Lobby;