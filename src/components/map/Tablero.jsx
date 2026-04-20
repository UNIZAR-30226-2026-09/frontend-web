import React, { useState, useEffect, useRef, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { useGameStore } from '../../store/gameStore';

import ComarcaPath from './ComarcaPath';
import FichaTropas from './FichaTropas';
import BotonVistaRegiones from '../ui/BotonVistaRegiones';
import BotonArbolTecnologico from '../ui/BotonArbolTecnologico';
import PanelArbolTecnologico from '../ui/PanelArbolTecnologico';
import ControlRefuerzo from '../hud/ControlRefuerzo';
import ControlGestion from '../hud/ControlGestion';
import AnimacionRefuerzos from '../hud/AnimacionRefuerzos';
import PanelArsenalEspecial from '../ui/PanelArsenalEspecial';
import { COMARCAS_SVG_DATA, CONTINENTES_SVG_DATA, PUENTES_SVG_DATA } from '../../data/comarcasSvg';
import '../../styles/Tablero.css';

/**
 * Agrupa las comarcas por región, calcula el dominio del jugador local
 * y devuelve las coordenadas del centro geográfico de cada región para
 * pintar la etiqueta SVG directamente sobre el mapa.
 *
 * @param {Array}  comarcasCompletas - Comarcas con campos SVG + datos del mapa (centro, region_id).
 * @param {Object} propietarios      - Mapa comarca → jugador propietario.
 * @param {string} jugadorLocal      - El id del jugador en este cliente.
 * @param {Object} mapaEstatico      - El JSON descargado del servidor.
 * @returns {Array<{ id, centroX, centroY, nombreCorto, textoStats }>}
 */
const calcularInfoRegiones = (comarcasCompletas, propietarios, jugadorLocal, mapaEstatico) => {
  // Agrupamos las comarcas por region_id en un mapa auxiliar
  const mapaRegiones = {};

  comarcasCompletas.forEach((comarca) => {
    const regionId = comarca.region_id;

    if (!regionId) return;

    if (!mapaRegiones[regionId]) {
      mapaRegiones[regionId] = { comarcas: [], totalX: 0, totalY: 0 };
    }

    mapaRegiones[regionId].comarcas.push(comarca.id);
    mapaRegiones[regionId].totalX += comarca.centro[0];
    mapaRegiones[regionId].totalY += comarca.centro[1];
  });

  // Convertimos el mapa en un array con el texto final de la etiqueta
  return Object.entries(mapaRegiones).map(([regionId, datos]) => {
    const { comarcas, totalX, totalY } = datos;
    const total = comarcas.length;
    const poseeJugador = comarcas.filter((id) => propietarios[id] === jugadorLocal).length;
    const porcentaje = total > 0 ? Math.round((poseeJugador / total) * 100) : 0;

    const regionInfo = mapaEstatico?.regions ? mapaEstatico.regions[regionId] : null;
    const nombreCorto = regionInfo ? regionInfo.name : regionId;

    return {
      id: regionId,
      centroX: totalX / total,
      centroY: totalY / total,
      nombreCorto,
      textoStats: `${porcentaje}% (${poseeJugador}/${total})`,
    };
  });
};

/**
 * Lienzo principal del juego que renderiza el mapa SVG, el zoom interactivo y sus marcadores de tropas.
 *
 * @param {Object} props
 * @returns {JSX.Element} El contenedor principal del mapa de juego.
 */
const Tablero = (props) => {
  const [hovered, setHovered] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const svgRef = useRef(null);
  const gRef = useRef(null);

  const inicializarJuego = useGameStore((state) => state.inicializarJuego);
  const setFase = useGameStore((state) => state.setFase);
  const limpiarSeleccion = useGameStore((state) => state.limpiarSeleccion);

  const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
  const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
  const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
  const tropas = useGameStore((state) => state.tropas);
  const propietarios = useGameStore((state) => state.propietarios);
  const coloresJugadores = useGameStore((state) => state.coloresJugadores);

  const faseActual = useGameStore((state) => state.faseActual);
  const turnoActual = useGameStore((state) => state.turnoActual);
  const jugadorLocal = useGameStore((state) => state.jugadorLocal);
  const tropasDisponibles = useGameStore((state) => state.tropasDisponibles);

  const mapaEstatico = useGameStore((state) => state.mapaEstatico);
  const cargarMapaEstatico = useGameStore((state) => state.cargarMapaEstatico);
  const errorMapaEstatico = useGameStore((state) => state.errorMapaEstatico);

  const territorioTrabajando = useGameStore((state) => state.territorioTrabajando);
  const territorioInvestigando = useGameStore((state) => state.territorioInvestigando);
  const estadosBloqueo = useGameStore((state) => state.estadosBloqueo) || {};
  const preparandoAtaqueEspecial = useGameStore((state) => state.preparandoAtaqueEspecial);

  // EFECTO 1: Descargar el mapa estático al montar si no está
  useEffect(() => {
    if (!mapaEstatico && !errorMapaEstatico) {
      cargarMapaEstatico();
    }
  }, [mapaEstatico, errorMapaEstatico, cargarMapaEstatico]);

  // EFECTO 2: Una vez hay mapa estático, inyectarlo al grafo motor del juego
  useEffect(() => {
    if (mapaEstatico && mapaEstatico.comarcas) {
      const rawData = Object.entries(mapaEstatico.comarcas).map(([id, info]) => ({
          id,
          nombre: info.name,
          adyacentes: info.adjacent_to
      }));
      inicializarJuego(rawData);
    }
  }, [mapaEstatico, inicializarJuego]);

  const comarcasCompletas = useMemo(() => {
    if (!mapaEstatico || !mapaEstatico.comarcas) {
      console.warn('❌ mapaEstatico o comarcas no están disponibles', {mapaEstatico});
      return [];
    }
    
    const resultado = COMARCAS_SVG_DATA.map((svgItem) => {
      const serverInfo = mapaEstatico.comarcas[svgItem.id];
      if (serverInfo) {
        return {
          ...svgItem,
          name: serverInfo.name,
          region_id: serverInfo.region_id,
          adjacent_to: serverInfo.adjacent_to
        };
      }
      console.warn(`⚠️ No encontrado en servidor: ${svgItem.id}`);
      return svgItem;
    });
    
    console.log('📍 comarcasCompletas construidas:', resultado.length, 'comarcas con region_id:', resultado.filter(c => c.region_id).length);
    if (resultado.length > 0) {
      console.log('Primer comarca:', resultado[0]);
    }
    
    return resultado;
  }, [mapaEstatico]);

  const modoVista = useGameStore((state) => state.modoVista);

  // EFECTO 3: Registrar el zoom D3 una vez que el SVG existe
  useEffect(() => {
    if (!mapaEstatico) return;
    if (!svgRef.current || !gRef.current) return;

    const svgElement = select(svgRef.current);
    const gElement = select(gRef.current);

    const zoomBehavior = zoom()
      .scaleExtent([1, 5])
      .translateExtent([
        [-400, -250],
        [50, 300]
      ])
      .on('start', () => {
         // Cuando el usuario mueve el mapa o hace zoom, ocultamos los popups
         useGameStore.setState({ 
             comarcaRefuerzo: null, 
             popupCoords: null,
             preparandoAtaque: false,
             destinoSeleccionado: null,
             preparandoFortificacion: false
         });
      })
      .on('zoom', (evento) => {
        gElement.attr('transform', evento.transform);
        setZoomScale(evento.transform.k);
      });

    // Desactivar zoom nativo por doble clic para evitar chocar con interactividad rápida
    svgElement.call(zoomBehavior).on('dblclick.zoom', null);

    // Movemos el mapa 0 píxeles en horizontal (X) y -110 píxeles en vertical (Y, hacia arriba)
    const transformInicial = zoomIdentity.translate(0, -55).scale(1);
    svgElement.call(zoomBehavior.transform, transformInicial);
  }, [mapaEstatico]);

  // --- ZONA DE GUARD CLAUSES ---
  
  // ESTADOS DE CARGA / ERROR QUE BLOQUEAN LA PANTALLA PRINCIPAL
  if (errorMapaEstatico) {
    return (
      <div className="loading" style={{ color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#222' }}>
        <h3>Error Fatal</h3>
        <p>{errorMapaEstatico}</p>
      </div>
    );
  }

  if (!mapaEstatico) {
    return (
      <div className="loading" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#333', color: 'white', fontSize: '1.2rem' }}>
        Descargando cartografía del servidor...
      </div>
    );
  }

  // En modo REGIONES las tropas no se muestran para no confundir la lectura del mapa
  let mostrarTropas = true;
  if (modoVista === 'REGIONES') {
    mostrarTropas = false;
  }

  // En modo REGIONES calculamos y pintamos etiquetas SVG con el dominio por región.
  // En modo COMARCAS esta variable es nula y no se renderiza nada extra.
  let etiquetasRegiones = null;
  if (modoVista === 'REGIONES') {
    const infoRegiones = calcularInfoRegiones(comarcasCompletas, propietarios, jugadorLocal, mapaEstatico);

    etiquetasRegiones = infoRegiones.map((region) => (
      <text
        key={`label-${region.id}`}
        x={region.centroX}
        y={region.centroY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="bold"
        fill="var(--color-text-primary)"
        stroke="var(--color-ui-bg-primary)"
        strokeWidth="2.5"
        paintOrder="stroke fill"
        pointerEvents="none"
        style={{
          fontFamily: 'var(--font-family-base)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {/* Línea 1: nombre de la región */}
        <tspan x={region.centroX} dy="0" fontSize="11px">
          {region.nombreCorto}
        </tspan>
        {/* Línea 2: porcentaje y ratio */}
        <tspan x={region.centroX} dy="1.3em" fontSize="9.5px">
          {region.textoStats}
        </tspan>
      </text>
    ));
  }

  /**
   * Ordena las comarcas para dibujarlas al final del DOM SVG y que queden visualmente superpuestas.
   * Se da prioridad a la comarca bajo el ratón, y luego a las que estén resaltadas por acciones tácticas.
   */
  const sortedComarcas = [...comarcasCompletas].sort((a, b) => {
    const aSelected = origenSeleccionado === a.id || destinoSeleccionado === a.id || comarcasResaltadas.includes(a.id);
    const bSelected = origenSeleccionado === b.id || destinoSeleccionado === b.id || comarcasResaltadas.includes(b.id);

    const aHovered = hovered === a.id;
    const bHovered = hovered === b.id;

    let aScore = 0;
    if (aHovered) {
      aScore = 2;
    } else if (aSelected) {
      aScore = 1;
    }

    let bScore = 0;
    if (bHovered) {
      bScore = 2;
    } else if (bSelected) {
      bScore = 1;
    }

    return aScore - bScore;
  });



  /**
   * Deselecciona cualquier provincia activa si el jugador hace clic al vacío del mapa.
   * @param {Event} e
   */
  const handleFondoClick = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'image' || e.target.tagName === 'rect') {
      limpiarSeleccion();
      useGameStore.setState({ comarcaRefuerzo: null, popupCoords: null });
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'var(--color-map-ocean)'
    }}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-400 -360 450 660"
        preserveAspectRatio="xMidYMid meet"
        {...props}
        onClick={handleFondoClick}
        style={{ width: '100%', height: '100%', cursor: preparandoAtaqueEspecial ? 'crosshair' : 'grab' }}
      >
        <g ref={gRef}>
          <rect
            x="-2000"
            y="-2000"
            width="4000"
            height="4000"
            fill="transparent"
            style={{ pointerEvents: 'auto', cursor: 'default' }}
          />


          {/*imagen de fondo del tablero, centrada para mantener el mapa alineado*/}
          <image
            href="/fondoTablero.png"
            x="-900"
            y="-390"
            width="1440"
            height="810"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* GRUPO 1: CONTINENTES APAGADOS (no dominados) - ATRÁS */}
          {CONTINENTES_SVG_DATA.map((continente) => {
            let strokeColor = 'var(--color-border-gold)';
            let strokeWidth = 1.5 * 2;
            let filterStyle = 'none';
            let isDominado = false;

            if (modoVista === 'REGIONES') {
              return null; // En modo REGIONES no mostrar aquí, se muestran al final
            }

            // Comprobar si un solo jugador domina TODO el continente
            const comarcasDelContinente = comarcasCompletas.filter(c => c.region_id === continente.id);
            
            if (comarcasDelContinente.length > 0 && propietarios) {
              const primerDueño = propietarios[comarcasDelContinente[0].id];
              
              if (primerDueño !== undefined && primerDueño !== null) {
                const todasPertenecenAlMismo = comarcasDelContinente.every(c => propietarios[c.id] === primerDueño);
                
                if (todasPertenecenAlMismo && coloresJugadores && coloresJugadores[primerDueño]) {
                  isDominado = true;
                }
              }
            }

            // SOLO renderizar si NO está dominado
            if (isDominado) return null;

            return (
              <path
                key={`continente-apagado-${continente.id}`}
                d={continente.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#clip-${continente.id})`}
                style={{ transition: 'all 0.5s ease' }}
                pointerEvents="none"
              />
            );
          })}

          {sortedComarcas.map((comarca) => (
            <ComarcaPath
              key={`path-${comarca.id}`}
              id={comarca.id}
              d={comarca.d}
              fill={comarca.fill}
              regionId={comarca.region_id}
              hovered={hovered}
              setHovered={setHovered}
              adyacentes={comarca.adjacent_to}
            />
          ))}

          {/* DEFINIMOS LAS MÁSCARAS DE RECORTE PARA LOGRAR INNER STROKES */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-border-gold-vivo)" />
            </marker>
            {CONTINENTES_SVG_DATA.map((continente) => (
              <clipPath key={`clip-${continente.id}`} id={`clip-${continente.id}`}>
                <path d={continente.d} />
              </clipPath>
            ))}
            {comarcasCompletas.map((comarca) => (
              <clipPath key={`clip-comarca-${comarca.id}`} id={`clip-comarca-${comarca.id}`}>
                <path d={comarca.d} />
              </clipPath>
            ))}
          </defs>



          {/* DIBUJAR CONTORNOS DE LOS CONTINENTES ENCENDIDOS ANTES DE BORDES DE SELECCIÓN (GRUPO 3) */}
          {CONTINENTES_SVG_DATA.map((continente) => {
            let strokeColor = 'var(--color-border-gold)';
            let strokeWidth = 1.5 * 2;
            let filterStyle = 'none';
            let isDominado = false;

            if (modoVista === 'REGIONES') {
              strokeColor = `var(--color-region-${continente.id}-fuerte)`;
              // En modo REGIONES renderizar todos
              return (
                <path
                  key={`continente-regiones-${continente.id}`}
                  d={continente.d}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  clipPath={`url(#clip-${continente.id})`}
                  style={{ filter: filterStyle, transition: 'all 0.5s ease' }}
                  pointerEvents="none"
                />
              );
            }

            // En modo COMARCAS: Comprobar si un solo jugador domina TODO el continente
            const comarcasDelContinente = comarcasCompletas.filter(c => c.region_id === continente.id);
            
            if (comarcasDelContinente.length > 0 && propietarios) {
              const primerDueño = propietarios[comarcasDelContinente[0].id];
              
              // Verificar que el primer dueño existe y todos los territorios pertenecen al mismo jugador
              if (primerDueño !== undefined && primerDueño !== null) {
                const todasPertenecenAlMismo = comarcasDelContinente.every(c => propietarios[c.id] === primerDueño);
                
                if (todasPertenecenAlMismo && coloresJugadores && coloresJugadores[primerDueño]) {
                  strokeColor = coloresJugadores[primerDueño];
                  strokeWidth = 3.5 * 2;
                  filterStyle = 'none';
                  isDominado = true;
                }
              }
            }

            // SOLO renderizar si ESTÁ dominado
            if (!isDominado) return null;

            return (
              <path
                key={`continente-encendido-${continente.id}`}
                d={continente.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                clipPath={`url(#clip-${continente.id})`}
                className={isDominado ? 'continente-dominado' : ''}
                style={{ filter: filterStyle, transition: 'all 0.5s ease' }}
                pointerEvents="none"
              />
            );
          })}

          {/* DIBUJAR SILUETA ACTIVA SOBRE TODO LO DEMÁS */}
          {sortedComarcas.map((comarca) => {
            const isOrigin = origenSeleccionado === comarca.id;
            const isDestination = destinoSeleccionado === comarca.id;
            const isHighlighted = comarcasResaltadas.includes(comarca.id);
            const isSelected = isOrigin || isDestination || isHighlighted;
            const isHovered = hovered === comarca.id;

            const propietarioId = propietarios[comarca.id];
            const esMio = String(propietarioId) === String(jugadorLocal);
            const esMiTurnoLocal = String(turnoActual) === String(jugadorLocal);
            const cantidadTropas = tropas[comarca.id] || 0;

            let isVivoState = false;
            if (modoVista !== 'REGIONES') {
              if (isOrigin || isDestination || isHighlighted) isVivoState = true;
              if (propietarioId && esMiTurnoLocal) {
                if (esMio && faseActual === 'REFUERZO' && (tropasDisponibles ?? 0) > 0) isVivoState = true;
                if (esMio && faseActual === 'ATAQUE_CONVENCIONAL' && cantidadTropas > 1) {
                  const hasEnemyAdjacent = comarca.adjacent_to?.some(adj => propietarios[adj] !== jugadorLocal);
                  if (hasEnemyAdjacent) isVivoState = true;
                }
                if (esMio && faseActual === 'FORTIFICACION' && cantidadTropas > 1) {
                  const hasAlliedAdjacent = comarca.adjacent_to?.some(adj => propietarios[adj] === jugadorLocal);
                  if (hasAlliedAdjacent) isVivoState = true;
                }
                if (esMio && (faseActual === 'GESTION' || faseActual === 'ATAQUE_ESPECIAL')) isVivoState = true;
                // En modo ataque especial, los territorios ENEMIGOS son objetivos válidos
                if (preparandoAtaqueEspecial && !esMio && propietarioId) isVivoState = true;
              }
            }

            if (modoVista === 'REGIONES') {
              if (!isHovered && !isSelected) return null;
            } else {
              if (!isHovered && !isSelected && !isVivoState) return null;
            }

            let strokeColor = 'var(--color-border-gold-vivo)';

            if (modoVista === 'REGIONES') {
              strokeColor = 'var(--color-text-primary)';
            } else if (isOrigin) {
              strokeColor = 'var(--color-text-primary)';
            } else if (!esMiTurnoLocal) {
              // Si no es nuestro turno, obligamos a que el stroke sea el apagado
              // incluso si por algún isVivoState se renderizara
              strokeColor = 'var(--color-border-gold)';
            }

            return (
              <path
                key={`highlight-${comarca.id}`}
                d={comarca.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={3}
                clipPath={`url(#clip-comarca-${comarca.id})`}
                pointerEvents="none"
              />
            );
          })}

          {/* ── PUENTES ─────────────────────────────────────────────── */}
          {PUENTES_SVG_DATA.map((puente) => (
            <g key={puente.id} pointerEvents="none">
              {/* Línea curva discontinua */}
              <path
                d={puente.d}
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeDasharray="6 4"
                strokeLinecap="round"
                opacity={0.85}
              />
              {/* Punto inicio */}
              <circle
                cx={puente.desde[0]}
                cy={puente.desde[1]}
                r={3.5}
                fill="white"
                opacity={0.9}
              />
              {/* Punto fin */}
              <circle
                cx={puente.hasta[0]}
                cy={puente.hasta[1]}
                r={3.5}
                fill="white"
                opacity={0.9}
              />
            </g>
          ))}

          {/* ────── FLECHAS DE ATAQUE ────── */}
          {faseActual === 'ATAQUE_CONVENCIONAL' && origenSeleccionado && (
            <g pointerEvents="none">
              {comarcasResaltadas.map(destinoId => {
                 const dest = COMARCAS_SVG_DATA.find(c => c.id === destinoId);
                 const orig = COMARCAS_SVG_DATA.find(c => c.id === origenSeleccionado);
                 if (orig && dest) {
                   return (
                     <line 
                       key={`arrow-${origenSeleccionado}-${destinoId}`}
                       x1={orig.centro[0]} 
                       y1={orig.centro[1]} 
                       x2={dest.centro[0]} 
                       y2={dest.centro[1]} 
                       stroke="var(--color-border-gold-vivo)" 
                       strokeWidth="4" 
                       strokeDasharray="8 6"
                     >
                       <animate 
                         attributeName="stroke-dashoffset" 
                         values="14;0" 
                         dur="0.8s" 
                         repeatCount="indefinite" 
                       />
                     </line>
                   );
                 }
                 return null;
              })}
            </g>
          )}

          {mostrarTropas && sortedComarcas.map((comarca) => {
            const rawName = comarca.name || comarca.id;
            const cantidadTropas = tropas[comarca.id] || 0;
            const dueño = propietarios ? propietarios[comarca.id] : null;

            let colorActual = 'var(--color-state-disabled)';
            if (dueño && coloresJugadores && coloresJugadores[dueño]) {
              colorActual = coloresJugadores[dueño];
            }

            const isOrigin = origenSeleccionado === comarca.id;
            const isDestination = destinoSeleccionado === comarca.id;
            const isHighlighted = comarcasResaltadas.includes(comarca.id);
            const isSelected = isOrigin || isDestination || isHighlighted;
            const isHovered = hovered === comarca.id;

            const esMio = String(dueño) === String(jugadorLocal);
            const esMiTurnoLocal = String(turnoActual) === String(jugadorLocal);

            let isVivoState = false;
            if (modoVista !== 'REGIONES') {
              if (isSelected) isVivoState = true;
              if (dueño && esMiTurnoLocal) {
                if (esMio && faseActual === 'REFUERZO' && (tropasDisponibles ?? 0) > 0) isVivoState = true;
                if (esMio && faseActual === 'ATAQUE_CONVENCIONAL' && cantidadTropas > 1) {
                  const hasEnemyAdjacent = comarca.adjacent_to?.some(adj => propietarios[adj] !== jugadorLocal);
                  if (hasEnemyAdjacent) isVivoState = true;
                }
                if (esMio && faseActual === 'FORTIFICACION' && cantidadTropas > 1) {
                  const hasAlliedAdjacent = comarca.adjacent_to?.some(adj => propietarios[adj] === jugadorLocal);
                  if (hasAlliedAdjacent) isVivoState = true;
                }
                // En GESTION y ATAQUE_ESPECIAL todos los territorios propios son interactuables
                if (esMio && (faseActual === 'GESTION' || faseActual === 'ATAQUE_ESPECIAL')) isVivoState = true;
                // En modo ataque especial, los territorios ENEMIGOS son objetivos
                if (preparandoAtaqueEspecial && !esMio && dueño) isVivoState = true;

              }
            }

            let strokeFicha = 'var(--color-border-gold)';
            if (modoVista === 'REGIONES') {
              if (isHovered || isSelected) strokeFicha = 'var(--color-text-primary)';
            } else {
              if (isHovered || isSelected || isVivoState) {
                if (isOrigin) {
                  strokeFicha = 'var(--color-text-primary)';
                } else if (!esMiTurnoLocal) {
                  strokeFicha = 'var(--color-border-gold)';
                } else {
                  strokeFicha = 'var(--color-border-gold-vivo)';
                }
              }
            }

            return (
              <FichaTropas
                key={`ficha-${comarca.id}`}
                cx={comarca.centro[0]}
                cy={comarca.centro[1]}
                tropas={cantidadTropas}
                nombreComarca={rawName}
                zoomScale={zoomScale}
                colorFondo={colorActual}
                strokeFondo={strokeFicha}
                isTrabajando={estadosBloqueo[comarca.id] === 'trabajando'}
                isInvestigando={estadosBloqueo[comarca.id] && estadosBloqueo[comarca.id].startsWith('investigando')}
              />
            );
          })}

          {etiquetasRegiones}
        </g>
      </svg>
      
      <BotonVistaRegiones />
      <BotonArbolTecnologico />
      <PanelArbolTecnologico />
      <ControlRefuerzo />
      <ControlGestion />
      <PanelArsenalEspecial />
      <AnimacionRefuerzos />
    </div>
  );
};

export default Tablero;