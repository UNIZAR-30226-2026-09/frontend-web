// src/Tablero.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { useGameStore } from '../store/gameStore';

import ComarcaPath from '../components/ComarcaPath';
import BotonVistaRegiones from '../components/BotonVistaRegiones';
import { COMARCAS_SVG_DATA } from '../data/comarcasSvg';
import mapData from '../data/map_aragon.json';

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
      .scaleExtent([1, 5]) // Cambiado el mínimo de 0.5 a 1 para no alejar de más
      .translateExtent([
        [-400, -250], // Límite Arriba-Izquierda 
        [50, 300]     // Límite Abajo-Derecha 
      ])
      .on('zoom', (evento) => {
        gElement.attr('transform', evento.transform);
        setZoomScale(evento.transform.k);
      });

    // Deshabilita doble click
    svgElement.call(zoomBehavior).on("dblclick.zoom", null);
  }, []);

  // Manejador del click en el fondo para limpiar la selección
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
            href="/Tablero.png"
            x="-550"
            y="-350"
            width="750"
            height="750"
            preserveAspectRatio="xMidYMid slice"
            style={{ pointerEvents: 'auto', cursor: 'default' }} // Habilitado eventos para poder clicar fuera, y cursor normal
          />

          {sortedComarcas.map((comarca) => {
            const rawName = comarca.name || comarca.id;
            const words = rawName.toUpperCase().split(rawName.includes(' ') ? ' ' : '_');
            const lineHeight = 4.5;
            const startY = comarca.centro[1] - ((words.length - 1) * lineHeight) / 2;

            return (
              <g key={comarca.id}>
                <ComarcaPath
                  id={comarca.id}
                  d={comarca.d}
                  fill={comarca.fill}
                  regionId={comarca.region_id}
                  hovered={hovered}
                  setHovered={setHovered}
                />
                {zoomScale > 1.75 && (
                  <text
                    x={comarca.centro[0]}
                    y={startY}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="comarca-lod-text"
                    style={{ fontSize: '5px', fill: 'black', pointerEvents: 'none' }}
                  >
                    {words.map((word, index) => (
                      <tspan x={comarca.centro[0]} dy={index === 0 ? 0 : lineHeight} key={index}>
                        {word}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <BotonVistaRegiones />
    </div>
  );
};

export default Tablero;