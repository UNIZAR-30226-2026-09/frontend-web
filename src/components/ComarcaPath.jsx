// src/components/ComarcaPath.jsx
import React from 'react';
import { useGameStore } from '../store/gameStore';
import { obtenerColorRegion } from '../utils/colorUtils';

const ComarcaPath = ({ id, d, fill, regionId, hovered, setHovered }) => {
    const isHovered = hovered === id;

    // sacamos todo lo del zustand, que al final la comarca solo dibuja lo que le manden
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

    // nos hace falta saber si está tocada para ponerle el borde blanquito
    const isSelected = isOrigin || isDestination || isHighlighted;

    /**
     * @function obtenerColorComarca
     * @description evalúa las props booleanas del elemento y escupe el color en HEX 
     * crudo para el inline style de fill. evalúa el orden de precedencia: primero
     * va lo bélico (selecciones y destinos), después modos de visualización (por comarcas), 
     * y por último a color del dueño (por defecto).
     * @param {string} idComarca id para pescar los props asociados de zustand
     * @returns {string} color hex como "#ffffff"
     */
    const obtenerColorComarca = (idComarca) => {
        // lo 1º siempre es pintar la movida bélica si está pasando por encima del color que sea
        if (isOrigin) return '#fbfbfbff';
        if (isDestination) return '#ff00d0ff';
        if (isHighlighted) return '#000000ff';

        // si el usuario le dio al boton de ver provincias, sudamos de todo y tiramos de ese color
        if (modoVista === 'REGIONES' && regionId) {
            return obtenerColorRegion(regionId);
        }

        // si estamos en normal, pues buscamos el colorcito en el diccionario
        const propietarioId = propietarios[idComarca];
        if (propietarioId && coloresJugadores[propietarioId]) {
            return coloresJugadores[propietarioId];
        }

        // por si acaso hay alguna suelta sin dueño, gris feo
        return '#E0E0E0';
    };

    // sacamos a ver de qué color toca dibujar esta path este frame
    const currentColor = obtenerColorComarca(id);

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
                    return; // que no le haga el hover blanco si es una comarca que no se puede atacar ni de broma
                }
                setHovered(id);
            }}
            onMouseLeave={() => setHovered(null)}
            onClick={(e) => {
                e.stopPropagation(); // esto salva vidas, para que el click no caiga al fondo negro del tablero y lo rompa todo
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