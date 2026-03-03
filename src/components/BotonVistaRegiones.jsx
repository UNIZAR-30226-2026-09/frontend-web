import React from 'react';
import { useGameStore } from '../store/gameStore';
import './BotonVistaRegiones.css';

const BotonVistaRegiones = () => {
    const modoVista = useGameStore((state) => state.modoVista);
    const toggleModoVista = useGameStore((state) => state.toggleModoVista);

    return (
        <button
            className="btn-toggle-mapa"
            onClick={toggleModoVista}
            title={modoVista === 'COMARCAS' ? 'Ver Regiones' : 'Ver Comarcas'}
        >
            <img
                src="/mapabutton.png"
                alt="Toggle Mapa"
                className="btn-toggle-icon"
            />
        </button>
    );
};

export default BotonVistaRegiones;
