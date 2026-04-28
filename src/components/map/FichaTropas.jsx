import React from 'react';
import IconoEngranaje from './IconoEngranaje';
import IconoProbeta from './IconoProbeta';

/**
 * Renderiza el marcador circular sobre una comarca para mostrar su cantidad de tropas.
 * @param {Object} props
 * @returns {JSX.Element} El SVG group con la ficha.
 */
const FichaTropas = ({ cx, cy, tropas, nombreComarca, zoomScale, colorFondo, strokeFondo, isTrabajando, isInvestigando, estadosAlterados = [] }) => {
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

    // ─ Color del círculo según estado de bloqueo ──────────────────────────────
    // Si el territorio tiene una tarea activa, el color del círculo cambia para
    // reflejar el tipo de actividad. Esto es visible para TODOS los jugadores
    // ya que el estado llega por WebSocket.
    let fillCirculo;
    let strokeCirculo = strokeFondo || 'var(--color-border-gold)';
    let colorTexto = 'var(--color-text-primary)';
    let strokeTexto = 'var(--color-ui-bg-primary)';

    if (isInvestigando) {
        // Investigando: Fondo del jugador, borde dorado, texto normal
        fillCirculo = colorFondo || 'var(--color-estado-investigando, #4C51BF)';
    } else if (isTrabajando) {
        // Trabajando: Fondo del jugador, borde dorado, texto normal
        fillCirculo = colorFondo || 'var(--color-ui-panel-overlay)';
    } else {
        fillCirculo = colorFondo || 'var(--color-ui-panel-overlay)';
    }

    // Mapa de emojis para efectos de ataques especiales
    const iconosEfectos = {
        'gripe_aviar': '🦠',
        'coronavirus': '☣️',
        'fatiga': '🥱',
        'inhibidor_senal': '📡',
        'muro': '🧱',
    };

    return (
        <g
            pointerEvents="none"
            transform={`translate(${cx}, ${cy}) scale(${escalaInversa}) translate(${-cx}, ${-cy})`}
        >
            {etiquetaNombre}

            {isInvestigando ? (
                <IconoProbeta
                    x={cx - 24}
                    y={(cy - 4) - 24}
                    size={48}
                    fill={fillCirculo}
                    stroke={strokeCirculo}
                    strokeWidth="30"
                />
            ) : isTrabajando ? (
                <IconoEngranaje
                    x={cx - 20}
                    y={(cy - 4) - 20}
                    size={40}
                    fill={fillCirculo}
                    stroke={strokeCirculo}
                    strokeWidth="30"
                />
            ) : (
                <circle
                    cx={cx}
                    cy={cy - 4}
                    r={13}
                    fill={fillCirculo}
                    stroke={strokeCirculo}
                    strokeWidth="1.5"
                    filter="drop-shadow(0px 2px 3px var(--color-ui-bg-primary))"
                />
            )}

            <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13px"
                fontWeight="900"
                fill={colorTexto}
                stroke={strokeTexto}
                strokeWidth="0.5"
                paintOrder="stroke fill"
                style={{
                    fontFamily: 'var(--font-family-base)'
                }}
            >
                {tropas}
            </text>


            {/* Iconos de Estados Alterados/Ataques Especiales (Arriba a la izquierda) */}
            {estadosAlterados.length > 0 && (
                <g transform={`translate(${cx - 18}, ${cy - 18})`}>
                    {estadosAlterados.map((efecto, index) => {
                        const emoji = iconosEfectos[efecto] || '⚠️';
                        // Desplazamos ligeramente si hay más de 1 efecto para que no se superpongan
                        const offsetX = index === 1 ? -12 : index === 2 ? 12 : 0;
                        const offsetY = index === 2 ? -10 : 0;
                        return (
                            <text key={efecto} x={offsetX} y={offsetY} fontSize="14px" filter="drop-shadow(0px 2px 2px var(--color-ui-bg-primary))">
                                {emoji}
                            </text>
                        );
                    })}
                </g>
            )}
        </g>
    );
};

export default FichaTropas;
