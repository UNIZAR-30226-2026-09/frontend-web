import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/PanelArbolTecnologico.css';

// ─── Emojis por ID de habilidad (enriquecimiento puramente visual en el cliente) ───
const ICONOS = {
    gripe_aviar:             '🦠',
    vacuna_universal:        '💉',
    fatiga:                  '🥱',
    coronavirus:             '☣️',
    academia_militar:        '🎖️',
    inhibidor_senal:         '📡',
    propaganda_subversiva:   '📰',
    muro_fronterizo:         '🧱',
    sanciones_internacionales: '📜',
    mortero_tactico:         '🪖',
    misil_crucero:           '🚀',
    cabeza_nuclear:          '☢️',
    bomba_racimo:            '💥',
};

// ─── Títulos de rama (cosmético) ───────────────────────────────────────────────
const TITULO_RAMA = {
    biologica:  '⚗️ Guerra Biológica',
    logistica:  '🎯 Operaciones & Logística',
    artilleria: '💣 Artillería',
};

// ─── Calcula estado visual del nodo ───────────────────────────────────────────
/**
 * Clasifica un nodo como 'desbloqueado' | 'disponible' | 'bloqueado'
 *
 * Un requisito se considera SATISFECHO si:
 *   A) Su ID ya está en `tecnologias_desbloqueadas` del jugador, O
 *   B) La entrada de ese ID en el catálogo tiene `predesbloqueada: true`
 *
 * @param {Object}   habilidad    - Objeto HabilidadOut del backend
 * @param {string[]} desbloqueadas - IDs ya desbloqueados por el jugador
 * @param {Object}   catalogo     - Catálogo completo { id: HabilidadOut } para resolver predesbloqueada
 */
const calcularEstadoNodo = (habilidad, desbloqueadas, catalogo) => {
    const desbNorm = desbloqueadas.map(t => t.toLowerCase());
    const idNorm   = (habilidad.id || '').toLowerCase();

    // Ya está completamente desbloqueado por el jugador
    if (desbNorm.includes(idNorm)) return 'desbloqueado';

    // Helper: un requisito está satisfecho si el jugador lo desbloqueó
    // O si el catálogo lo marca como predesbloqueada:true
    const requisitoCumplido = (reqId) => {
        if (desbNorm.includes(reqId.toLowerCase())) return true;
        // Buscar en el catálogo: tanto en forma plana como en forma {ramas:{...}}
        if (!catalogo) return false;
        // Forma directa { id: HabilidadOut } (cuando el catálogo aún no está normalizado)
        const entradaDirecta = catalogo[reqId] ?? catalogo[reqId.toLowerCase()];
        if (entradaDirecta?.predesbloqueada) return true;
        // Forma { ramas: { rama: [...HabilidadOut] } }
        if (catalogo.ramas) {
            for (const rama of Object.values(catalogo.ramas)) {
                const encontrada = rama.find(h => h.id?.toLowerCase() === reqId.toLowerCase());
                if (encontrada?.predesbloqueada) return true;
            }
        }
        return false;
    };

    // Comprobar prerequisitos desde el catálogo del backend
    const req = habilidad.prerequisito;
    if (!req || (Array.isArray(req) && req.length === 0)) return 'disponible';

    const requisitos = Array.isArray(req) ? req : [req];
    const todosCumplidos = requisitos.every(reqId => requisitoCumplido(reqId));
    return todosCumplidos ? 'disponible' : 'bloqueado';
};

// ─── SVG de líneas de conexión ────────────────────────────────────────────────
/**
 * Dibuja líneas SVG entre nodos padre e hijo basándose en el campo `prerequisito`.
 * Usa refs para localizar los elementos del DOM por data-tech-id.
 */
