// src/components/ComarcaPath.jsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { obtenerColorRegion } from '../utils/colorUtils';

const ComarcaPath = ({ id, d, fill, regionId, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // Usamos useGameStore para obtener los datos de la FSM
    const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
    const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
    const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
    const manejarClickComarca = useGameStore((state) => state.manejarClickComarca);
    const modoVista = useGameStore((state) => state.modoVista);
    const faseActual = useGameStore((state) => state.faseActual);

    const isOrigin = origenSeleccionado === id;
    const isDestination = destinoSeleccionado === id;
    const isHighlighted = comarcasResaltadas.includes(id);

    // Necesario para que el tablero la considere seleccionada visualmente
    const isSelected = isOrigin || isDestination || isHighlighted;

    // Decidimos de qué color pintarlo
    let currentColor = modoVista === 'REGIONES' && regionId ? obtenerColorRegion(regionId) : fill;

    if (isOrigin) currentColor = '#3b82f6';
    else if (isDestination) currentColor = '#ef4444';
    else if (isHighlighted) currentColor = '#eab308';

    return (
        <path
            id={id}
            d={d}
            fill={currentColor}
            fillOpacity={0.75}
            stroke={isHovered || isSelected ? 'white' : 'rgba(0,0,0,0.3)'}
            strokeWidth={isHovered || isSelected ? 3 : 1}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => {
                if (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
                    return; // No iluminamos comarcas no atacables
                }
                setHovered(id);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={(e) => {
                e.stopPropagation(); // Evitamos que el SVG de fondo (Tablero) intercepte y limpie esto
                manejarClickComarca(id);
            }}
            style={{
                cursor: (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) ? 'default' : 'pointer',
                transition: 'all 0.2s ease-in-out'
            }}
        />
    );
};

export default ComarcaPath;