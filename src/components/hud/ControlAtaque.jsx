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
    const maxAtaque = origen ? Math.max(1, (estado.tropas[origen] || 0) - 1) : 1;
    const popupCoords = estado.popupCoords;

    useEffect(() => {
        // Reset slider al montar el modal
        if (estado.preparandoAtaque) {
            setCantidad(maxAtaque);
            setAtacando(false);
        }
    }, [estado.preparandoAtaque, maxAtaque]);

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
                await estado.moverTropasConquista(cantidad);
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
                    <h3 style={{ color: resultadoBack.victoria_atacante ? '#48BB78' : '#E53E3E' }}>
                        {resultadoBack.victoria_atacante ? '¡Victoria!' : 'Reporte de Batalla'}
                    </h3>
                    <div style={styles.sliderContainer}>
                        <p style={{ margin: '10px 0' }}>Has causado <b>{resultadoBack.bajas_defensor}</b> bajas.</p>
                        <p style={{ margin: '10px 0' }}>Has sufrido <b>{resultadoBack.bajas_atacante}</b> bajas.</p>
                        {resultadoBack.victoria_atacante && (
                            <>
                                <p style={{ color: '#48BB78', fontWeight: 'bold' }}>
                                    ¡Conquista exitosa! Territorio bajo tu control.
                                </p>
                                <label style={{marginTop: '15px', color: '#FFF'}}>Traslada fuerzas de ocupación (mínimo 1): {cantidad}</label>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max={maxAtaque} 
                                    value={cantidad} 
                                    onChange={e => setCantidad(Number(e.target.value))} 
                                    style={styles.slider}
                                    disabled={atacando}
                                />
                            </>
                        )}
                        {!resultadoBack.victoria_atacante && (
                            <p style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                                El ataque ha fracasado. El defensor resiste.
                            </p>
                        )}
                    </div>
                    <div style={styles.botones}>
                        <button style={{ ...styles.btnAtaque, backgroundColor: '#48BB78', width: '100%' }} onClick={cerrarResultado} disabled={atacando}>
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
                <h3>Planear Ataque</h3>
                <p>
                    Desde <b>{origen}</b> hacia <b>{destino}</b>.
                </p>
                <div style={styles.sliderContainer}>
                    <label>Fuerza Total: {maxAtaque} Tropas</label>
                    <p style={{ fontSize: '0.8rem', color: '#CBD5E0' }}>Se realizará un ataque con todas tus tropas disponibles.</p>
                </div>
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
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center'
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
    slider: {
        width: '100%',
        accentColor: '#E53E3E'
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
