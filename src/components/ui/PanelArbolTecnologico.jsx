import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/PanelArbolTecnologico.css';

/**
 * Calcula el estado visual de un nodo: 'desbloqueado' | 'disponible' | 'bloqueado'
 * @param {string} techId - ID de la tecnología
 * @param {Object} catalogo - Catálogo completo del backend
 * @param {string[]} desbloqueadas - Lista de IDs desbloqueados por el jugador
 */
const calcularEstadoNodo = (techId, catalogo, desbloqueadas) => {
    // Normalización de entrada para robustez
    const desbloqueadasNormalizadas = desbloqueadas.map(t => t.toLowerCase());
    const idNormalizado = techId.toLowerCase();

    if (desbloqueadasNormalizadas.includes(idNormalizado)) return 'desbloqueado';
    
    // Forzar disponibilidad para Nivel 1 (IDs base)
    const idsNivel1 = ['gripe_aviar', 'academia_militar', 'mortero_tactico'];
    if (idsNivel1.includes(idNormalizado)) return 'disponible';

    const tech = catalogo?.[techId];
    if (!tech) return 'bloqueado';
    
    if (!tech.requisitos || tech.requisitos.length === 0) return 'disponible';
    
    // Un nodo está disponible si TODOS sus requisitos están desbloqueados
    const requisitosCumplidos = tech.requisitos.every((req) => desbloqueadasNormalizadas.includes(req.toLowerCase()));
    return requisitosCumplidos ? 'disponible' : 'bloqueado';
};

/**
 * Tooltip modal de confirmación de investigación.
 */
const TooltipNodo = ({ tech, onConfirmar, onCerrar, puedeInvestigar, razonBloqueado }) => (
    <div className="tooltip-nodo-overlay" onClick={onCerrar}>
        <div className="tooltip-nodo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tooltip-nodo-header">
                <span className="tooltip-icono">{tech.icono || '🔬'}</span>
                <h3 className="tooltip-titulo">{tech.nombre}</h3>
            </div>
            <p className="tooltip-descripcion">{tech.descripcion || 'Sin descripción disponible.'}</p>
            {tech.precio > 0 && <p className="tooltip-precio">💰 Coste: <b>{tech.precio}</b> monedas</p>}
            {razonBloqueado && (
                <p className="tooltip-aviso">⚠️ {razonBloqueado}</p>
            )}
            <div className="tooltip-botones">
                <button
                    className="btn-tooltip-investigar"
                    onClick={onConfirmar}
                    disabled={!puedeInvestigar}
                    title={razonBloqueado || 'Investigar esta tecnología'}
                >
                    📚 Investigar
                </button>
                <button className="btn-tooltip-cerrar" onClick={onCerrar}>Cancelar</button>
            </div>
        </div>
    </div>
);

/**
 * Nodo individual del árbol: DESBLOQUEADO | DISPONIBLE | BLOQUEADO | INVESTIGANDO
 */
const NodoTecnologico = ({ techId, techData, estado: estadoNodo, isInvestigandoRama, onClickNodo }) => {
    const clases = `nodo-tech nodo-${estadoNodo} ${isInvestigandoRama ? 'nodo-investigando' : ''}`;
    const clickeable = estadoNodo === 'disponible';

    return (
        <div
            className={clases}
            onClick={() => clickeable && onClickNodo({ id: techId, ...techData })}
            title={estadoNodo === 'bloqueado' ? 'Desbloquea los requisitos previos' : ''}
        >
            <span className="icono-nodo">{techData?.icono || '🔬'}</span>
            <span className="nombre-nodo">{techData?.nombre || techId}</span>
            {estadoNodo === 'desbloqueado' && <span className="badge-nodo">✅</span>}
            {estadoNodo === 'bloqueado'     && <span className="badge-nodo">🔒</span>}
            {isInvestigandoRama && <span className="badge-nodo anim-pulse">⏳</span>}
        </div>
    );
};

/**
 * Panel overlay de Árbol Tecnológico completo. Sin scroll, escalado para caber en pantalla.
 */
