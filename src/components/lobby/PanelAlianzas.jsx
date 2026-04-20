// src/components/lobby/PanelAlianzas.jsx
import React, { useState, useEffect } from 'react';
import { socialApi } from '../../services/socialApi';
import '../../styles/PanelAlianzas.css';

const PanelAlianzas = ({ onCerrar }) => {
    const [amigos, setAmigos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [tabActiva, setTabActiva] = useState('lista'); // 'lista' o 'solicitudes'
    const [busqueda, setBusqueda] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);

    useEffect(() => {
        if (tabActiva === 'lista') {
            const cargarAmigos = async () => {
                try {
                    const data = await socialApi.obtenerAmigos();
                    if (data && data.length > 0) {
                        setAmigos(data.map(a => ({ ...a, estado: a.estado || 'ONLINE' })));
                    } else {
                        setAmigos([]);
                    }
                } catch (error) {
                    console.error("Error al cargar amigos (activando simulación):", error);
                    setAmigos([]);
                }
            };
            cargarAmigos();
        }
    }, [tabActiva]);

    // Cargar solicitudes solo cuando se abre su pestaña
    useEffect(() => {
        if (tabActiva === 'solicitudes') {
            const fetchSolicitudes = async () => {
                setCargandoSolicitudes(true);
                try {
                    const data = await socialApi.obtenerSolicitudes();
                    setSolicitudes(data || []);
                } catch (error) {
                    console.error("Error al cargar peticiones:", error);
                } finally {
                    setCargandoSolicitudes(false);
                }
            };
            fetchSolicitudes();
        }
    }, [tabActiva]);

    // Función para gestionar los botones de Aceptar/Rechazar
    const handleProcesarSolicitud = async (solicitudId, accion) => {
        try {
            await socialApi.procesarSolicitud(solicitudId, accion);
            // Si sale bien, quitamos la solicitud de la lista visualmente
            setSolicitudes(prev => prev.filter(sol => sol.id !== solicitudId));
            alert(`Solicitud ${accion.toLowerCase()} con éxito.`);
            if (accion === 'ACEPTADA') {
                setTabActiva('lista');
            }
        } catch (error) {
            console.error("Fallo al procesar alianza:", error);
            alert(`Error del cuartel general (Backend): ${error.message || 'Error desconocido'}`);
        }
    };


    const handleAñadirAmigo = async () => {
        if (!busqueda) return;
        setEnviando(true);
        try {
            await socialApi.enviarSolicitudAmistad(busqueda);
            alert(`Mensajero enviado a ${busqueda} con la propuesta de alianza.`);
            setBusqueda('');
        } catch (error) {
            alert(error.message || 'Error al enviar la propuesta.');
        } finally {
            setEnviando(false);
        }
    };

    const getEstadoConfig = (estado) => {
        switch (estado) {
            case 'ONLINE': return { texto: 'Conectado', claseCard: 'alianzas-card-online', claseDot: 'dot-online' };
            case 'JUGANDO': return { texto: 'En Combate', claseCard: 'alianzas-card-jugando', claseDot: 'dot-jugando' };
            case 'EN_LOBBY': return { texto: 'En Sala de Espera', claseCard: 'alianzas-card-lobby', claseDot: 'dot-lobby' };
            default: return { texto: 'Desconectado', claseCard: 'alianzas-card-offline', claseDot: 'dot-offline' };
        }
    };

    return (
        <div className="alianzas-overlay">
            <div className="alianzas-panel">
                <button className="alianzas-cerrar" onClick={onCerrar}>✕</button>
                <h2 className="alianzas-titulo">Tratados y Alianzas</h2>

                <div className="alianzas-buscador">
                    <input
                        type="text"
                        className="alianzas-input"
                        placeholder="Buscar comandante por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAñadirAmigo()}
                    />
                    <button className="alianzas-btn-add" onClick={handleAñadirAmigo} disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Reclutar'}
                    </button>
                </div>

                <div className="alianzas-tabs">
                    <button
                        className={`alianzas-tab ${tabActiva === 'lista' ? 'alianzas-tab-activa' : ''}`}
                        onClick={() => setTabActiva('lista')}
                    >
                        Aliados
                    </button>
                    <button
                        className={`alianzas-tab ${tabActiva === 'solicitudes' ? 'alianzas-tab-activa' : ''}`}
                        onClick={() => setTabActiva('solicitudes')}
                    >
                        Peticiones Pendientes
                    </button>
                </div>

                <div className="alianzas-lista">
                    {tabActiva === 'lista' && amigos.map((amigo, idx) => {
                        // const config = getEstadoConfig(amigo.estado);
                        const estadoUI = (amigo.estado === 'ACEPTADA') ? 'ONLINE' : (amigo.estado || 'ONLINE');
                        const config = getEstadoConfig(estadoUI);
                        const userDataStr = localStorage.getItem('soberania_user');
                        const miUsuario = userDataStr ? (JSON.parse(userDataStr).nombre_usuario || '').trim().toLowerCase() : '';
                        let nombreAmigo = amigo.username;
                        if (!nombreAmigo) {
                            const u1 = (amigo.user_1 || '').trim().toLowerCase();
                            nombreAmigo = (u1 === miUsuario) ? amigo.user_2 : amigo.user_1;
                        }
                        nombreAmigo = nombreAmigo || 'Desconocido';
                        return (
                            <div key={idx} className={`alianzas-card ${config.claseCard}`}>
                                <div className="alianzas-info">
                                    <div className="alianzas-avatar">
                                        {nombreAmigo.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="alianzas-detalles">
                                        <span className="alianzas-nombre">{nombreAmigo}</span>
                                        <span className="alianzas-estado">
                                            <span className={`estado-dot ${config.claseDot}`}></span>
                                            {config.texto}
                                        </span>
                                    </div>
                                </div>
                                <div className="alianzas-acciones">
                                    {amigo.estado === 'JUGANDO' && (
                                        <button className="btn-accion btn-accion-principal" onClick={() => alert('Espectando sala: ' + amigo.salaActivaId)}>Espectar</button>
                                    )}
                                    {(amigo.estado === 'ONLINE' || amigo.estado === 'EN_LOBBY') && (
                                        <button className="btn-accion btn-accion-principal">Invitar</button>
                                    )}
                                    <button className="btn-accion" onClick={() => alert('Rompiendo alianza...')}>✕</button>
                                </div>
                            </div>
                        );
                    })}

                    {tabActiva === 'solicitudes' && (
                        <>
                            {cargandoSolicitudes ? (
                                <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Interceptando comunicaciones...</div>
                            ) : solicitudes.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem', fontStyle: 'italic' }}>
                                    No hay tratados pendientes de firma.
                                </div>
                            ) : (
                                solicitudes.map((sol, idx) => {
                                    const nombreSolicitante = sol.user_1 || sol.username || 'Desconocido';
                                    const idReal = sol.id || sol.solicitud_id || sol.id_solicitud;
                                    return (
                                        <div key={idx} className="alianzas-card" style={{ borderLeftColor: 'var(--color-border-gold)' }}>
                                            <div className="alianzas-info">
                                                <div className="alianzas-avatar">{nombreSolicitante.charAt(0).toUpperCase()}</div>
                                                <div className="alianzas-detalles">
                                                    <span className="alianzas-nombre">{nombreSolicitante}</span>
                                                    <span className="alianzas-estado">Propuesta de alianza entrante</span>
                                                </div>
                                            </div>
                                            <div className="alianzas-acciones">
                                                <button
                                                    className="btn-accion btn-accion-principal"
                                                    onClick={() => handleProcesarSolicitud(idReal, 'ACEPTADA')}
                                                >
                                                    Aceptar
                                                </button>
                                                <button
                                                    className="btn-accion"
                                                    onClick={() => handleProcesarSolicitud(idReal, 'RECHAZADA')}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PanelAlianzas;