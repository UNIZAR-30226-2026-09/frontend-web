import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const ControlGestion = () => {
    const estado = useGameStore();

    if (estado.faseActual !== 'GESTION') return null;
    if (!estado.origenSeleccionado) return null;
    if (!estado.popupCoords) return null;

    const territorioSeleccionado = estado.origenSeleccionado;
    const esJugadorLocal = estado.propietarios[territorioSeleccionado] === estado.jugadorLocal;

    // Solo podemos gestionar nuestros territorios
    if (!esJugadorLocal) return null;

    const trabajando = estado.territorioTrabajando === territorioSeleccionado;
    const investigando = estado.territorioInvestigando === territorioSeleccionado;
    
    // Limits: Solo un territorio puede estar trabajando o investigando por túrno globally
    const hayOtroTrabajando = estado.territorioTrabajando && estado.territorioTrabajando !== territorioSeleccionado;
    const hayOtroInvestigando = estado.territorioInvestigando && estado.territorioInvestigando !== territorioSeleccionado;

    const handleTrabajar = async () => {
        await estado.trabajarBackend(territorioSeleccionado);
        // Cerramos el panel tras ordenar trabajo
        useGameStore.setState({ origenSeleccionado: null, popupCoords: null });
    };

    const handleInvestigar = () => {
        // Guardamos el territorio pendiente ANTES de limpiar la selección,
        // para que el Árbol Tecnológico sepa a qué territorio asignar la investigación.
        useGameStore.setState({
            territorioInvestigandoPendiente: territorioSeleccionado,
            origenSeleccionado: null,
            popupCoords: null,
        });
        estado.toggleArbolTecnologico();
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
                <h3>Gestión Territorial</h3>
                <p style={{ marginBottom: '16px' }}>
                    Territorio: <b>{estado.grafoGlobal?.get(territorioSeleccionado)?.nombre || territorioSeleccionado}</b>
                </p>

                {trabajando && <p style={{ color: '#F6E05E', fontWeight: 'bold' }}>Trabajando...</p>}
                {investigando && <p style={{ color: '#63B3ED', fontWeight: 'bold' }}>Investigando...</p>}

                <div style={styles.botonesColumna}>
                    <button 
                        style={{ ...styles.btnBase, ...styles.btnTrabajar, ...( (trabajando || investigando || hayOtroTrabajando) ? styles.btnDisabled : {} ) }} 
                        onClick={handleTrabajar} 
                        disabled={trabajando || investigando || hayOtroTrabajando}
                        title={hayOtroTrabajando ? "Otro territorio ya está trabajando" : "Generar ingresos"}
                    >
                        ⚒️ Trabajar
                    </button>
                    
                    <button 
                        style={{ ...styles.btnBase, ...styles.btnInvestigar, ...( (trabajando || investigando || hayOtroInvestigando) ? styles.btnDisabled : {} ) }} 
                        onClick={handleInvestigar} 
                        disabled={trabajando || investigando || hayOtroInvestigando}
                        title={hayOtroInvestigando ? "Otro territorio ya está investigando" : "Abrir Árbol de Tecnología"}
                    >
                        📚 Investigar
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
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        textAlign: 'center',
        border: '2px solid var(--color-border-bronze)',
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
    btnTrabajar: {
        backgroundColor: '#D69E2E',
        color: '#fff',
    },
    btnInvestigar: {
        backgroundColor: '#3182CE',
        color: '#fff',
    },
    btnDisabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        filter: 'grayscale(0.8)'
    }
};

export default ControlGestion;
