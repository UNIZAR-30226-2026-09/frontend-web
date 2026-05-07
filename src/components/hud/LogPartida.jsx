import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const parseLogToString = (log) => {
    if (typeof log === 'string') return log;

    const d = log.datos || {};
    const user = log.user ?? '?';
    switch ((log.tipo_evento || '').toLowerCase()) {
        case 'partida_iniciada':
            return `La Guerra por la Soberanía ha comenzado. Participantes: ${(d.jugadores || []).join(', ')}. Las fuerzas de ${d.primer_turno || '?'} toman la iniciativa.`;
        case 'partida_finalizada':
            return `¡Conflicto concluido! ${d.ganador || user} ha sometido al resto de facciones y reclama el control absoluto.`;
        case 'jugador_eliminado':
            if (d.por_quien) {
                return `¡Caída de un imperio! Las defensas de ${d.eliminado || user} han colapsado a manos de ${d.por_quien}.`;
            }
            return `¡Caída de un imperio! Las defensas de ${d.eliminado || user} han colapsado por desgaste.`;
        case 'abandonar_partida':
            return `${d.usuario || user} ha desertado antes de que comience el conflicto.`;
        case 'ataque_resultado':
            return `${user} lanza una ofensiva desde ${d.origen || '?'} hacia ${d.destino || '?'}. Causa ${d.bajas_defensor ?? 0} bajas, sufriendo ${d.bajas_atacante ?? 0} pérdidas.`;
        case 'conquista':
            return `¡Victoria decisiva! Las tropas de ${user} han ocupado ${d.territorio_conquistado || '?'}, expulsando a las fuerzas de ${d.anterior_dueno || '?'}.`;
        case 'movimiento_conquista':
            return `${user} redespliega tácticamente ${d.tropas || 0} batallones desde ${d.origen || '?'} hacia ${d.destino || '?'}.`;
        case 'tropas_colocadas':
            return `${user} ha reforzado el frente en ${d.territorio || '?'} desplegando ${d.cantidad || 0} nuevas divisiones.`;
        case 'cambio_fase':
            const fn = (d.fase_nueva || '').toLowerCase();
            if (fn && fn !== 'refuerzo') {
                return `${user} avanza su campaña: las fuerzas entran en fase de ${d.fase_nueva.replace('_', ' ')}.`;
            } else if (d.turno_de || fn === 'refuerzo') {
                return `Alto mando: Inicia el turno de ${d.turno_de || user}. Se movilizan ${d.tropas_recibidas || 0} brigadas de refuerzo.`;
            }
            return `Alto mando: Inicia el turno de ${user}.`;
        case 'trabajar':
            return `${user} ha movilizado a la población de ${d.territorio || d.territorio_id || '?'} para acelerar la producción de recursos.`;

        case 'investigar':
            return `${user} ha ordenado a las instalaciones de ${d.territorio || d.territorio_id || '?'} iniciar un desarrollo confidencial.`;

        case 'territorio_actualizado':
            if (d.estado_bloqueo === 'trabajando') {
                return `${user} ha movilizado a la población de ${d.territorio || d.territorio_id || '?'} para acelerar la producción de recursos.`;
            } else if (d.estado_bloqueo?.startsWith('investigando')) {
                return `${user} ha ordenado a las instalaciones de ${d.territorio || d.territorio_id || '?'} iniciar un desarrollo confidencial.`;
            }
            return `[${log.tipo_evento}] Actualización en ${d.territorio || d.territorio_id || '?'}`;
        case 'comprar_tecnologia':
            return `${user} ha financiado la tecnología militar '${d.tecnologia || '?'}' por un coste de ${d.precio || 0} de oro.`;
        case 'ataque_especial':
            return `¡Lanzamiento táctico! ${user} ejecuta la operación '${d.tipo_ataque || d.tipo || '?'}' con objetivo en ${d.destino || '?'}.`;
        default:
            return `[${log.tipo_evento}] ${user}`;
    }
};

