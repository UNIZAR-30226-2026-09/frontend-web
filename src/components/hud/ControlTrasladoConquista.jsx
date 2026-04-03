import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { gameApi } from '../../services/gameApi';

const ControlTrasladoConquista = () => {
    const estado = useGameStore();
    const [cantidad, setCantidad] = useState(1);
    const [moviendo, setMoviendo] = useState(false);

    const origen = estado.origenConquista;
    const destino = estado.destinoConquista;
    const maxTropas = origen ? Math.max(1, (estado.tropas[origen] || 0) - 1) : 1;

    useEffect(() => {
        if (estado.movimientoConquistaPendiente) {
            setCantidad(maxTropas);
            setMoviendo(false);
        }
    }, [estado.movimientoConquistaPendiente, maxTropas]);

    if (!estado.movimientoConquistaPendiente || !origen || !destino) return null;

    const confirmarTraslado = async () => {
        if (!estado.salaActiva?.id) return;
        setMoviendo(true);
        try {
            await estado.moverTropasConquista(cantidad);
        } catch (error) {
            console.error('Error al trasladar:', error);
            alert("Ocurrió un error al mover tus tropas imperiales.");
            setMoviendo(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={{ color: '#48BB78' }}>¡Victoria!</h3>
                <p>
                    Has conquistado <b>{destino}</b> desde <b>{origen}</b>.
                </p>
                <div style={styles.sliderContainer}>
                    <label>Traslada fuerzas de ocupación (mínimo 1): {cantidad}</label>
                    <input 
                        type="range" 
                        min="1" 
                        max={maxTropas} 
                        value={cantidad} 
                        onChange={e => setCantidad(Number(e.target.value))} 
                        style={styles.slider}
                        disabled={moviendo}
                    />
                </div>
                <button style={styles.btnConfirmar} onClick={confirmarTraslado} disabled={moviendo}>
                    {moviendo ? "Procesando..." : "Ocupar Territorio"}
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000 // Aún más alto que el ataque para prevalecer
    },
    modal: {
        backgroundColor: '#2D3748',
        color: '#FFF',
        padding: '30px',
        borderRadius: '12px',
        width: '350px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center'
    },
    sliderContainer: {
        margin: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    slider: {
        width: '100%',
        accentColor: '#48BB78'
    },
    btnConfirmar: {
        width: '100%',
        backgroundColor: '#48BB78',
        color: 'white',
        border: 'none',
        padding: '12px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1.1rem'
    }
};

export default ControlTrasladoConquista;