const LineasConexion = ({ habilidades, contenedorRef }) => {
    const [lineas, setLineas] = React.useState([]);

    React.useEffect(() => {
        if (!contenedorRef.current || !habilidades?.length) return;

        const calcular = () => {
            const contenedor = contenedorRef.current;
            const rect = contenedor.getBoundingClientRect();
            const nuevasLineas = [];

            for (const hab of habilidades) {
                const req = hab.prerequisito;
                if (!req) continue;

                const requisitos = Array.isArray(req) ? req : [req];
                const hijoEl = contenedor.querySelector(`[data-tech-id="${hab.id}"]`);
                if (!hijoEl) continue;

                const hijoRect = hijoEl.getBoundingClientRect();
                const x2 = hijoRect.left + hijoRect.width / 2 - rect.left;
                const y2 = hijoRect.top - rect.top;

                for (const reqId of requisitos) {
                    const padreEl = contenedor.querySelector(`[data-tech-id="${reqId}"]`);
                    if (!padreEl) continue;

                    const padreRect = padreEl.getBoundingClientRect();
                    const x1 = padreRect.left + padreRect.width / 2 - rect.left;
                    const y1 = padreRect.bottom - rect.top;

                    nuevasLineas.push({ x1, y1, x2, y2, key: `${reqId}->${hab.id}` });
                }
            }
            setLineas(nuevasLineas);
        };

        // Cálculo diferido para que el DOM esté renderizado
        const timer = setTimeout(calcular, 50);
        window.addEventListener('resize', calcular);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calcular);
        };
    }, [habilidades, contenedorRef]);

    if (!lineas.length) return null;

    return (
        <svg
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'visible',
            }}
            aria-hidden="true"
        >
            {lineas.map(({ x1, y1, x2, y2, key }) => (
                <line
                    key={key}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke="var(--color-border-bronze)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity="0.55"
                />
            ))}
        </svg>
    );
};

