import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { obtenerColorRegion, obtenerColorFuerteRegion } from '../../utils/colorUtils';



/**
 * Renderiza el trazado SVG de una comarca y gestiona sus interacciones.
 * @param {Object} props
 * @returns {JSX.Element} El elemento path.
 */
const ComarcaPath = ({ id, d, fill, regionId, hovered, setHovered, adyacentes }) => {
    const isHovered = hovered === id;

    // Estado global necesario para interactuar con la comarca
    const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
    const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
    const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
    const manejarClickComarca = useGameStore((state) => state.manejarClickComarca);
    const setRegionHover = useGameStore((state) => state.setRegionHover);
    const modoVista = useGameStore((state) => state.modoVista);
    const faseActual = useGameStore((state) => state.faseActual);
    const propietarios = useGameStore((state) => state.propietarios);
    const coloresJugadores = useGameStore((state) => state.coloresJugadores);
    const jugadorLocal = useGameStore((state) => state.jugadorLocal);
    const turnoActual = useGameStore((state) => state.turnoActual);
    const cantidadTropas = useGameStore((state) => state.tropas[id] || 0);
    const tropasDisponibles = useGameStore((state) => state.tropasDisponibles);
    const estadosBloqueo = useGameStore((state) => state.estadosBloqueo) || {};
    const movimientoRealizadoEnTurno = useGameStore((state) => state.movimientoRealizadoEnTurno);
    const armaEspecialSeleccionada = useGameStore((state) => state.armaEspecialSeleccionada);
    const catalogoTecnologias = useGameStore((state) => state.catalogoTecnologias);

    let rangoEspecial = null;
    if (armaEspecialSeleccionada && catalogoTecnologias) {
        const idLower = armaEspecialSeleccionada.toLowerCase();
        if (catalogoTecnologias[armaEspecialSeleccionada]) {
            rangoEspecial = catalogoTecnologias[armaEspecialSeleccionada].rango;
        } else if (catalogoTecnologias[idLower]) {
            rangoEspecial = catalogoTecnologias[idLower].rango;
        } else if (catalogoTecnologias.ramas) {
            for (const habs of Object.values(catalogoTecnologias.ramas)) {
                const enc = habs.find(h => h.id?.toLowerCase() === idLower);
                if (enc) {
                    rangoEspecial = enc.rango;
                    break;
                }
            }
        }
    }

    // Helper para comparar jugadores ignorando mayúsculas
    const esMismoJugador = (j1, j2) => {
        if (!j1 || !j2) return false;
        return String(j1).toLowerCase() === String(j2).toLowerCase();
    };

    const comarcaOcupada = !!estadosBloqueo[id];
    // Solo bloqueamos visualmente los territorios del jugador local (los ajenos no podemos interactuarlos de todas formas)
    const propietarioEsLocal = (() => {
        // Necesitamos jugadorLocal aquí — lo leemos del cierre de los hooks
        const propietarioId = propietarios[id];
        if (!propietarioId || !jugadorLocal) return false;
        return String(propietarioId).toLowerCase() === String(jugadorLocal).toLowerCase();
    })();

    // VISUAL: Un territorio es "vacío" (se pinta negro) solo si NO tiene propietario registrado.
    // Un territorio recién conquistado (propietario = nuevo dueño, 0 tropas temporalmente)
    // NO es vacío visual — debe mostrar el color del nuevo dueño.
    const propietarioRaw = propietarios[id];
    const tieneDueno = !!propietarioRaw && String(propietarioRaw).trim().length > 0;
    const esTerritoriuVacio = cantidadTropas === 0 && !tieneDueno;

    // INTERACCIÓN: Un territorio es reclamable si tiene 0 tropas y no es nuestro.
    // (Incluye casos donde el backend puede reportar al viejo dueño, pero tropas = 0)
    const esVacioReclamable = (() => {
        if (!jugadorLocal) return false;
        const noEsMio = !esMismoJugador(propietarioRaw, jugadorLocal);
        return cantidadTropas === 0 && noEsMio &&
            (adyacentes?.some(adj => esMismoJugador(propietarios[adj], jugadorLocal)) ?? false);
    })();

    const isOrigin = origenSeleccionado === id;
    const isDestination = destinoSeleccionado === id;
    const isHighlighted = comarcasResaltadas.includes(id);
    const isSelected = isOrigin || isDestination || isHighlighted;

    const esMiTurnoLocalGlobal = esMismoJugador(turnoActual, jugadorLocal);

    let territorioBloqueadoVisual = false;
    if (!esMiTurnoLocalGlobal) {
        territorioBloqueadoVisual = true;
    } else if (faseActual === 'REFUERZO') {
        // Permitir: propios, o vacíos reclamables (0 tropas y no es mo, adyacente a uno propio)
        const puedeReclamarVacio = esVacioReclamable && (tropasDisponibles ?? 0) > 0;
        territorioBloqueadoVisual = (!propietarioEsLocal && !puedeReclamarVacio) || (tropasDisponibles ?? 0) === 0;
    } else if (faseActual === 'GESTION') {
        const hayTrabajo = Object.entries(estadosBloqueo).some(([idx, e]) => e === 'trabajando' && propietarios[idx] === jugadorLocal);
        const hayInvestigacion = Object.entries(estadosBloqueo).some(([idx, e]) => e && e.startsWith('investigando') && propietarios[idx] === jugadorLocal);
        const gestionCompletada = hayTrabajo && hayInvestigacion;
        territorioBloqueadoVisual = !propietarioEsLocal || comarcaOcupada || gestionCompletada;
    } else if (faseActual === 'ATAQUE_CONVENCIONAL') {
        if (!origenSeleccionado) {
            if (!propietarioEsLocal) {
                territorioBloqueadoVisual = true;
            } else if (comarcaOcupada) {
                territorioBloqueadoVisual = true;
            } else if (cantidadTropas <= 1) {
                territorioBloqueadoVisual = true;
            } else {
                const hasEnemyAdjacent = adyacentes && adyacentes.some(adj => {
                    const propAdj = propietarios[adj];
                    return propAdj && String(propAdj).toLowerCase() !== String(jugadorLocal).toLowerCase();
                });
                if (!hasEnemyAdjacent) {
                    territorioBloqueadoVisual = true;
                }
            }
        } else {
            // Origen seleccionado: apagar TODO lo que no sea el origen, el destino, o un objetivo válido
            if (!isOrigin && !isDestination && !isHighlighted) {
                territorioBloqueadoVisual = true;
            }
        }
    } else if (faseActual === 'FORTIFICACION') {
        if (movimientoRealizadoEnTurno) {
            territorioBloqueadoVisual = true;
        } else if (!origenSeleccionado) {
            if (!propietarioEsLocal) {
                territorioBloqueadoVisual = true;
            } else if (comarcaOcupada) {
                territorioBloqueadoVisual = true;
            } else if (cantidadTropas <= 1) {
                territorioBloqueadoVisual = true;
            } else {
                const hasAlliedAdjacent = adyacentes && adyacentes.some(adj => {
                    const propAdj = propietarios[adj];
                    return propAdj && String(propAdj).toLowerCase() === String(jugadorLocal).toLowerCase();
                });
                if (!hasAlliedAdjacent) {
                    territorioBloqueadoVisual = true;
                }
            }
        } else {
            // Origen seleccionado: destinos válidos son resaltados (incluye vacíos adyacentes)
            if (!isOrigin && !isDestination && !isHighlighted) {
                territorioBloqueadoVisual = true;
            }
        }
    } else if (faseActual === 'ATAQUE_ESPECIAL') {
        if (!armaEspecialSeleccionada) {
            territorioBloqueadoVisual = true;
        } else {
            if (origenSeleccionado || comarcasResaltadas.length > 0) {
                if (!isOrigin && !isDestination && !isHighlighted) {
                    territorioBloqueadoVisual = true;
                }
            } else {
                if (rangoEspecial !== null && rangoEspecial !== undefined) {
                    if (!propietarioEsLocal) {
                        territorioBloqueadoVisual = true;
                    } else if (comarcaOcupada) {
                        territorioBloqueadoVisual = true;
                    }
                } else {
                    if (comarcaOcupada && propietarioEsLocal) {
                        territorioBloqueadoVisual = true;
                    }
                }
            }
        }
    } else {
        territorioBloqueadoVisual = propietarioEsLocal && comarcaOcupada;
    }

    /**
     * Evalúa el color de relleno y la opacidad según el contexto actual.
     * Usa if/else tempranos para evitar ternarios anidados.
     * @returns {{ color: string, opacidad: number }}
     */
    const obtenerEstiloComarca = () => {
        const propietarioId = propietarios[id];
        const colorBase = propietarioId && coloresJugadores[propietarioId] ? coloresJugadores[propietarioId] : null;
        const colorApagado = colorBase ? colorBase.replace(')', '-apagado)') : 'var(--color-ui-bg-secondary)';

        // 0. Modo de visualización por regiones tiene prioridad absoluta sobre bloqueos visuales
        if (modoVista === 'REGIONES' && regionId) {
            const esDelJugador = esMismoJugador(propietarios[id], jugadorLocal);
            const color = obtenerColorRegion(regionId, esDelJugador);
            // Contraste extremo: propio opaco, ajeno muy traslúdcido
            const opacidad = 1;
            return { color, opacidad, isVivoState: false };
        }

        // 0b. Territorios vacíos (0 tropas, no propios): dos tonos de negro según interactividad.
        //     - Reclamables (adyacentes a los nuestros en la fase correcta): negro profundo #111 + borde dorado
        //     - No reclamables: gris muy oscuro #2e2e2e para distinguirlos visualmente
        //     EXCEPCIÓN: si están siendo seleccionados/resaltados, pasan al flujo táctico normal.
        if (esTerritoriuVacio && !isDestination && !isHighlighted && !isOrigin) {
            const esMiTurnoLocal = esMismoJugador(turnoActual, jugadorLocal);
            const puedeReclamarAhora = esMiTurnoLocal && esVacioReclamable &&
                (faseActual === 'REFUERZO' || faseActual === 'FORTIFICACION');
            // Negro profundo si es reclamable, gris oscuro si no lo es
            const colorVacio = puedeReclamarAhora ? '#111111' : '#2e2e2e';
            return { color: colorVacio, opacidad: 1, isVivoState: puedeReclamarAhora };
        }

        // 1. Si el territorio está bloqueado visualmente por una tarea activa
        if (territorioBloqueadoVisual) {
            return { color: colorApagado, opacidad: 1, isVivoState: false };
        }

        // 2. Interacciones tácticas tienen prioridad absoluta
        if (isDestination) {
            return { color: colorBase || 'var(--color-map-land-neutral)', opacidad: 1, isVivoState: true };
        }

        if (isOrigin || isHighlighted) {
            return { color: colorBase || 'var(--color-map-land-neutral)', opacidad: 1, isVivoState: true };
        }

        if (faseActual === 'ATAQUE_ESPECIAL' && !territorioBloqueadoVisual) {
            return { color: colorBase || 'var(--color-map-land-neutral)', opacidad: 1, isVivoState: true };
        }

        // 3. Color del jugador propietario
        if (colorBase) {
            const esMio = esMismoJugador(propietarioId, jugadorLocal);
            const esMiTurnoLocal = esMismoJugador(turnoActual, jugadorLocal);

            if (esMio && esMiTurnoLocal && faseActual === 'REFUERZO' && tropasDisponibles > 0) {
                return { color: colorBase, opacidad: 1, isVivoState: true };
            }

            if (esMio && esMiTurnoLocal && faseActual === 'ATAQUE_CONVENCIONAL' && cantidadTropas > 1) {
                if (adyacentes && adyacentes.some(adj => !esMismoJugador(propietarios[adj], jugadorLocal))) {
                    return { color: colorBase, opacidad: 1, isVivoState: true };
                }
            }

            if (esMio && esMiTurnoLocal && faseActual === 'FORTIFICACION' && cantidadTropas > 1) {
                if (adyacentes && adyacentes.some(adj => esMismoJugador(propietarios[adj], jugadorLocal))) {
                    return { color: colorBase, opacidad: 1, isVivoState: true };
                }
            }

            // En GESTION todos los territorios propios están activos e interactuables
            if (esMio && esMiTurnoLocal && faseActual === 'GESTION') {
                return { color: colorBase, opacidad: 1, isVivoState: true };
            }

            return { color: colorApagado, opacidad: 1, isVivoState: false };
        }

        // 4. Territorio vacío ya manejado arriba (isVivoState condicional)
        //    Este punto no se alcanza; dejamos el fallback neutral.

        // 5. Color neutral por defecto
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
        } else if ((isHovered || isSelected) && !territorioBloqueadoVisual) {
            strokeColor = 'var(--color-text-primary)';
        } else if (isVivoState && !territorioBloqueadoVisual) {
            strokeColor = 'var(--color-border-gold-vivo)';
        } else if (territorioBloqueadoVisual && !esMiTurnoLocalGlobal) {
            strokeColor = 'var(--color-border-gold)';
        }
        
        if ((isOrigin || isHovered || isSelected || isVivoState) && !territorioBloqueadoVisual) {
            strokeWidthSize = 3;
        }
    }

    let cursorStyle = 'pointer';
    let pointerEvents = 'auto';
    let filterStyle = 'none';

    if (territorioBloqueadoVisual) {
        cursorStyle = 'not-allowed';
        // Quitamos el pointerEvents='none' para permitir el clic y mostrar la alerta
    } else if (faseActual === 'ATAQUE_CONVENCIONAL' && origenSeleccionado && !isHighlighted && !isOrigin && !isDestination) {
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
            style={{
                cursor: cursorStyle,
                pointerEvents: pointerEvents,
                filter: filterStyle,
                transition: 'fill 0.3s, stroke 0.3s, filter 0.3s'
            }}
            clipPath={`url(#clip-comarca-${id})`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                // Evitar propagación al SVG del tablero
                e.stopPropagation();
                const rect = e.target.getBoundingClientRect();
                const orientacionArriba = rect.bottom > window.innerHeight - 200;
                manejarClickComarca(id, {
                    x: rect.left + rect.width / 2,
                    y: orientacionArriba ? rect.top - 10 : rect.bottom + 10,
                    orientacionArriba
                });
            }}
        />
    );
};

export default ComarcaPath;