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
        // contenedor padre súper grande con fondo negro para centrar todo el tinglado
        <div style={{ width: '100%', height: '100%', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

      // bloque principal que fuerza la pantalla a formato panorámico 16:9
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

                {/* el botón transparente encima del dibujo de la placa */}
                <button
                    onClick={handleCrearPartida}
                    style={{
                        position: 'absolute',
                        top: '4.5%',      // Distancia desde arriba
                        left: '50%',      // Centrado horizontalmente
                        transform: 'translateX(-50%)',
                        width: '18%',     // a ojo para que cuadre con el dibujo
                        height: '7%',     // igual que el ancho
                        background: 'transparent', // lo vaciamos para que se vea la placa por debajo
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

                {/* cuadro de scroll invisible por encima del dibujo del pergamino */}
                <div style={{
                    position: 'absolute',
                    top: '28%',       // lo bajamos un poco para no tapar la chincheta del dibujo
                    left: '4%',       // ajustado a ojo
                    width: '18%',     // clavamos el ancho con el dibujo
                    height: '60%',    // igual que el ancho
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    overflowY: 'auto', // por si nos llenan los lobbys
                }}>
                    {/* el titular centrado de la hoja */}
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#3e2723', textAlign: 'center', fontFamily: 'serif', borderBottom: '1px solid #3e2723', paddingBottom: '0.2rem', fontSize: '1.2vw' }}>
                        Órdenes Activas
                    </h3>

                    {/* cada partida es un recuadro casi transparente tipo tinta */}
                    {partidas.map((partida) => (
                        <div key={partida.id} style={{
                            background: 'rgba(0, 0, 0, 0.05)', // oscurecemos un poco para separar y ya
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            borderRadius: '2px',
                            padding: '0.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.3rem',
                            color: '#1a1a1a' // lo dejamos negro oscuro simulando tinta de pluma
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
                                        background: partida.jugadores === partida.maxJugadores ? 'transparent' : '#8b0000', // granate para llamar la atencion
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
                    ID RECLUTA: {user ? (user.nombre || user.nombre_usuario || user.username || 'DESCONOCIDO').toUpperCase() : 'DESCONOCIDO'}
                </div>

            </div>
        </div>
    );
};

export default Lobby;