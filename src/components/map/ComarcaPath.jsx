import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { obtenerColorRegion, obtenerColorFuerteRegion } from '../../utils/colorUtils';



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
    const jugadorLocal         = useGameStore((state) => state.jugadorLocal);
    const turnoActual          = useGameStore((state) => state.turnoActual);
    const cantidadTropas       = useGameStore((state) => state.tropas[id] || 0);
    const tropasDisponibles    = useGameStore((state) => state.tropasDisponibles);

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
        const propietarioId = propietarios[id];
        const colorBase = propietarioId && coloresJugadores[propietarioId] ? coloresJugadores[propietarioId] : null;
        const colorApagado = colorBase ? colorBase.replace(')', '-apagado)') : 'var(--color-ui-bg-secondary)';

        // 1. Interacciones tácticas tienen prioridad absoluta
        if (isDestination) {
            return { color: 'var(--color-map-select-target)', opacidad: 1, isVivoState: true };
        }

        if (isOrigin || isHighlighted) {
            return { color: colorBase, opacidad: 1, isVivoState: true };
        }

        // 2. Modo de visualización por regiones
        if (modoVista === 'REGIONES' && regionId) {
            const esDelJugador = String(propietarios[id]) === String(jugadorLocal);
            const color        = obtenerColorRegion(regionId, esDelJugador);
            // Contraste extremo: propio opaco, ajeno muy translúcido
            const opacidad     = 1;
            return { color, opacidad, isVivoState: false };
        }

        // 3. Color del jugador propietario
        if (colorBase) {
            const esSuTurno = String(propietarioId) === String(turnoActual);

            if (esSuTurno && faseActual === 'REFUERZO' && tropasDisponibles > 0) {
                return { color: colorBase, opacidad: 1, isVivoState: true };
            }

            if (esSuTurno && faseActual === 'ATAQUE_CONVENCIONAL' && cantidadTropas > 1) {
                return { color: colorBase, opacidad: 1, isVivoState: true };
            }

            return { color: colorApagado, opacidad: 1, isVivoState: false };
        }

        // 4. Color neutral por defecto
        return { color: 'var(--color-map-land-neutral)', opacidad: 1, isVivoState: false };
    };

    const { color: currentColor, opacidad: fillOpacity, isVivoState } = obtenerEstiloComarca();

    let strokeColor = 'var(--color-border-gold)'; // Base golden border
    let strokeWidthSize = 1.5;

    if (modoVista === 'REGIONES') {
        if (regionId) {
            strokeColor = obtenerColorFuerteRegion(regionId);
        } else {
            strokeColor = currentColor;
        }
        
        // Mantener hover selectivo en blanco original
        if (isHovered || isSelected) {
            strokeColor = 'var(--color-text-primary)';
            strokeWidthSize = 3;
        }
    } else {
        if (isOrigin) {
            strokeColor = 'var(--color-text-primary)';
        } else if (isHovered || isSelected || isVivoState) {
            strokeColor = 'var(--color-border-gold-vivo)';
        }
        
        if (isOrigin || isHovered || isSelected || isVivoState) {
            strokeWidthSize = 3;
        }
    }

    let cursorStyle = 'pointer';
    if (faseActual === 'ATAQUE_CONVENCIONAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
        cursorStyle = 'default';
    }

    /**
     * Gestiona la entrada del ratón sobre la comarca.
     * En modo REGIONES registra la región para el panel de estadísticas.
     */
    const handleMouseEnter = () => {
        // Ignorar hover en comarcas inatacables durante el ataque
        if (faseActual === 'ATAQUE_CONVENCIONAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
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
            clipPath={`url(#clip-comarca-${id})`}
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