// ─── Tooltip modal de confirmación ───────────────────────────────────────────
const TooltipNodo = ({ techData, onConfirmar, onCerrar, puedeInvestigarGlobal, razonBloqueadoGlobal, enviando }) => {
    const { habilidad: tech, estadoNodo } = techData;
    
    let botonDeshabilitado = !puedeInvestigarGlobal || enviando || estadoNodo !== 'disponible';
    let mensajeAviso = razonBloqueadoGlobal;

    if (estadoNodo === 'desbloqueado') {
        mensajeAviso = "✅ Tecnología ya investigada.";
    } else if (estadoNodo === 'bloqueado') {
        mensajeAviso = "🔒 Antes debes investigar las tecnologías anteriores.";
    }

    return (
        <div className="tooltip-nodo-overlay" onClick={onCerrar}>
            <div className="tooltip-nodo-modal" onClick={(e) => e.stopPropagation()}>
                <div className="tooltip-nodo-header">
                    <span className="tooltip-icono">{ICONOS[tech.id] || '🔬'}</span>
                    <h3 className="tooltip-titulo">{tech.nombre}</h3>
                </div>
                <p className="tooltip-descripcion">{tech.descripcion || 'Sin descripción disponible.'}</p>
                {tech.precio > 0 && (
                    <p className="tooltip-precio">💰 Coste: <b>{tech.precio}</b> monedas</p>
                )}
                {mensajeAviso && (
                    <p className="tooltip-aviso">{mensajeAviso}</p>
                )}
                <div className="tooltip-botones">
                    {estadoNodo !== 'desbloqueado' && (
                        <button
                            className="btn-tooltip-investigar"
                            onClick={onConfirmar}
                            disabled={botonDeshabilitado}
                            title={mensajeAviso || 'Investigar esta tecnología'}
                        >
                            {enviando ? '⏳ Enviando...' : '📚 Investigar'}
                        </button>
                    )}
                    <button className="btn-tooltip-cerrar" onClick={onCerrar}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ─── Nodo individual ──────────────────────────────────────────────────────────
const NodoTecnologico = ({ habilidad, estadoNodo, isInvestigando, onClickNodo }) => {
    const clases = [
        'nodo-tech',
        `nodo-${estadoNodo}`,
        isInvestigando ? 'nodo-investigando' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={clases}
            data-tech-id={habilidad.id}
            onClick={() => onClickNodo({ habilidad, estadoNodo })}
            title={estadoNodo === 'bloqueado' ? 'Desbloquea los requisitos previos' : isInvestigando ? 'Investigación en curso...' : ''}
            style={{ position: 'relative', zIndex: 1 }}
        >
            <span className="icono-nodo">{ICONOS[habilidad.id] || '🔬'}</span>
            <span className="nombre-nodo">{habilidad.nombre || habilidad.id}</span>
            {/* Feedback de estado activo */}
            {estadoNodo === 'desbloqueado' && !isInvestigando && <span className="badge-nodo">✅</span>}
            {estadoNodo === 'bloqueado'    && <span className="badge-nodo">🔒</span>}
            {isInvestigando && (
                <span className="label-investigando">⏳ Investigando...</span>
            )}
        </div>
    );
};

// ─── Rama dinámica ────────────────────────────────────────────────────────────
/**
 * Renderiza una rama completa del árbol con sus nodos y las líneas SVG de conexión.
 * Los nodos se ordenan por nivel para asegurar una disposición natural de arriba a abajo.
 */
const RamaTecnologica = ({ nombre, habilidades, desbloqueadas, catalogo, investigandoHabilidadId, onClickNodo }) => {
    const contenedorRef = React.useRef(null);

    // Ordenar por nivel para renderizar de menor a mayor (raíces primero)
    const ordenadas = [...habilidades].sort((a, b) => (a.nivel ?? 0) - (b.nivel ?? 0));

    return (
        <div className="rama">
            <h3 className="rama-titulo">{TITULO_RAMA[nombre] || nombre}</h3>
            <div
                ref={contenedorRef}
                className="rama-nodos-contenedor"
                style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-around', minHeight: 0 }}
            >
                {/* SVG de líneas de conexión en fondo */}
                <LineasConexion habilidades={ordenadas} contenedorRef={contenedorRef} />

                {/* Agrupar por nivel para layout en filas */}
                {(() => {
                    const porNivel = {};
                    for (const hab of ordenadas) {
                        const lvl = hab.nivel ?? 1;
                        if (!porNivel[lvl]) porNivel[lvl] = [];
                        porNivel[lvl].push(hab);
                    }
                    return Object.entries(porNivel).map(([nivel, grupo]) => (
                        <div
                            key={nivel}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            {grupo.map(hab => (
                                <NodoTecnologico
                                    key={hab.id}
                                    habilidad={hab}
                                    estadoNodo={calcularEstadoNodo(hab, desbloqueadas, catalogo)}
                                    isInvestigando={investigandoHabilidadId === hab.id}
                                    onClickNodo={onClickNodo}
                                />
                            ))}
                        </div>
                    ));
                })()}
            </div>
        </div>
    );
};

// ─── Panel principal ──────────────────────────────────────────────────────────
/**
 * Panel overlay de Árbol Tecnológico completo.
 * Renderiza dinámicamente desde el catálogo del backend (sin datos hardcodeados).
 * Las conexiones entre nodos se dibujan en SVG usando el campo `prerequisito`.
 */
const PanelArbolTecnologico = () => {
    const [nodoSeleccionado, setNodoSeleccionado] = React.useState(null);
    const [enviando, setEnviando]                 = React.useState(false);

    const isArbolOpen              = useGameStore((s) => s.isArbolTecnologicoOpen);
    const toggleArbol              = useGameStore((s) => s.toggleArbolTecnologico);
    const tecnologiasDesbloqueadas = useGameStore((s) => s.tecnologiasDesbloqueadas);
    const catalogo                 = useGameStore((s) => s.catalogoTecnologias);
    const investigarBackend        = useGameStore((s) => s.investigarBackend);
    const faseActual               = useGameStore((s) => s.faseActual);
    const territorioInvestigando   = useGameStore((s) => s.territorioInvestigando);
    const diccionarioJugadores     = useGameStore((s) => s.diccionarioJugadores);
    const jugadorLocal             = useGameStore((s) => s.jugadorLocal);
    const territorioInvestigandoPendiente = useGameStore((s) => s.territorioInvestigandoPendiente);
    const origenSeleccionado       = useGameStore((s) => s.origenSeleccionado);
    const grafoGlobal              = useGameStore((s) => s.grafoGlobal);

    // ── Determinar la habilidad que se está investigando actualmente ──────────
    // El backend guarda en jugadores[username].habilidad_investigando el ID exacto.
    // Usamos eso para iluminar el nodo correcto. ramaInvestigando es un fallback legacy.
    const habilidadInvestigandoId = React.useMemo(() => {
        if (!jugadorLocal || !diccionarioJugadores) return null;
        const datosJugador = diccionarioJugadores[jugadorLocal];
        // Intentar primero el campo exacto del backend
        const habId = datosJugador?.habilidad_investigando ?? datosJugador?.rama_investigando ?? null;
        return habId ? String(habId).toLowerCase() : null;
    }, [jugadorLocal, diccionarioJugadores]);

    if (!isArbolOpen) return null;

    // El territorio investigador tiene prioridad: pendiente > seleccionado en mapa
    const territorioInvestigador = territorioInvestigandoPendiente || origenSeleccionado;

    // ── Lógica de permiso ───────────────────────────────────────────────────
    const enFaseGestion        = faseActual === 'GESTION';
    const hayTerritorioActivo  = Boolean(territorioInvestigador);
    const yaInvestigandoGlobal = Boolean(territorioInvestigando);
    const puedeInvestigar      = enFaseGestion && hayTerritorioActivo && !yaInvestigandoGlobal;

    let razonBloqueado = null;
    if (!enFaseGestion)            razonBloqueado = 'Solo puedes investigar en la fase de Gestión.';
    else if (!hayTerritorioActivo) razonBloqueado = 'Selecciona un territorio antes de abrir el árbol.';
    else if (yaInvestigandoGlobal) razonBloqueado = 'Ya tienes un territorio investigando este turno.';

    const nombreTerritorioActivo = territorioInvestigador
        ? (grafoGlobal?.get(territorioInvestigador)?.nombre || territorioInvestigador)
        : null;

    // ── Procesado del catálogo ──────────────────────────────────────────────
    let ramasData = {};

    if (catalogo) {
        if (catalogo.ramas) {
            ramasData = catalogo.ramas;
        } else {
            for (const [id, tech] of Object.entries(catalogo)) {
                const rama = tech.rama || 'general';
                if (!ramasData[rama]) ramasData[rama] = [];
                ramasData[rama].push({
                    id,
                    nombre: tech.nombre || id,
                    descripcion: tech.descripcion || '',
                    precio: tech.precio ?? 0,
                    nivel: tech.nivel ?? 1,
                    prerequisito: tech.requisitos ?? tech.prerequisito ?? null,
                    desbloquea: tech.desbloquea ?? [],
                    predesbloqueada: tech.predesbloqueada ?? false,
                    comprada: tech.comprada ?? false,
                });
            }
        }
    }

    // ── Confirmar investigación ─────────────────────────────────────────────
    const handleConfirmar = async () => {
        if (!nodoSeleccionado || !nodoSeleccionado.habilidad) return;
        setEnviando(true);
        try {
            await investigarBackend(nodoSeleccionado.habilidad.id, territorioInvestigador);
            setNodoSeleccionado(null);
        } finally {
            setEnviando(false);
        }
    };

    const tieneRamas = Object.keys(ramasData).length > 0;

    return (
        <div className="panel-arbol-overlay">
            <div className="panel-arbol-contenedor">
                <button className="btn-cerrar-arbol" onClick={toggleArbol}>✕</button>
                <h2 className="arbol-titulo">Investigación y Desarrollo</h2>

                <div className="arbol-contexto-banner">
                    {enFaseGestion && hayTerritorioActivo
                        ? <span>🔬 Territorio investigador: <b>{nombreTerritorioActivo}</b></span>
                        : enFaseGestion
                            ? <span>⚠️ Abre el árbol desde el panel de un territorio para investigar.</span>
                            : <span>ℹ️ Solo puedes investigar durante la fase de <b>Gestión</b>. (Modo consulta)</span>
                    }
                </div>

                {!catalogo ? (
                    <div className="loading-catalogo">Cargando catálogo de tecnologías...</div>
                ) : !tieneRamas ? (
                    <div className="loading-catalogo">No hay tecnologías disponibles en esta partida.</div>
                ) : (
                    <div className="ramas-grid">
                        {Object.entries(ramasData).map(([nombreRama, habilidades]) => (
                            <RamaTecnologica
                                key={nombreRama}
                                nombre={nombreRama}
                                habilidades={habilidades}
                                desbloqueadas={tecnologiasDesbloqueadas}
                                catalogo={catalogo}
                                investigandoHabilidadId={habilidadInvestigandoId}
                                onClickNodo={setNodoSeleccionado}
                            />
                        ))}
                    </div>
                )}
            </div>

            {nodoSeleccionado && (
                <TooltipNodo
                    techData={nodoSeleccionado}
                    onConfirmar={handleConfirmar}
                    onCerrar={() => setNodoSeleccionado(null)}
                    puedeInvestigarGlobal={puedeInvestigar}
                    razonBloqueadoGlobal={razonBloqueado}
                    enviando={enviando}
                />
            )}
        </div>
    );
};

export default PanelArbolTecnologico;
