import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/BotonArbolTecnologico.css';

/**
 * Botón flotante para desplegar el árbol de tecnologías.
 * @returns {JSX.Element} El botón interactivo.
 */
const BotonArbolTecnologico = () => {
    const toggleArbolTecnologico = useGameStore((state) => state.toggleArbolTecnologico);

    return (
        <button
            className="btn-arbol-tecnologico transition-transform duration-200 hover:scale-110 active:scale-95 focus:outline-none"
            onClick={toggleArbolTecnologico}
            title="Investigar Tecnologías"
        >
            <img 
                src="/arbol.png" 
                alt="Ver Árbol" 
                className="btn-arbol-icon"
            />
        </button>
    );
};

export default BotonArbolTecnologico;
