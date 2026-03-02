// src/Tablero.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { useMapStore } from './store/useMapStore';

import ComarcaPath from './components/ComarcaPath';
import FlechaAtaque from './components/FlechaAtaque';
import { COMARCAS_SVG_DATA } from './data/comarcasSvg';
import mapData from './data/map_aragon.json';

const Tablero = (props) => {
  const [hovered, setHovered] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const svgRef = useRef(null);
  const gRef = useRef(null);

  const selectedComarcas = useMapStore((state) => state.selectedComarcas);

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
    const aSelected = selectedComarcas.includes(a.id);
    const bSelected = selectedComarcas.includes(b.id);
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

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-400 -250 450 550"
      {...props}
      style={{ width: '100%', height: '100%', cursor: 'grab' }}
    >
      <g ref={gRef}>

        <image
          href="/fondo_mesa.jpeg"
          // Tendrás que ajustar estos 4 números para que el mapa de Aragón encaje justo dentro del pentágono.
          // Como el viewBox de tu colega mide 450x550, he hecho la imagen más grande para que lo abarque.
          x="-550"
          y="-350"
          width="750"
          height="750"
          preserveAspectRatio="xMidYMid slice"
          style={{ pointerEvents: 'none' }} // SÚPER IMPORTANTE: Para que no te bloquee los clics del mapa
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
        <FlechaAtaque />
      </g>
    </svg>
  );
};

export default Tablero;