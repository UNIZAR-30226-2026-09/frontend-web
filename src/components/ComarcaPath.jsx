// src/components/ComarcaPath.jsx
import React from 'react';
import { useGameStore } from '../store/gameStore';

const ComarcaPath = ({ id, d, fill, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // Usamos useGameStore para obtener los datos de la FSM
    const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
    const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
    const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
    const manejarClickComarca = useGameStore((state) => state.manejarClickComarca);

    const isOrigin = origenSeleccionado === id;
    const isDestination = destinoSeleccionado === id;
    const isHighlighted = comarcasResaltadas.includes(id);

    // Necesario para que el tablero la considere seleccionada visualmente
    const isSelected = isOrigin || isDestination || isHighlighted;

    // Decidimos de qué color pintarlo
    let currentColor = fill; // Por defecto, el color base
    if (isOrigin) currentColor = '#3b82f6'; // Azul (Atacante)
    else if (isDestination) currentColor = '#ef4444'; // Rojo (Defensor)
    else if (isHighlighted) currentColor = '#eab308'; // Amarillo (Objetivos Válidos / BFS)

    return (
        <path
            id={id}
            d={d}
            fill={currentColor}
            fillOpacity={0.55} // 55% de opacidad para que la textura de la madera se vea a través del color 
            // Ponemos borde blanco si le pasas el ratón o si está seleccionada
            stroke={isHovered || isSelected ? 'white' : 'rgba(0,0,0,0.3)'}
            strokeWidth={isHovered || isSelected ? 3 : 1}
            vectorEffect="non-scaling-stroke" // se usa para que al hacer zoom se mantenga la escala
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => manejarClickComarca(id)}
            style={{
                cursor: 'pointer', //para que al pasar por encima salga el pointer
                transition: 'all 0.2s ease-in-out' // para que la transición sea suave
            }}
        />
    );
};

export default ComarcaPath;