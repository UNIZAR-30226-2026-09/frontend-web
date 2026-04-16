import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { gameApi } from '../../services/gameApi';

const ControlAtaque = () => {
    const estado = useGameStore();
    const [cantidad, setCantidad] = useState(1);
    const [atacando, setAtacando] = useState(false);
    const [resultadoBack, setResultadoBack] = useState(null);

    const origen = estado.origenSeleccionado;
    const destino = estado.destinoSeleccionado;
    const maxAtaque = resultadoBack?.victoria_atacante 
        ? Math.max(1, (resultadoBack.tropas_restantes_origen || 0) - 1)
        : (origen ? Math.max(1, (estado.tropas[origen] || 0) - 1) : 1);
    const popupCoords = estado.popupCoords;

    useEffect(() => {
        // Reset slider al montar el modal
        if (estado.preparandoAtaque) {
            setCantidad(maxAtaque);
            setAtacando(false);
        }
    }, [estado.preparandoAtaque, maxAtaque]);

    // Forcefully reset the troops selector to the newly calculated max once combat finishes
    useEffect(() => {
        if (resultadoBack?.victoria_atacante) {
            setCantidad(maxAtaque);
        }
    }, [resultadoBack]);

    if (!estado.preparandoAtaque && !resultadoBack) return null;

    const confirmarAtaque = async () => {
        if (!estado.salaActiva?.id) return;
        setAtacando(true);
        try {
            const res = await estado.ejecutarAtaque(origen, destino, maxAtaque);
            setResultadoBack(res);
            setAtacando(false);
        } catch (error) {
            console.error('Error al atacar:', error);
            alert("No se pudo efectuar el ataque. Asegúrese de que es su turno.");
            useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null, comarcasResaltadas: [] });
            setAtacando(false);
        }
    };

    const cerrarResultado = async () => {
        if (resultadoBack?.victoria_atacante) {
            setAtacando(true);
            try {
                const aMover = Math.min(cantidad, maxAtaque);
                await estado.moverTropasConquista(aMover);
            } catch (err) {
                console.error('Error al trasladar:', err);
                alert("Ocurrió un error al mover tus tropas imperiales.");
                setAtacando(false);
                return;
            }
        }
        setResultadoBack(null);
        estado.limpiarSeleccion();
        setAtacando(false);
    };

    const incrementar = () => {
        if (Math.min(cantidad, maxAtaque) < maxAtaque) {
            setCantidad(Math.min(cantidad + 1, maxAtaque));
        }
    };

    const decrementar = () => {
        if (Math.min(cantidad, maxAtaque) > 1) {
            setCantidad(Math.min(cantidad - 1, maxAtaque));
        }
    };

    const cancelar = () => {
        useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null });
    };

    const modalPosition = {
        position: 'fixed',
        top: popupCoords ? popupCoords.y : '50%',
        left: popupCoords ? popupCoords.x : '50%',
        transform: popupCoords ? `translate(-50%, ${popupCoords.orientacionArriba ? '-100%' : '15px'})` : 'translate(-50%, +15px)',
        zIndex: 9999
    };

    if (resultadoBack) {
        return (
            <div style={styles.overlayCentral}>
                <div style={styles.modalCentral}>
                    <h3 style={{ color: resultadoBack.victoria_atacante ? '#F6E05E' : '#E53E3E' }}>
                        {resultadoBack.victoria_atacante ? '¡Victoria!' : 'Reporte de Batalla'}
                    </h3>
                    <div style={styles.sliderContainer}>
                        <p style={{ margin: '10px 0' }}>Has causado <b>{resultadoBack.bajas_defensor}</b> bajas.</p>
                        <p style={{ margin: '10px 0' }}>Has sufrido <b>{resultadoBack.bajas_atacante}</b> bajas.</p>
                        {resultadoBack.victoria_atacante && (
                            <>
                                <p style={{ color: '#F6E05E', fontWeight: 'bold' }}>
                                    ¡Conquista exitosa! Territorio bajo tu control.
                                </p>
                                <label style={{marginTop: '15px', color: '#FFF'}}>Tropas de ocupación: {Math.min(cantidad, maxAtaque)}</label>
                                <div style={styles.sliderGroup}>
                                    <button 
                                        style={styles.btnMathGolden} 
                                        onClick={decrementar}
                                        disabled={Math.min(cantidad, maxAtaque) <= 1 || atacando}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="range" 
                                        min="1" 
                                        max={maxAtaque} 
                                        value={Math.min(cantidad, maxAtaque)} 
                                        onChange={e => setCantidad(Number(e.target.value))} 
                                        style={styles.sliderGolden}
                                        disabled={atacando}
                                    />
                                    <button 
                                        style={styles.btnMathGolden} 
                                        onClick={incrementar}
                                        disabled={Math.min(cantidad, maxAtaque) >= maxAtaque || atacando}
                                    >
                                        +
                                    </button>
                                </div>
                            </>
                        )}
                        {!resultadoBack.victoria_atacante && (
                            <p style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                                El ataque ha fracasado. El defensor resiste.
                            </p>
                        )}
                    </div>
                    <div style={styles.botones}>
                        <button style={{ ...styles.btnGolden, width: '100%' }} onClick={cerrarResultado} disabled={atacando}>
                            {atacando ? "Procesando..." : (resultadoBack.victoria_atacante ? "Ocupar Territorio" : "Continuar")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={modalPosition}>
            <div style={styles.modal}>
                <h3>Ataque</h3>
                <p style={{ marginBottom: '24px' }}>
                    Desde <b>{estado.grafoGlobal?.get(origen)?.nombre || origen}</b> hacia <b>{estado.grafoGlobal?.get(destino)?.nombre || destino}</b>.
                </p>
                <div style={styles.botones}>
                    <button style={styles.btnAtaque} onClick={confirmarAtaque} disabled={atacando || maxAtaque < 1}>
                        {atacando ? "Atacando..." : "¡Ataque Total!"}
                    </button>
                    <button style={styles.btnCancelar} onClick={cancelar} disabled={atacando}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlayCentral: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
    },
    modalCentral: {
        backgroundColor: '#2D3748',
        color: '#FFF',
        padding: '30px',
        borderRadius: '12px',
        width: '350px',
        boxShadow: '0 8px 32px rgba(236,201,75,0.2)',
        textAlign: 'center',
        border: '2px solid #F6E05E'
    },
    modal: {
        backgroundColor: 'var(--color-ui-bg-secondary)',
        color: '#FFF',
        padding: '24px',
        borderRadius: 'var(--radius-md)',
        width: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center',
        border: '2px solid var(--color-border-bronze)',
        backdropFilter: 'blur(4px)'
    },
    sliderContainer: {
        margin: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    sliderGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        margin: '15px 0',
        justifyContent: 'center'
    },
    slider: {
        width: '100%',
        accentColor: '#E53E3E'
    },
    sliderGolden: {
        flex: 1,
        accentColor: '#F6E05E'
    },
    botones: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px'
    },
    btnAtaque: {
        flex: 1,
        backgroundColor: '#E53E3E',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold'
    },
    btnGolden: {
        backgroundColor: '#ECC94B',
        color: '#1A202C',
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease'
    },
    btnMathGolden: {
        backgroundColor: '#F6E05E',
        color: '#1A202C',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '16px',
        transition: 'all 0.3s ease'
    },
    btnCancelar: {
        flex: 1,
        backgroundColor: '#4A5568',
        color: 'white',
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer'
    }
};

export default ControlAtaque;
