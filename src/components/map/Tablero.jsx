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

/**
 * Lienzo principal del juego que renderiza el mapa SVG, el zoom interactivo y sus marcadores de tropas.
 *
 * @param {Object} props
 * @returns {JSX.Element} El contenedor DOM con el SVG interactivo.
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
    setFase('ATAQUE_NORMAL');
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

  /**
   * Ordena las comarcas para dibujarlas al final del DOM SVG y que queden visualmente superpuestas.
   * Se da prioridad a la comarca bajo el ratón, y luego a las que estén resaltadas por acciones tácticas.
   * Esto previene el clásico bug de SVGs donde los bordes resaltados se esconden bajo provincias vecinas.
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
   * Comprueba que el origen del clic sea el fondo estructural (rect, image, svg) y no un trazado.
   * @param {Event} e
   */
  const handleFondoClick = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'image' || e.target.tagName === 'rect') {
      limpiarSeleccion();
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--color-map-ocean)'
    }}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-400 -250 450 550"
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
            x="-400"
            y="-250"
            width="550"
            height="400"
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

          {sortedComarcas.map((comarca) => {
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
        </g>
      </svg>
      <BotonVistaRegiones />
      <ControlDespliegue />
      <AnimacionRefuerzos />
    </div>
  );
};

export default Tablero;