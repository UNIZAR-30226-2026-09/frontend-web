import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { gameApi } from '../../services/gameApi';

const ControlFortificacion = () => {
    const estado = useGameStore();
    const [cantidad, setCantidad] = useState(1);
    const [fortificando, setFortificando] = useState(false);

    const origen = estado.origenSeleccionado;
    const destino = estado.destinoSeleccionado;
    const maxTropas = origen ? Math.max(1, (estado.tropas[origen] || 0) - 1) : 1;

    useEffect(() => {
        if (estado.preparandoFortificacion) {
            setCantidad(maxTropas);
            setFortificando(false);
        }
    }, [estado.preparandoFortificacion, maxTropas]);

    if (!estado.preparandoFortificacion || !origen || !destino) return null;

    const confirmarFortificacion = async () => {
        if (!estado.salaActiva?.id) return;
        setFortificando(true);
        try {
            await estado.fortificarBackend(origen, destino, cantidad);
        } catch (err) {
            console.error('Error al fortificar:', err);
            alert("Error al fortificar:\n" + (err?.message || "Error desconocido"));
            setFortificando(false);
        }
    };

    const cancelar = () => {
        useGameStore.setState({ preparandoFortificacion: false, destinoSeleccionado: null });
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{ color: '#F6E05E' }}>Fortificar</h3>
                <p>
                    Reubica tus tropas de <b>{origen}</b> a <b>{destino}</b>.
                </p>
                <div style={styles.sliderContainer}>
                    <label>Fuerzas enviadas: {cantidad}</label>
                    <input 
                        type="range" 
                        min="1" 
                        max={maxTropas} 
                        value={cantidad} 
                        onChange={e => setCantidad(Number(e.target.value))} 
                        style={styles.slider}
                        disabled={fortificando}
                    />
                </div>
                <div style={styles.botones}>
                    <button style={styles.btnConfirmar} onClick={confirmarFortificacion} disabled={fortificando}>
                        {fortificando ? "Enviando..." : "Desplegar"}
                    </button>
                    <button style={styles.btnCancelar} onClick={cancelar} disabled={fortificando}>
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    modal: {
        backgroundColor: '#2D3748',
        color: '#FFF',
        padding: '24px',
        borderRadius: '12px',
        width: '320px',
        boxShadow: '0 8px 32px rgba(236,201,75,0.2)',
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
        accentColor: '#F6E05E'
    },
    botones: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px'
    },
    btnConfirmar: {
        flex: 1,
        backgroundColor: '#ECC94B',
        color: '#1A202C',
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

export default ControlFortificacion;
