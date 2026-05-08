import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

const GameOverModal = () => {
    const estadoPartidaLocal = useGameStore(state => state.estadoPartidaLocal);
    const setEstadoPartidaLocal = useGameStore(state => state.setEstadoPartidaLocal);
    const abandonarSoberania = useGameStore(state => state.abandonarSoberania);
    const diccionarioJugadores = useGameStore(state => state.diccionarioJugadores);
    const ganadorFinal = useGameStore(state => state.ganadorFinal);

    if (estadoPartidaLocal === 'JUGANDO' || estadoPartidaLocal === 'ESPECTANDO') return null;

    const esVictoria = estadoPartidaLocal === 'VICTORIA';
    const esEspectadorFinal = estadoPartidaLocal === 'FINALIZADA_ESPECTANDO';

    // Si ya tenemos ganadorFinal guardado, la partida terminó: no hay nadie a quien espectar
    const quedanJugadoresVivos = !ganadorFinal && Object.values(diccionarioJugadores).some(
        (j) => !j.es_muerto && j.estado_jugador !== 'muerto'
    );
    const puedeEspectar = !esVictoria && !esEspectadorFinal && quedanJugadoresVivos;

    const handleSalir = async () => {
        await abandonarSoberania();
        window.location.href = '/';
    };

    const handleEspectar = () => {
        setEstadoPartidaLocal('ESPECTANDO');
    };

    // ── Pantalla para ESPECTADORES cuando termina la partida ──
    if (esEspectadorFinal) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={styles.overlay}
                >
                    <motion.div
                        initial={{ scale: 0.5, y: 100, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        style={{ ...styles.modal, boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)', border: '2px solid #D4AF37' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
                        <h1 style={{ ...styles.titulo, color: '#D4AF37', textShadow: '0 0 20px rgba(212, 175, 55, 0.8)' }}>
                            PARTIDA FINALIZADA
                        </h1>
                        {ganadorFinal && (
                            <p style={{ ...styles.subtitulo, color: '#D4AF37', fontWeight: 'bold', fontSize: '1.3rem' }}>
                                🎖️ Ganador: <span style={{ textTransform: 'uppercase' }}>{ganadorFinal}</span>
                            </p>
                        )}
                        <p style={styles.subtitulo}>
                            La contienda ha llegado a su fin. El campo de batalla aguarda nuevas campañas.
                        </p>
                        <div style={styles.buttonContainer}>
                            <button style={styles.button} onClick={handleSalir}>
                                Volver al cuartel general
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // ── Pantalla normal de victoria / derrota ──
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.overlay}
            >
                <motion.div
                    initial={{ scale: 0.5, y: 100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    style={{
                        ...styles.modal,
                        boxShadow: esVictoria ? '0 0 50px rgba(212, 175, 55, 0.6)' : '0 0 50px rgba(229, 62, 62, 0.4)',
                        border: `2px solid ${esVictoria ? '#D4AF37' : '#E53E3E'}`
                    }}
                >
                    <h1 style={{ 
                        ...styles.titulo,
                        color: esVictoria ? '#D4AF37' : '#E53E3E',
                        textShadow: esVictoria ? '0 0 20px rgba(212, 175, 55, 0.8)' : 'none'
                    }}>
                        {esVictoria ? '¡VICTORIA TOTAL!' : 'HAS SIDO ELIMINADO'}
                    </h1>
                    
                    <p style={styles.subtitulo}>
                        {esVictoria 
                            ? 'Has unificado Aragón bajo tu estandarte. La historia recordará tu nombre.' 
                            : 'Tus legiones han caído y tus tierras han sido reclamadas. Tu soberanía termina aquí.'}
                    </p>

                    <div style={styles.buttonContainer}>
                        <button style={styles.button} onClick={handleSalir}>
                            Volver a la sala
                        </button>
                        
                        {puedeEspectar && (
                            <button style={styles.buttonEspectar} onClick={handleEspectar}>
                                Espectar partida
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        backdropFilter: 'blur(8px)'
    },
    modal: {
        backgroundColor: 'var(--color-ui-bg-secondary, #1A1A2E)',
        padding: '50px',
        borderRadius: '20px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%'
    },
    titulo: {
        fontSize: '3.5rem',
        margin: '0 0 20px 0',
        fontWeight: '900',
        letterSpacing: '2px'
    },
    subtitulo: {
        color: '#CBD5E0',
        fontSize: '1.2rem',
        lineHeight: '1.6',
        margin: '0 0 40px 0'
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    button: {
        padding: '15px 30px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: 'var(--color-ui-bg-secondary, #1A1A2E)',
        backgroundColor: 'var(--color-border-gold, #D4AF37)',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'filter 0.2s, transform 0.2s',
    },
    buttonEspectar: {
        backgroundColor: 'transparent',
        border: '2px solid var(--color-border-gold, #D4AF37)',
        color: 'var(--color-border-gold, #D4AF37)',
        padding: '12px 25px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold'
    }
};

export default GameOverModal;
