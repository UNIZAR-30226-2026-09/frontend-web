import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { obtenerColorRegion } from '../../utils/colorUtils';

/**
 * Renderiza el trazado SVG de una comarca y gestiona sus interacciones.
 * @param {Object} props
 * @returns {JSX.Element} El elemento path.
 */
const ComarcaPath = ({ id, d, fill, regionId, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // Extraer estado global para interactuar con la comarca
    const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
    const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
    const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
    const manejarClickComarca = useGameStore((state) => state.manejarClickComarca);
    const modoVista = useGameStore((state) => state.modoVista);
    const faseActual = useGameStore((state) => state.faseActual);
    const propietarios = useGameStore((state) => state.propietarios);
    const coloresJugadores = useGameStore((state) => state.coloresJugadores);

    const isOrigin = origenSeleccionado === id;
    const isDestination = destinoSeleccionado === id;
    const isHighlighted = comarcasResaltadas.includes(id);

    // Determinar si la comarca recibe estilo de foco
    const isSelected = isOrigin || isDestination || isHighlighted;

    /**
     * Evalúa el color de relleno según origen, destino, modo vista o propietario.
     * @param {string} idComarca 
     * @returns {string} El color hexadecimal o variable CSS.
     */
    const obtenerColorComarca = (idComarca) => {
        // 1. Interacciones tácticas del jugador
        if (isOrigin) return 'var(--color-map-origin)';
        if (isDestination) return 'var(--color-map-destination)';
        if (isHighlighted) return 'var(--color-ui-bg-secondary)';

        // 2. Modo de visualización por regiones
        if (modoVista === 'REGIONES' && regionId) {
            return obtenerColorRegion(regionId);
        }

        // 3. Color del jugador propietario
        const propietarioId = propietarios[idComarca];
        if (propietarioId && coloresJugadores[propietarioId]) {
            return coloresJugadores[propietarioId];
        }

        // 4. Color neutral por defecto
        return 'var(--color-map-neutral)';
    };

    const currentColor = obtenerColorComarca(id);

    let strokeColor = 'rgba(0,0,0,0.3)';
    if (isHovered || isSelected) {
        strokeColor = 'var(--color-text-primary)';
    }

    let strokeWidthSize = 1;
    if (isHovered || isSelected) {
        strokeWidthSize = 3;
    }

    let cursorStyle = 'pointer';
    if (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
        cursorStyle = 'default';
    }

    return (
        <path
            id={id}
            d={d}
            fill={currentColor}
            fillOpacity={0.75}
            stroke={strokeColor}
            strokeWidth={strokeWidthSize}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={() => {
                // Ignorar hover en comarcas inatacables
                if (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
                    return;
                }
                setHovered(id);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={(e) => {
                // Evitar propagación al SVG del tablero
                e.stopPropagation();
                manejarClickComarca(id);
            }}
            style={{
                cursor: cursorStyle,
                transition: 'all 0.2s ease-in-out'
            }}
        />
    );
};

export default ComarcaPath;