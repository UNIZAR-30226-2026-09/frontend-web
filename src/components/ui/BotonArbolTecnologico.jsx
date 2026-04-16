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
            className="btn-arbol-tecnologico"
            onClick={toggleArbolTecnologico}
            title="Investigar Tecnologías"
        >
            <span className="btn-arbol-icon">⚛️</span>
        </button>
    );
};

export default BotonArbolTecnologico;
