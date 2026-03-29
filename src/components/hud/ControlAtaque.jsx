import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { gameApi } from '../../services/gameApi';

const ControlAtaque = () => {
    const estado = useGameStore();
    const [cantidad, setCantidad] = useState(1);
    const [atacando, setAtacando] = useState(false);

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

    if (!estado.preparandoAtaque || !origen || !destino) return null;

    const confirmarAtaque = async () => {
        if (!estado.salaActiva?.id) return;
        setAtacando(true);
        try {
            await gameApi.atacarTerritorio(estado.salaActiva.id, origen, destino, maxAtaque);
            // El backend mandará ATAQUE_RESULTADO y el state limpiará la selección.
        } catch (error) {
            console.error('Error al atacar:', error);
            alert("No se pudo efectuar el ataque.");
            // En caso de error, podríamos cancelar la UI de ataque
            useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null, comarcasResaltadas: [] });
        } finally {
            setAtacando(false);
        }
    };

    const cancelar = () => {
        useGameStore.setState({ preparandoAtaque: false, destinoSeleccionado: null });
    };

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
