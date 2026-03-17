import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/BotonVistaRegiones.css';

/**
 * Botón flotante para alternar entre el modo de vista por comarcas y regiones grandes.
 * @returns {JSX.Element} El botón interactivo.
 */
const BotonVistaRegiones = () => {
    const modoVista = useGameStore((state) => state.modoVista);
    const toggleModoVista = useGameStore((state) => state.toggleModoVista);

    let tituloBoton = 'Ver Comarcas';
    if (modoVista === 'COMARCAS') {
        tituloBoton = 'Ver Regiones';
    }

    return (
        <button
            className="btn-toggle-mapa"
            onClick={toggleModoVista}
            title={tituloBoton}
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
