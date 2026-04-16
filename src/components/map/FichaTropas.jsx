import React from 'react';

/**
 * Renderiza el marcador circular sobre una comarca para mostrar su cantidad de tropas.
 * @param {Object} props
 * @returns {JSX.Element} El SVG group con la ficha.
 */
const FichaTropas = ({ cx, cy, tropas, nombreComarca, zoomScale, colorFondo, strokeFondo, isTrabajando, isInvestigando }) => {
    // Calcular escala inversa para mantener la legibilidad al hacer zoom
    const escalaInversa = Math.max(0.4, 1 / (zoomScale * 0.75));

    // Separar el nombre de la comarca en dos líneas si es demasiado largo
    let lineasTexto = [];
    const partes = nombreComarca.split(nombreComarca.includes(' ') ? ' ' : '_');

    if (partes.length <= 2) {
        lineasTexto = partes;
    } else {
        const medio = Math.ceil(partes.length / 2);
        lineasTexto = [
            partes.slice(0, medio).join(' '),
            partes.slice(medio).join(' ')
        ];
    }

    // Renderizar el nombre de la comarca solo si el zoom es suficiente
    let etiquetaNombre = null;
    if (zoomScale > 1.75) {
        etiquetaNombre = (
            <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                fontWeight="bold"
                fill="var(--color-text-primary)"
                stroke="var(--color-ui-bg-primary)"
                strokeWidth="2.5"
                paintOrder="stroke fill"
                style={{
                    fontFamily: 'var(--font-family-base)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0px 2px 2px var(--color-ui-bg-primary)',
                    pointerEvents: 'none'
                }}
            >
                {lineasTexto.map((linea, i) => (
                    <tspan
                        key={i}
                        x={cx}
                        dy={i === 0 ? 0 : 10}
                        fontSize="8.5px"
                    >
                        {linea}
                    </tspan>
                ))}
            </text>
        );
    }

    // Establecer el color de la ficha
    const fillColorFondo = colorFondo || 'var(--color-ui-panel-overlay)';

    return (
        <g
            pointerEvents="none"
            transform={`translate(${cx}, ${cy}) scale(${escalaInversa}) translate(${-cx}, ${-cy})`}
        >
            {etiquetaNombre}

            <circle
                cx={cx}
                cy={cy - 4}
                r={13}
                fill={fillColorFondo}
                stroke={strokeFondo || "var(--color-border-gold)"}
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 3px var(--color-ui-bg-primary))"
            />

            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13px"
                fontWeight="900"
                fill="var(--color-text-primary)"
                stroke="var(--color-ui-bg-primary)"
                strokeWidth="0.5"
                paintOrder="stroke fill"
                style={{
                    fontFamily: 'var(--font-family-base)'
                }}
            >
                {tropas}
            </text>

            {isTrabajando && <text x={cx + 12} y={cy - 10} fontSize="14px" filter="drop-shadow(0px 2px 2px var(--color-ui-bg-primary))">⚒️</text>}
            {isInvestigando && <text x={cx + 12} y={cy + 8} fontSize="14px" filter="drop-shadow(0px 2px 2px var(--color-ui-bg-primary))">🎓</text>}
        </g>
    );
};

export default FichaTropas;
