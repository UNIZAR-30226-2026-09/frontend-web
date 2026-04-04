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
        } catch (error) {
            console.error('Error al atacar:', error);
            alert("No se pudo efectuar el ataque. Asegúrese de que es su turno.");
            useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null, comarcasResaltadas: [] });
            setAtacando(false);
        }
    };

    const cerrarResultado = () => {
        if (resultadoBack?.victoria_atacante) {
            estado.prepararTrasladoConquista(origen, destino);
        }
        setResultadoBack(null);
        useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null });
    };

    const cancelar = () => {
        useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null });
    };

    if (resultadoBack) {
        return (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3>Reporte de Batalla</h3>
                    <div style={styles.sliderContainer}>
                        <p style={{ margin: '10px 0' }}>Has causado <b>{resultadoBack.bajas_defensor}</b> bajas.</p>
                        <p style={{ margin: '10px 0' }}>Has sufrido <b>{resultadoBack.bajas_atacante}</b> bajas.</p>
                        {resultadoBack.victoria_atacante && (
                            <p style={{ color: '#48BB78', fontWeight: 'bold' }}>
                                ¡Conquista exitosa! Territorio bajo tu control.
                            </p>
                        )}
                        {!resultadoBack.victoria_atacante && (
                            <p style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                                El ataque ha fracasado. El defensor resiste.
                            </p>
                        )}
                    </div>
                    <div style={styles.botones}>
                        <button style={{ ...styles.btnAtaque, backgroundColor: '#48BB78' }} onClick={cerrarResultado}>
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
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
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    modal: {
        backgroundColor: '#2A2A35',
        color: '#FFF',
        padding: '24px',
        borderRadius: '12px',
        width: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center'
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
