// src/components/ComarcaPath.jsx
import React from 'react';
import { useMapStore } from '../store/useMapStore';

const ComarcaPath = ({ id, d, fill, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // Usamos useMapStore para obtener los datos de la store
    const selectedComarcas = useMapStore((state) => state.selectedComarcas);
    const toggleSelection = useMapStore((state) => state.toggleSelection);

    const isSelected = selectedComarcas.includes(id);
    const isOrigin = selectedComarcas[0] === id; // El primero que pinchamos
    const isDestination = selectedComarcas[1] === id; // El segundo que pinchamos

    // Decidimos de qué color pintarlo
    let currentColor = fill; // Por defecto, el color base
    if (isOrigin) currentColor = '#3b82f6'; // Azul (Atacante)
    if (isDestination) currentColor = '#ef4444'; // Rojo (Defensor)
    return (
        <path
            id={id}
            d={d}
            fill={currentColor}
            // Ponemos borde blanco si le pasas el ratón o si está seleccionada
            stroke={isHovered ? 'white' : 'var(--border-ui, #ccc)'}
            strokeWidth={isHovered || isSelected ? 3 : 1}
            vectorEffect="non-scaling-stroke" // se usa para que al hacer zoom se mantenga la escala
            onMouseEnter={() => setHovered(id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => toggleSelection(id)}
            style={{
                cursor: 'pointer', //para que al pasar por encima salga el pointer
                transition: 'all 0.2s ease-in-out' // para que la transición sea suave
            }}
        />
    );
};

export default ComarcaPath;