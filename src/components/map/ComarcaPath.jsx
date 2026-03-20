import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { obtenerColorRegion } from '../../utils/colorUtils';

// Jugador local actual — sustituir por el valor real del store cuando se conecte el backend
const JUGADOR_LOCAL = 'jugador1';

/**
 * Renderiza el trazado SVG de una comarca y gestiona sus interacciones.
 * @param {Object} props
 * @returns {JSX.Element} El elemento path.
 */
const ComarcaPath = ({ id, d, fill, regionId, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // Estado global necesario para interactuar con la comarca
    const origenSeleccionado   = useGameStore((state) => state.origenSeleccionado);
    const destinoSeleccionado  = useGameStore((state) => state.destinoSeleccionado);
    const comarcasResaltadas   = useGameStore((state) => state.comarcasResaltadas) || [];
    const manejarClickComarca  = useGameStore((state) => state.manejarClickComarca);
    const setRegionHover       = useGameStore((state) => state.setRegionHover);
    const modoVista            = useGameStore((state) => state.modoVista);
    const faseActual           = useGameStore((state) => state.faseActual);
    const propietarios         = useGameStore((state) => state.propietarios);
    const coloresJugadores     = useGameStore((state) => state.coloresJugadores);

    const isOrigin      = origenSeleccionado === id;
    const isDestination = destinoSeleccionado === id;
    const isHighlighted = comarcasResaltadas.includes(id);
    const isSelected    = isOrigin || isDestination || isHighlighted;

    /**
     * Evalúa el color de relleno y la opacidad según el contexto actual.
     * Usa if/else tempranos para evitar ternarios anidados.
     * @returns {{ color: string, opacidad: number }}
     */
    const obtenerEstiloComarca = () => {
        // 1. Interacciones tácticas tienen prioridad absoluta
        if (isOrigin) {
            return { color: 'var(--color-map-select-origin)', opacidad: 1 };
        }

        if (isDestination) {
            return { color: 'var(--color-map-select-target)', opacidad: 1 };
        }

        if (isHighlighted) {
            return { color: 'var(--color-ui-bg-secondary)', opacidad: 1 };
        }

        // 2. Modo de visualización por regiones
        if (modoVista === 'REGIONES' && regionId) {
            const esDelJugador = propietarios[id] === JUGADOR_LOCAL;
            const color        = obtenerColorRegion(regionId, esDelJugador);
            // Contraste extremo: propio opaco, ajeno muy translúcido
            const opacidad     = esDelJugador ? 1 : 0.25;
            return { color, opacidad };
        }

        // 3. Color del jugador propietario
        const propietarioId = propietarios[id];
        if (propietarioId && coloresJugadores[propietarioId]) {
            return { color: coloresJugadores[propietarioId], opacidad: 0.75 };
        }

        // 4. Color neutral por defecto
        return { color: 'var(--color-map-land-neutral)', opacidad: 0.75 };
    };

    const { color: currentColor, opacidad: fillOpacity } = obtenerEstiloComarca();

    let strokeColor = 'rgba(0,0,0,0.3)';
    if (isHovered || isSelected) {
        strokeColor = 'var(--color-text-primary)';
    }
    if (modoVista === 'REGIONES' && !isHovered && !isSelected) {
        // Fusión visual: el borde imita el color de relleno para borrar la división interna.
        // Las comarcas del jugador reciben un leve acento dorado para destacar su dominio.
        const esDelJugador = propietarios[id] === JUGADOR_LOCAL;
        if (esDelJugador) {
            strokeColor = 'var(--color-border-gold)';
        } else {
            strokeColor = currentColor;
        }
    }

    let strokeWidthSize = 1;
    if (isHovered || isSelected) {
        strokeWidthSize = 3;
    }
    if (modoVista === 'REGIONES' && !isHovered && !isSelected) {
        strokeWidthSize = 0.5;
    }

    let cursorStyle = 'pointer';
    if (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
        cursorStyle = 'default';
    }

    /**
     * Gestiona la entrada del ratón sobre la comarca.
     * En modo REGIONES registra la región para el panel de estadísticas.
     */
    const handleMouseEnter = () => {
        // Ignorar hover en comarcas inatacables durante el ataque
        if (faseActual === 'ATAQUE_NORMAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
            return;
        }

        setHovered(id);

        if (modoVista === 'REGIONES' && regionId) {
            setRegionHover(regionId);
        }
    };

    /**
     * Gestiona la salida del ratón de la comarca.
     */
    const handleMouseLeave = () => {
        setHovered(null);

        if (modoVista === 'REGIONES') {
            setRegionHover(null);
        }
    };

    return (
        <path
            id={id}
            d={d}
            fill={currentColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidthSize}
            vectorEffect="non-scaling-stroke"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                // Evitar propagación al SVG del tablero
                e.stopPropagation();
                manejarClickComarca(id);
            }}
            style={{
                cursor: cursorStyle,
                transition: 'fill 0.25s ease-in-out, fill-opacity 0.25s ease-in-out'
            }}
        />
    );
};

export default ComarcaPath;