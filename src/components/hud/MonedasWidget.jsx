import React from 'react';
import { useGameStore } from '../../store/gameStore';

const MonedasWidget = () => {
    const monedas = useGameStore((state) => state.monedas);

    if (monedas === null || monedas === undefined) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '16px',
                left: '16px',
                background: 'var(--color-ui-panel-overlay, rgba(12, 10, 5, 0.92))',
                border: '2px solid var(--color-border-gold, #8C7322)',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(5px)',
                zIndex: 900,
            }}
        >
            <span style={{ fontSize: '1.5rem', filter: 'grayscale(0)' }}>🪙</span>
            <span style={{
                color: '#F6E05E',
                fontFamily: 'var(--font-family-title, serif)',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                textShadow: '0 0 8px rgba(246, 224, 94, 0.5)'
            }}>
                {monedas}
            </span>
        </div>
    );
};

export default MonedasWidget;
