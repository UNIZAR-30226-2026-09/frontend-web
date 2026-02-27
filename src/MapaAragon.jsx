// src/MapaAragon.jsx
import React, { useState, useEffect, useRef } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';

// Importamos nuestras nuevas piezas modulares
import ComarcaPath from './components/ComarcaPath';
import FlechaAtaque from './components/FlechaAtaque';
import { COMARCAS_SVG_DATA } from './data/comarcasSvg';

const MapaAragon = (props) => {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svgElement = select(svgRef.current);
    const gElement = select(gRef.current);

    const zoomBehavior = zoom()
      .scaleExtent([1, 5]) // Cambiado el mínimo de 0.5 a 1 para no alejar de más
      .translateExtent([
        [-400, -250], // Límite Arriba-Izquierda igual que viewBox 
        [50, 300]     // Límite Abajo-Derecha igual que viewBox (-400+450, -250+550)
      ])
      .on('zoom', (evento) => {
        gElement.attr('transform', evento.transform);
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
        {COMARCAS_SVG_DATA.map((comarca) => (
          <ComarcaPath
            key={comarca.id}  // React exige una key única al usar map()
            id={comarca.id}
            d={comarca.d}
            fill={comarca.fill}
            hovered={hovered}
            setHovered={setHovered}
          />
        ))}
        {hovered && (
          <use
            href={`#${hovered}`}
            style={{ pointerEvents: 'none' }}
          />
        )}
        <FlechaAtaque />
      </g>
    </svg>
  );
};

export default MapaAragon;