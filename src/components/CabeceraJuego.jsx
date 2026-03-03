import React from 'react';

const CabeceraJuego = () => {
    return (
        <header style={{
            height: '65px',
            backgroundColor: '#2a2a2a',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            color: 'white'
        }}>
            <div> Aquí irán los controles del juego (dinero, tropas, fase actual, abandonar, etc)</div>
        </header>
    );
};

export default CabeceraJuego;
