// src/pantallas/Lobby.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Lobby = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

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

    return (
        // CONTENEDOR EXTERIOR: Fondo negro, centra el mapa
        <div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

      // EL LIENZO MAGICO 16:9
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '100vw',
                maxHeight: '100vh',
                aspectRatio: '16/9',
                backgroundImage: 'url(/lobby-pantalla.png)',
                backgroundSize: '100% 100%',
                overflow: 'hidden'
            }}>

                {/* === BOTÓN EN LA PLACA (ARRIBA AL CENTRO) === */}
                <button
                    onClick={handleCrearPartida}
                    style={{
                        position: 'absolute',
                        top: '4.5%',      // Distancia desde arriba
                        left: '50%',      // Centrado horizontalmente
                        transform: 'translateX(-50%)',
                        width: '18%',     // Ancho de la placa de latón
                        height: '7%',     // Alto de la placa
                        background: 'transparent', // Transparente para que se vea el latón
                        color: '#1a1a1a',
                        fontWeight: 'bold',
                        fontSize: '1vw',  // El texto crece o encoge con la pantalla
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textShadow: '1px 1px 0px rgba(255, 255, 255, 0.3)'
                    }}
                >
                    Crear Operación
                </button>

                {/* === LISTA DE PARTIDAS EN EL PERGAMINO (IZQUIERDA) === */}
                <div style={{
                    position: 'absolute',
                    top: '28%',       // Distancia desde arriba para librar la chincheta
                    left: '4%',       // Distancia desde la izquierda
                    width: '18%',     // Ancho exacto del pergamino
                    height: '60%',    // Alto exacto del pergamino
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    overflowY: 'auto', // Scroll si hay muchas partidas
                }}>
                    {/* Título manuscrito del pergamino */}
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#3e2723', textAlign: 'center', fontFamily: 'serif', borderBottom: '1px solid #3e2723', paddingBottom: '0.2rem', fontSize: '1.2vw' }}>
                        Órdenes Activas
                    </h3>

                    {/* Tarjetas de partidas adaptadas al estilo papel */}
                    {partidas.map((partida) => (
                        <div key={partida.id} style={{
                            background: 'rgba(0, 0, 0, 0.05)', // Casi transparente
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            borderRadius: '2px',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                            color: '#1a1a1a' // Texto oscuro como tinta
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.85vw', fontFamily: 'serif' }}>{partida.nombre}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.7vw', color: '#444' }}>{partida.jugadores}/{partida.maxJugadores} reclutas</span>
                                <button
                                    disabled={partida.jugadores === partida.maxJugadores}
                                    onClick={() => handleUnirse(partida.id)}
                                    style={{
                                        padding: '0.2rem 0.5rem',
                                        background: partida.jugadores === partida.maxJugadores ? 'transparent' : '#8b0000', // Rojo sangre si puedes entrar
                                        color: partida.jugadores === partida.maxJugadores ? '#888' : 'white',
                                        border: partida.jugadores === partida.maxJugadores ? '1px solid #888' : 'none',
                                        borderRadius: '2px',
                                        cursor: partida.jugadores === partida.maxJugadores ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.7vw'
                                    }}
                                >
                                    {partida.jugadores === partida.maxJugadores ? 'LLENA' : 'UNIRSE'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* IDENTIFICACIÓN DE USUARIO (Abajo a la derecha) */}
                <div style={{
                    position: 'absolute',
                    bottom: '3%',
                    right: '3%',
                    background: 'rgba(255, 255, 255, 0.8)',
                    padding: '0.5rem 1rem',
                    border: '1px solid #333',
                    fontFamily: 'monospace',
                    color: 'black',
                    fontSize: '0.9vw'
                }}>
                    ID RECLUTA: {user ? user.nombre.toUpperCase() : 'DESCONOCIDO'}
                </div>

            </div>
        </div>
    );
};

export default Lobby;