import React from 'react';
import { useGameStore } from '../../store/gameStore';

const ControlAtaqueEspecial = () => {
    const estado = useGameStore();

    if (estado.faseActual !== 'ATAQUE_ESPECIAL') return null;
    if (!estado.origenSeleccionado) return null;

    const territorioSeleccionado = estado.origenSeleccionado;
    const esJugadorLocal = estado.propietarios[territorioSeleccionado] === estado.jugadorLocal;

    // Solo podemos lanzar ataques desde nuestros territorios (o usar el panel)
    if (!esJugadorLocal) return null;

    const cancelar = () => {
        useGameStore.setState({ origenSeleccionado: null, popupCoords: null });
    };

    const popupCoords = estado.popupCoords;
    const modalPosition = {
        position: 'fixed',
        top: popupCoords ? popupCoords.y : '50%',
        left: popupCoords ? popupCoords.x : '50%',
        transform: popupCoords ? `translate(-50%, ${popupCoords.orientacionArriba ? '-100%' : '15px'})` : 'translate(-50%, +15px)',
        zIndex: 9999
    };

    return (
        <div style={modalPosition}>
            <div style={styles.modal}>
                <h3>Ataque Especial</h3>
                <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                    Territorio: <b>{estado.grafoGlobal?.get(territorioSeleccionado)?.nombre || territorioSeleccionado}</b>
                </p>
                <div style={styles.botonesColumna}>
                    <button 
                        style={{ ...styles.btnBase, ...styles.btnAtacar }} 
                        onClick={() => alert("Habilidades tecnológicas aún en desarrollo")} 
                        title="Despliega el arsenal tecnológico"
                    >
                        🚀 Seleccionar Habilidad
                    </button>
                    <button style={{...styles.btnBase, ...styles.btnCancelar}} onClick={cancelar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    modal: {
        backgroundColor: 'var(--color-ui-bg-secondary)',
        color: '#FFF',
        padding: '20px',
        borderRadius: 'var(--radius-md)',
        width: '260px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center',
        border: '2px solid #E53E3E',
        backdropFilter: 'blur(4px)'
    },
    botonesColumna: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    btnBase: {
        border: 'none',
        padding: '10px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    btnAtacar: {
        backgroundColor: '#E53E3E',
        color: '#fff',
    },
    btnCancelar: {
        backgroundColor: '#4A5568',
        color: 'white',
    }
};

export default ControlAtaqueEspecial;
