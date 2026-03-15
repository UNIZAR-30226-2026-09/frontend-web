import React from 'react';

const FichaTropas = ({ cx, cy, tropas, nombreComarca, zoomScale, colorFondo }) => {

    // calculamos la escala al revés: si el usuario hace mucho zoom, encogemos la ficha
    // así la cosa se lee bien siempre pero no nos cubre todo el css del mapa
    const escalaInversa = Math.max(0.4, 1 / (zoomScale * 0.75)); //math.max para que no se vuelva muy pequeño

    return (
        <g
            pointerEvents="none"
            transform={`translate(${cx}, ${cy}) scale(${escalaInversa}) translate(${-cx}, ${-cy})`}
        >
            {/* el nombre mas abajo para que no tape al numero de tropas */}
            {zoomScale > 1.75 && (
                <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fontWeight="bold"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="2.5"
                    paintOrder="stroke fill"
                    style={{
                        fontFamily: 'system-ui, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        textShadow: '0px 2px 2px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                    }}
                >
                    {/* para que se divida en 2 los nombres */}
                    {(() => {
                        const partes = nombreComarca.split(nombreComarca.includes(' ') ? ' ' : '_');
                        let lineas = [];
                        if (partes.length <= 2) {
                            lineas = partes;
                        } else {
                            // si son demasiadas palabras, cortamos más o menos por el medio
                            const medio = Math.ceil(partes.length / 2);
                            lineas = [
                                partes.slice(0, medio).join(' '),
                                partes.slice(medio).join(' ')
                            ];
                        }

                        return lineas.map((linea, i) => (
                            <tspan
                                key={i}
                                x={cx}
                                dy={i === 0 ? 0 : 10}
                                fontSize="8.5px"
                            >
                                {linea}
                            </tspan>
                        ));
                    })()}
                </text>
            )}

            {/* circulo donde se pone el numero de tropas */}
            <circle
                cx={cx}
                cy={cy - 4}
                r={13}
                fill={colorFondo || "rgba(30, 30, 30, 0.9)"}
                stroke="#ffffffff" // borde del numero de tropas -- cambiar color!!
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.6))"
            />

            {/* el umero de tropas */}
            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13px"
                fontWeight="900"
                fill="#ffffff"
                stroke="rgba(0,0,0,0.8)"
                strokeWidth="0.5"
                paintOrder="stroke fill"
                style={{
                    fontFamily: 'system-ui, sans-serif',
                }}
            >
                {tropas}
            </text>
        </g>
    );
};

export default FichaTropas;
