import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Parsea una frase de log y colorea los nombres de jugadores con su color real.
 * Devuelve un array de spans con el texto troceado.
 */
const colorearNombres = (frase, coloresJugadores) => {
    if (!coloresJugadores || Object.keys(coloresJugadores).length === 0) {
        return frase;
    }

    // Ordenar jugadores por longitud desc para evitar que un nombre corto tape a uno largo
    const jugadores = Object.keys(coloresJugadores).sort((a, b) => b.length - a.length);
    // Crear regex que detecte los nombres como palabras (no como parte de otra)
    const escaped = jugadores.map(j => j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');

    const partes = frase.split(regex);
    return partes.map((parte, i) => {
        const color = coloresJugadores[parte];
        if (color) {
            return (
                <span
                    key={i}
                    style={{
                        color,
                        fontWeight: 'bold',
                        textShadow: `0 0 6px ${color}55`,
                    }}
                >
                    {parte}
                </span>
            );
        }
        return <span key={i}>{parte}</span>;
    });
};

const LogPartida = () => {
    const historialLog = useGameStore((state) => state.historialLog);
    const coloresJugadores = useGameStore((state) => state.coloresJugadores);
    const containerRef = useRef(null);

    // Los mensajes más nuevos están al principio del array (index 0).
    // Para mostrarlos abajo, invertimos el array antes de renderizar.
    const mensajesOrdenados = [...historialLog].reverse();

    // Auto-scroll al final (abajo) cada vez que llega un nuevo mensaje
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [historialLog]);

    if (!historialLog || historialLog.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '16px',
                left: '16px',
                width: '400px',
                height: '300px',
                background: 'var(--color-ui-panel-overlay, rgba(12, 10, 5, 0.92))',
                border: '2px solid var(--color-border-gold, #8C7322)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(5px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 900,
            }}
        >
            {/* Cabecera */}
            <div
                style={{
                    padding: '0.5rem 0.9rem',
                    borderBottom: '1px solid rgba(140, 115, 34, 0.25)',
                    flexShrink: 0,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontFamily: 'var(--font-family-title, serif)',
                        color: 'var(--color-border-gold, #C9A227)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                    }}
                >
                    MENSAJES DE LA PARTIDA
                </h3>
            </div>

            {/* Lista de mensajes */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0.5rem 0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    // Scrollbar estética dorada
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(140, 115, 34, 0.45) rgba(0, 0, 0, 0.25)',
                }}
                className="log-partida-scroll"
            >
                <AnimatePresence initial={false}>
                    {mensajesOrdenados.map((mensaje, index) => {
                        const esUltimo = index === mensajesOrdenados.length - 1;
                        return (
                            <motion.div
                                key={`${mensaje}-${index}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    borderBottom: esUltimo
                                        ? 'none'
                                        : '1px solid rgba(140, 115, 34, 0.12)',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    lineHeight: '1.5',
                                    color: esUltimo
                                        ? 'var(--color-text-primary, #E2E8F0)'
                                        : 'var(--color-text-secondary, #A0AEC0)',
                                    wordBreak: 'break-word',
                                    background: esUltimo
                                        ? 'rgba(140, 115, 34, 0.08)'
                                        : 'transparent',
                                    borderRadius: esUltimo ? '6px' : '0',
                                    transition: 'background 0.3s ease',
                                }}
                            >
                                {colorearNombres(mensaje, coloresJugadores)}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogPartida;
