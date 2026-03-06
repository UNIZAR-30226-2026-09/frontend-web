import React from 'react';

const FichaTropas = ({ cx, cy, tropas, nombreComarca, zoomScale }) => {

    // calculamos la escala al revés: si el usuario hace mucho zoom, encogemos la ficha
    // así la cosa se lee bien siempre pero no nos cubre todo el css del mapa
    // le clavamos un math.max para que pare de achicarse y no desaparezca
    const escalaInversa = Math.max(0.4, 1 / (zoomScale * 0.75));

    return (
        <g
            pointerEvents="none"
            transform={`translate(${cx}, ${cy}) scale(${escalaInversa}) translate(${-cx}, ${-cy})`}
        >
            {/* el nombre bajadito para que no pise al icono de la tropa */}
            {zoomScale > 1.75 && (
                <text
                    x={cx}
                    y={cy + 22} /* lo tiramos un poco para abajo para que el ojo descanse */
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
                    {/* chapucilla rápida para partir nombres muy largos en un par de líneas */}
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
                                fontSize="8.5px" // letra un pelín más enana por si el string se alarga mucho
                            >
                                {linea}
                            </tspan>
                        ));
                    })()}
                </text>
            )}

            {/* el círculo oscurito donde se pone el número de tropas. levantado de na' */}
            <circle
                cx={cx}
                cy={cy - 4}
                r={13} // de 14 bajó a 13 para darle algo de respiro visual
                fill="rgba(30, 30, 30, 0.9)"
                stroke="#b8860b"
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.6))"
            />

            {/* el dígito gigante en tol centro del círculo */}
            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                dominantBaseline="central" /* magia negra para centrar en vertical clavado */
                fontSize="13px"
                fontWeight="900"
                fill="#ffd700" /* doradito para conjuntar el stroke de fuera */
                style={{
                    fontFamily: 'system-ui, sans-serif',
                    textShadow: '1px 1px 1px rgba(0,0,0,0.9)'
                }}
            >
                {tropas}
            </text>
        </g>
    );
};

export default FichaTropas;
