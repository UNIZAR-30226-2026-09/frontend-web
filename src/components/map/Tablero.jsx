// src/Tablero.jsx
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
   * super hack visual.
   * un sort() que reordena todo el array de dom elements cada vez que cambia el estado
   * para escupir al final (arriba del todo en el SVG-Z-index) lo que esté seleccionado
   * o hovereado. evita que el stroke blanco se corte o que una comarca chiquita quede
   * tapada por una provincia gorda.
   */
  const sortedComarcas = [...comarcasCompletas].sort((a, b) => {
    const aSelected = origenSeleccionado === a.id || destinoSeleccionado === a.id || comarcasResaltadas.includes(a.id);
    const bSelected = origenSeleccionado === b.id || destinoSeleccionado === b.id || comarcasResaltadas.includes(b.id);

    const aHovered = hovered === a.id;
    const bHovered = hovered === b.id;

    const aScore = aHovered ? 2 : (aSelected ? 1 : 0);
    const bScore = bHovered ? 2 : (bSelected ? 1 : 0);
    return aScore - bScore;
  });


  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svgElement = select(svgRef.current);
    const gElement = select(gRef.current);

    const zoomBehavior = zoom()
      .scaleExtent([1, 5]) // que no te deje hacer zoom out de más
      .translateExtent([
        [-400, -250], // tope arriba a la izquierda
        [50, 300]     // tope abajo a la derecha
      ])
      .on('zoom', (evento) => {
        gElement.attr('transform', evento.transform);
        setZoomScale(evento.transform.k);
      });

    // quitamos lo del doble click porque molesta al jugar rápido
    svgElement.call(zoomBehavior).on("dblclick.zoom", null);
  }, []);

  /**
   * esto salva la UX general. cuando fallas el click en el mapa en vez de dar a una 
   * provincia y clicas "al agua", ejecutamos limpiarSeleccion() del state manager global.
   */
  const handleFondoClick = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'image' || e.target.tagName === 'rect') {
      limpiarSeleccion();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-400 -250 450 550"
        {...props}
        onClick={handleFondoClick}
        style={{ width: '100%', height: '100%', cursor: 'grab' }}
      >
        <g ref={gRef}>

          <image
            href="/file.svg"
            x="-550"
            y="-350"
            width="750"
            height="750"
            preserveAspectRatio="xMidYMid slice"
            style={{ pointerEvents: 'auto', cursor: 'default' }} // para que reconozca el clic si fallas a la comarca
          />

          {/* PRIMER BUCLE: dibujamos las formas del terreno primero para que queden abajo */}
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

          {/* SEGUNDO BUCLE: ponemos los carteles encima para que no se tapen */}
          {sortedComarcas.map((comarca) => {
            const rawName = comarca.name || comarca.id;
            const cantidadTropas = tropas[comarca.id] || 0; // por si alguna colapsa y está vacía

            return (
              <FichaTropas
                key={`ficha-${comarca.id}`}
                cx={comarca.centro[0]}
                cy={comarca.centro[1]}
                tropas={cantidadTropas}
                nombreComarca={rawName}
                zoomScale={zoomScale}
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