/**
 * Parsea una frase de log y colorea los nombres de jugadores con su color real.
 * Devuelve un array de spans con el texto troceado.
 */
const colorearNombres = (frase, coloresJugadores) => {
    if (!coloresJugadores || Object.keys(coloresJugadores).length === 0) {
        return frase;
    }

    // Ordenar jugadores por longitud desc para evitar que un nombre corto tape a uno largo
    const jugadores = Object.keys(coloresJugadores).sort((a, b) => b.length - a.length);
    // Crear regex que detecte los nombres como palabras (no como parte de otra)
    const escaped = jugadores.map(j => j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'g');

    const partes = frase.split(regex);
    return partes.map((parte, i) => {
        const color = coloresJugadores[parte];
        if (color) {
            return (
                <span
                    key={i}
                    style={{
                        color,
                        fontWeight: 'bold',
                        textShadow: `0 0 6px ${color}55`,
                    }}
                >
                    {parte}
                </span>
            );
        }
        return <span key={i}>{parte}</span>;
    });
};

const LogPartida = () => {
    const historialLog = useGameStore((state) => state.historialLog);
    const coloresJugadores = useGameStore((state) => state.coloresJugadores);
    const containerRef = useRef(null);

    // Los mensajes más nuevos están al principio del array (index 0).
    // Para mostrarlos abajo, invertimos el array antes de renderizar.
    const mensajesOrdenados = [...historialLog].reverse();

    // Auto-scroll al final (abajo) cada vez que llega un nuevo mensaje
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [historialLog]);

    if (!historialLog || historialLog.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '16px',
                left: '16px',
                width: '400px',
                height: '300px',
                background: 'var(--color-ui-panel-overlay, rgba(12, 10, 5, 0.92))',
                border: '2px solid var(--color-border-gold, #8C7322)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(5px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 900,
            }}
        >
            {/* Cabecera */}
            <div
                style={{
                    padding: '0.5rem 0.9rem',
                    borderBottom: '1px solid rgba(140, 115, 34, 0.25)',
                    flexShrink: 0,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontFamily: 'var(--font-family-title, serif)',
                        color: 'var(--color-border-gold, #C9A227)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        letterSpacing: '3px',
                        textTransform: 'uppercase',
                        textAlign: 'center',
                    }}
                >
                    MENSAJES DE LA PARTIDA
                </h3>
            </div>

            {/* Lista de mensajes */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '0.5rem 0.6rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    // Scrollbar estética dorada
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(140, 115, 34, 0.45) rgba(0, 0, 0, 0.25)',
                }}
                className="log-partida-scroll"
            >
                <AnimatePresence initial={false}>
                    {mensajesOrdenados.map((mensaje, index) => {
                        // Generar un key único dependiendo de si es string u objeto log.id
                        const msgKey = mensaje?.id ? mensaje.id : `${index}-${typeof mensaje === 'string' ? mensaje.substring(0, 10) : ''}`;
                        const esUltimo = index === mensajesOrdenados.length - 1;
                        return (
                            <motion.div
                                key={msgKey}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    padding: '0.3rem 0.5rem',
                                    borderBottom: esUltimo
                                        ? 'none'
                                        : '1px solid rgba(140, 115, 34, 0.12)',
                                    fontSize: '12px',
                                    fontFamily: 'monospace',
                                    lineHeight: '1.5',
                                    color: esUltimo
                                        ? 'var(--color-text-primary, #E2E8F0)'
                                        : 'var(--color-text-secondary, #A0AEC0)',
                                    wordBreak: 'break-word',
                                    background: esUltimo
                                        ? 'rgba(140, 115, 34, 0.08)'
                                        : 'transparent',
                                    borderRadius: esUltimo ? '6px' : '0',
                                    transition: 'background 0.3s ease',
                                }}
                            >
                                {colorearNombres(parseLogToString(mensaje), coloresJugadores)}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LogPartida;
