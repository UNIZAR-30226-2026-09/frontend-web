// src/components/FlechaAtaque.jsx
import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';

const FlechaAtaque = () => {
    const selectedComarcas = useMapStore((state) => state.selectedComarcas);
    const [coords, setCoords] = useState(null);

    useEffect(() => {
        // Solo calculamos la flecha si hay exactamente 2 comarcas seleccionadas
        if (selectedComarcas.length === 2) {
            // Buscamos los elementos SVG en el DOM usando sus IDs
            const originNode = document.getElementById(selectedComarcas[0]);
            const destNode = document.getElementById(selectedComarcas[1]);

            if (originNode && destNode) {
                // getBBox() nos da la caja (x, y, ancho, alto) de la comarca
                const box1 = originNode.getBBox();
                const box2 = destNode.getBBox();

                // Calculamos el centro de cada caja
                const startX = box1.x + box1.width / 2;
                const startY = box1.y + box1.height / 2;
                const endX = box2.x + box2.width / 2;
                const endY = box2.y + box2.height / 2;

                setCoords({ startX, startY, endX, endY });
            }
        } else {
            // Si se deselecciona algo, borramos las coordenadas
            setCoords(null);
        }
    }, [selectedComarcas]);

    // Si no hay coordenadas, devolvemos null (no se pinta nada)
    if (!coords) return null;

    return (
        <g>
            {/* 1. Definimos el dibujo de la punta de la flecha */}
            <defs>
                <marker id="puntaFlecha" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
            </defs>

            {/* 2. Dibujamos la línea uniendo los centros */}
            <line
                x1={coords.startX}
                y1={coords.startY}
                x2={coords.endX}
                y2={coords.endY}
                stroke="#ef4444" // Color rojo
                strokeWidth="4"
                strokeDasharray="8, 4" // Línea punteada
                markerEnd="url(#puntaFlecha)"
                style={{ animation: 'moverFlecha 1s linear infinite' }}
            />

            {/* 3. Animación CSS inyectada para el efecto de movimiento */}
            <style>
                {`
          @keyframes moverFlecha {
            to { stroke-dashoffset: -12; }
          }
        `}
            </style>
        </g>
    );
};

export default FlechaAtaque;