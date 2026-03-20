import React, { useState, useEffect, useRef, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { useGameStore } from '../../store/gameStore';

import ComarcaPath from './ComarcaPath';
import FichaTropas from './FichaTropas';
import BotonVistaRegiones from '../ui/BotonVistaRegiones';
import ControlDespliegue from '../hud/ControlDespliegue';
import AnimacionRefuerzos from '../hud/AnimacionRefuerzos';
import { COMARCAS_SVG_DATA } from '../../data/comarcasSvg';
import mapData from '../../data/map_aragon.json';

// Jugador local actual — sustituir por el valor real del store cuando se conecte el backend
const JUGADOR_LOCAL = 'jugador1';

/**
 * Agrupa las comarcas por región, calcula el dominio del jugador local
 * y devuelve las coordenadas del centro geográfico de cada región para
 * pintar la etiqueta SVG directamente sobre el mapa.
 *
 * @param {Array}  comarcasCompletas - Comarcas con campos SVG + datos del mapa (centro, region_id).
 * @param {Object} propietarios      - Mapa comarca → jugador propietario.
 * @returns {Array<{ id, centroX, centroY, nombreCorto, textoStats }>}
 */
const calcularInfoRegiones = (comarcasCompletas, propietarios) => {
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
    const total        = comarcas.length;
    const poseeJugador = comarcas.filter((id) => propietarios[id] === JUGADOR_LOCAL).length;
    const porcentaje   = total > 0 ? Math.round((poseeJugador / total) * 100) : 0;

    const regionInfo = mapData.regions[regionId];
    const nombreCorto = regionInfo ? regionInfo.name : regionId;

    return {
      id:          regionId,
      centroX:     totalX / total,
      centroY:     totalY / total,
      nombreCorto,
      textoStats:  `${porcentaje}% (${poseeJugador}/${total})`,
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

  useEffect(() => {
    const rawData = Object.entries(mapData.comarcas).map(([key, value]) => ({
      id: key,
      nombre: value.name,
      adyacentes: value.adjacent_to,
    }));

    inicializarJuego(rawData);
    setFase('DESPLIEGUE');
  }, [inicializarJuego, setFase]);

  const comarcasResaltadas = useGameStore((state) => state.comarcasResaltadas) || [];
  const origenSeleccionado = useGameStore((state) => state.origenSeleccionado);
  const destinoSeleccionado = useGameStore((state) => state.destinoSeleccionado);
  const tropas = useGameStore((state) => state.tropas);
  const propietarios = useGameStore((state) => state.propietarios);
  const coloresJugadores = useGameStore((state) => state.coloresJugadores);

  const comarcasCompletas = useMemo(() => {
    return COMARCAS_SVG_DATA.map((svgItem) => {
      const infoExtra = mapData.comarcas[svgItem.id];
      if (infoExtra) {
        return {
          ...svgItem,
          ...infoExtra,
        };
      }
      return svgItem;
    });
  }, []);

  const modoVista = useGameStore((state) => state.modoVista);

  // En modo REGIONES las tropas no se muestran para no confundir la lectura del mapa
  let mostrarTropas = true;
  if (modoVista === 'REGIONES') {
    mostrarTropas = false;
  }

  // En modo REGIONES calculamos y pintamos etiquetas SVG con el dominio por región.
  // En modo COMARCAS esta variable es nula y no se renderiza nada extra.
  let etiquetasRegiones = null;
  if (modoVista === 'REGIONES') {
    const infoRegiones = calcularInfoRegiones(comarcasCompletas, propietarios);

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

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svgElement = select(svgRef.current);
    const gElement = select(gRef.current);

    const zoomBehavior = zoom()
      .scaleExtent([1, 5])
      .translateExtent([
        [-400, -250],
        [50, 300]
      ])
      .on('zoom', (evento) => {
        gElement.attr('transform', evento.transform);
        setZoomScale(evento.transform.k);
      });

    // Desactivar zoom nativo por doble clic para evitar chocar con interactividad rápida
    svgElement.call(zoomBehavior).on('dblclick.zoom', null);
  }, []);

  /**
   * Deselecciona cualquier provincia activa si el jugador hace clic al vacío del mapa.
   * @param {Event} e
   */
  const handleFondoClick = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'image' || e.target.tagName === 'rect') {
      limpiarSeleccion();
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
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
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

          <image
            href="/file.svg"
            x="-900"
            y="-350"
            width="1450"
            height="950"
            preserveAspectRatio="none"
          />

          {sortedComarcas.map((comarca) => (
            <ComarcaPath
              key={`path-${comarca.id}`}
              id={comarca.id}
              d={comarca.d}
              fill={comarca.fill}
              regionId={comarca.region_id}
              hovered={hovered}
              setHovered={setHovered}
            />
          ))}

          {mostrarTropas && sortedComarcas.map((comarca) => {
            const rawName = comarca.name || comarca.id;
            const cantidadTropas = tropas[comarca.id] || 0;
            const dueño = propietarios ? propietarios[comarca.id] : null;

            let colorActual = 'var(--color-state-disabled)';
            if (dueño && coloresJugadores && coloresJugadores[dueño]) {
              colorActual = coloresJugadores[dueño];
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
              />
            );
          })}

          {etiquetasRegiones}
        </g>
      </svg>
      <BotonVistaRegiones />
      <ControlDespliegue />
      <AnimacionRefuerzos />
    </div>
  );
};

export default Tablero;