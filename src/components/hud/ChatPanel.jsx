import React, { useRef, useEffect } from 'react';
import { socketService } from '../../services/socketService';
import { BASE_URL } from '../../services/api';

const MENSAJES_PERMITIDOS = [
    "¡Buena jugada!",
    "¡Maldición!",
    "¿Hacemos una alianza?",
    "¡A por él!",
    "¡Me rindo!",
    "Necesito refuerzos..."
];

const REACCIONES_PERMITIDAS = [
    "1.png",
    "2.png",
    "3.png",
    "4.png",
    "5.png",
    "6.png"
];

const ChatPanel = ({ onClose }) => {
    const panelRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                // Si el clic viene del botón que lo abre, no cerrar aquí para no interferir con el toggle
                if (event.target instanceof Element && !event.target.closest('.btn-menu')) {
                    if (onClose) onClose();
                }
            }
        };

        // Usamos la fase de captura (true) porque elementos del juego como el canvas 
        // pueden tener stopPropagation()
        document.addEventListener('pointerdown', handleClickOutside, true);
        return () => document.removeEventListener('pointerdown', handleClickOutside, true);
    }, [onClose]);

    const handleReaccion = (reaccion) => {
        socketService.enviarChat('reaccion', reaccion);
        if (onClose) onClose();
    };

    const handleMensaje = (mensaje) => {
        socketService.enviarChat('mensaje', mensaje);
        if (onClose) onClose();
    };

    return (
        <div ref={panelRef} style={{
            position: 'absolute',
            top: '60px',
            right: '48px',
            width: '280px',
            backgroundColor: 'var(--color-ui-panel-overlay, rgba(12, 10, 5, 0.95))',
            border: '2px solid var(--color-border-gold, #8C7322)',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            backdropFilter: 'blur(8px)',
            color: 'var(--color-text-primary, #f0f0f5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
        }}>
            {/* Reacciones (Grid 3x2) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
            }}>
                {REACCIONES_PERMITIDAS.map((img) => (
                    <button
                        key={img}
                        onClick={() => handleReaccion(img)}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            transition: 'background 0.2s, transform 0.1s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <img 
                            src={`${BASE_URL}/static/reacciones/${img}`} 
                            alt={`Reaccion ${img}`} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }}
                        />
                    </button>
                ))}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

            {/* Mensajes de texto */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {MENSAJES_PERMITIDOS.map((msg) => (
                    <button
                        key={msg}
                        onClick={() => handleMensaje(msg)}
                        style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: 'inherit',
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontSize: '14px',
                            fontFamily: 'var(--font-family-base, sans-serif)',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
                    >
                        {msg}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ChatPanel;