const PanelArbolTecnologico = () => {
    const [nodoSeleccionado, setNodoSeleccionado] = React.useState(null);
    const [enviando, setEnviando] = React.useState(false);

    const isArbolOpen               = useGameStore((s) => s.isArbolTecnologicoOpen);
    const toggleArbol               = useGameStore((s) => s.toggleArbolTecnologico);
    const tecnologiasDesbloqueadas  = useGameStore((s) => s.tecnologiasDesbloqueadas);
    const catalogo                  = useGameStore((s) => s.catalogoTecnologias);
    const investigarBackend         = useGameStore((s) => s.investigarBackend);
    const faseActual                = useGameStore((s) => s.faseActual);
    const territorioInvestigando    = useGameStore((s) => s.territorioInvestigando);
    const ramaInvestigando          = useGameStore((s) => s.ramaInvestigando);
    
    // Territorio que guardó ControlGestion antes de cerrarse
    const territorioInvestigandoPendiente = useGameStore((s) => s.territorioInvestigandoPendiente);
    // origenSeleccionado como fallback si el árbol se abre directamente
    const origenSeleccionado        = useGameStore((s) => s.origenSeleccionado);
    const grafoGlobal               = useGameStore((s) => s.grafoGlobal);

    if (!isArbolOpen) return null;

    // El territorio investigador es el pendiente (guardado antes del cierre del panel)
    // o el actualmente seleccionado en el mapa si se abrió el árbol directamente.
    const territorioInvestigador = territorioInvestigandoPendiente || origenSeleccionado;

    const getEstado = (id) => calcularEstadoNodo(id, catalogo, tecnologiasDesbloqueadas);

    // Mapeo de Emojis que mantenemos localmente por ID (ya que el backend no suele mandar SVGs/Emojis)
    const ICONOS = {
        gripe_aviar: '🦠',
        vacuna_universal: '💉',
        fatiga: '🥱',
        coronavirus: '☣️',
        academia_militar: '🎖️',
        inhibidor_senal: '📡',
        propaganda_subversiva: '📰',
        muro_fronterizo: '🧱',
        sanciones_internacionales: '📜',
        mortero_tactico: '🪖',
        misil_crucero: '🚀',
        cabeza_nuclear: '☢️',
        bomba_racimo: '💥'
    };

    // Razón de bloqueo para el tooltip
    const enFaseGestion          = faseActual === 'GESTION';
    const hayTerritorioActivo    = Boolean(territorioInvestigador);
    const yaInvestigandoGlobal   = Boolean(territorioInvestigando);
    
    const puedeInvestigar = enFaseGestion && hayTerritorioActivo && !yaInvestigandoGlobal;
    
    let razonBloqueado = null;
    if (!enFaseGestion)           razonBloqueado = 'Solo puedes investigar en la fase de Gestión.';
    else if (!hayTerritorioActivo) razonBloqueado = 'Selecciona un territorio en el mapa antes de abrir el árbol.';
    else if (yaInvestigandoGlobal) razonBloqueado = 'Ya tienes un territorio investigando este turno.';

    const handleConfirmar = async () => {
        if (!nodoSeleccionado) return;
        setEnviando(true);
        try {
            await investigarBackend(nodoSeleccionado.id, territorioInvestigador);
            setNodoSeleccionado(null);
        } finally {
            setEnviando(false);
        }
    };

    const renderNodo = (id, ramaKey) => {
        const data = catalogo?.[id];
        const isInvestigandoRama = ramaInvestigando === ramaKey;
        
        return (
            <NodoTecnologico
                key={id}
                techId={id}
                techData={{ ...data, icono: ICONOS[id] }}
                estado={getEstado(id)}
                isInvestigandoRama={isInvestigandoRama}
                onClickNodo={setNodoSeleccionado}
            />
        );
    };

    const nombreTerritorioActivo = territorioInvestigador
        ? (grafoGlobal?.get(territorioInvestigador)?.nombre || territorioInvestigador)
        : null;

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
                ) : (
                    <div className="ramas-grid">
                        {/* RAMA 1: Guerra Biológica */}
                        <div className="rama">
                            <h3 className="rama-titulo">⚗️ Guerra Biológica</h3>
                            <div className="estructura-rombo">
                                <div className="celda-completa">{renderNodo('gripe_aviar', 'biologica')}</div>
                                <div className="celda-izq">{renderNodo('vacuna_universal', 'biologica')}</div>
                                <div className="celda-der">{renderNodo('fatiga', 'biologica')}</div>
                                <div className="celda-completa">{renderNodo('coronavirus', 'biologica')}</div>
                            </div>
                        </div>

                        {/* RAMA 2: Operaciones & Logística */}
                        <div className="rama">
                            <h3 className="rama-titulo">🎯 Operaciones & Logística</h3>
                            <div className="estructura-y">
                                <div className="celda-completa">{renderNodo('academia_militar', 'logistica')}</div>
                                <div className="celda-izq">{renderNodo('inhibidor_senal', 'logistica')}</div>
                                <div className="celda-der">{renderNodo('propaganda_subversiva', 'logistica')}</div>
                                <div className="celda-izq">{renderNodo('muro_fronterizo', 'logistica')}</div>
                                <div className="celda-der">{renderNodo('sanciones_internacionales', 'logistica')}</div>
                            </div>
                        </div>

                        {/* RAMA 3: Artillería */}
                        <div className="rama">
                            <h3 className="rama-titulo">💣 Artillería</h3>
                            <div className="estructura-lineal-dual">
                                <div className="celda-completa">{renderNodo('mortero_tactico', 'artilleria')}</div>
                                <div className="celda-completa">{renderNodo('misil_crucero', 'artilleria')}</div>
                                <div className="celda-izq">{renderNodo('cabeza_nuclear', 'artilleria')}</div>
                                <div className="celda-der">{renderNodo('bomba_racimo', 'artilleria')}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {nodoSeleccionado && (
                <TooltipNodo
                    tech={nodoSeleccionado}
                    onConfirmar={handleConfirmar}
                    onCerrar={() => setNodoSeleccionado(null)}
                    puedeInvestigar={puedeInvestigar && !enviando}
                    razonBloqueado={enviando ? 'Enviando orden de investigación...' : razonBloqueado}
                />
            )}
        </div>
    );
};

export default PanelArbolTecnologico;
