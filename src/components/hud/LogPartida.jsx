import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const LogPartida = () => {
    const historialLog = useGameStore((state) => state.historialLog);
    const containerRef = useRef(null);

    // Si prefieres que el autoscroll siempre vaya arriba (ya que los nuevos están en index 0)
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }
    }, [historialLog]);

    if (!historialLog || historialLog.length === 0) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                width: '320px',
                height: '200px',
                backgroundColor: 'rgba(15, 20, 25, 0.85)',
                border: '1px solid var(--color-border-primary, #4A5568)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 9000,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                pointerEvents: 'auto'
            }}
        >
            <h3 style={{ 
                margin: '0 0 8px 0', 
                color: 'var(--color-text-secondary, #A0AEC0)', 
                fontSize: '12px', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '4px'
            }}>
                Log de Partida
            </h3>
            
            <div 
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingRight: '4px'
                }}
            >
                <AnimatePresence>
                    {historialLog.map((mensaje, index) => (
                        <motion.div
                            key={`${mensaje}-${index}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                color: 'var(--color-text-primary, #E2E8F0)',
                                fontSize: '13px',
                                fontFamily: 'monospace',
                                lineHeight: '1.4',
                                opacity: Math.max(0.4, 1 - (index * 0.05)), // Los más antiguos se ven más apagados
                                wordBreak: 'break-word'
                            }}
                        >
                            {mensaje}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogPartida;
