import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/PanelArbolTecnologico.css';

// Definición del árbol con sus dependencias explícitas
const TECNOLOGIAS = {
    BIOLOGICA_1:    { id: 'BIOLOGICA_1',    nombre: 'Gripe Aviar',             icono: '🦠', requiere: [] },
    BIOLOGICA_2A:   { id: 'BIOLOGICA_2A',   nombre: 'Vacuna Universal',        icono: '💉', requiere: ['BIOLOGICA_1'] },
    BIOLOGICA_2B:   { id: 'BIOLOGICA_2B',   nombre: 'Fatiga',                  icono: '🥱', requiere: ['BIOLOGICA_1'] },
    BIOLOGICA_3:    { id: 'BIOLOGICA_3',    nombre: 'Coronavirus',             icono: '☣️', requiere: ['BIOLOGICA_2A', 'BIOLOGICA_2B'] }, // Requiere cualquiera

    OPERACIONES_1:  { id: 'OPERACIONES_1',  nombre: 'Academia Militar',        icono: '🎖️', requiere: [] },
    OPERACIONES_2A: { id: 'OPERACIONES_2A', nombre: 'Inhibidor de Señal',      icono: '📡', requiere: ['OPERACIONES_1'] },
    OPERACIONES_2B: { id: 'OPERACIONES_2B', nombre: 'Propaganda Subversiva',   icono: '📰', requiere: ['OPERACIONES_1'] },
    OPERACIONES_3A: { id: 'OPERACIONES_3A', nombre: 'Muro Fronterizo',         icono: '🧱', requiere: ['OPERACIONES_2A'] },
    OPERACIONES_3B: { id: 'OPERACIONES_3B', nombre: 'Sanciones Intern.',       icono: '📜', requiere: ['OPERACIONES_2B'] },

    ARTILLERIA_1:   { id: 'ARTILLERIA_1',   nombre: 'Mortero Táctico',         icono: '🪖', requiere: [] },
    ARTILLERIA_2:   { id: 'ARTILLERIA_2',   nombre: 'Misil de Crucero',        icono: '🚀', requiere: ['ARTILLERIA_1'] },
    ARTILLERIA_3A:  { id: 'ARTILLERIA_3A',  nombre: 'Cabeza Nuclear',          icono: '☢️', requiere: ['ARTILLERIA_2'] },
    ARTILLERIA_3B:  { id: 'ARTILLERIA_3B',  nombre: 'Bomba de Racimo',         icono: '💥', requiere: ['ARTILLERIA_2'] },
};

/**
 * Calcula el estado visual de un nodo: 'desbloqueado' | 'disponible' | 'bloqueado'
 * @param {Object} tech - Definición de la tecnología
 * @param {string[]} desbloqueadas - Lista de IDs desbloqueados por el jugador
 */
const calcularEstadoNodo = (tech, desbloqueadas) => {
    if (desbloqueadas.includes(tech.id)) return 'desbloqueado';
    if (tech.requiere.length === 0) return 'disponible';
    // Un nodo está disponible si AL MENOS UNO de sus requisitos está desbloqueado
    const requisitoCumplido = tech.requiere.some((req) => desbloqueadas.includes(req));
    return requisitoCumplido ? 'disponible' : 'bloqueado';
};

/**
 * Tooltip modal de confirmación de investigación.
 */
const TooltipNodo = ({ tech, onConfirmar, onCerrar, puedeInvestigar, razonBloqueado }) => (
    <div className="tooltip-nodo-overlay" onClick={onCerrar}>
        <div className="tooltip-nodo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tooltip-nodo-header">
                {/* Aqui va el icono cuando este disponible (img/assets) */}
                <span className="tooltip-icono">{tech.icono}</span>
                <h3 className="tooltip-titulo">{tech.nombre}</h3>
            </div>
            <p className="tooltip-descripcion">// rellenar con descripciones //</p>
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
 * Nodo individual del árbol: DESBLOQUEADO | DISPONIBLE | BLOQUEADO
 */
const NodoTecnologico = ({ tech, estado: estadoNodo, onClickNodo }) => {
    const clases = `nodo-tech nodo-${estadoNodo}`;
    const clickeable = estadoNodo !== 'bloqueado' && estadoNodo !== 'desbloqueado';

    return (
        <div
            className={clases}
            onClick={() => clickeable && onClickNodo(tech)}
            title={estadoNodo === 'bloqueado' ? 'Desbloquea los requisitos previos' : ''}
        >
            {/* Aqui va el icono cuando este disponible (img/assets) */}
            <span className="icono-nodo">{tech.icono}</span>
            <span className="nombre-nodo">{tech.nombre}</span>
            {estadoNodo === 'desbloqueado' && <span className="badge-nodo">✅</span>}
            {estadoNodo === 'bloqueado'     && <span className="badge-nodo">🔒</span>}
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
    const investigarBackend         = useGameStore((s) => s.investigarBackend);
    const faseActual                = useGameStore((s) => s.faseActual);
    const territorioInvestigando    = useGameStore((s) => s.territorioInvestigando);
    // Territorio que guardó ControlGestion antes de cerrarse
    const territorioInvestigandoPendiente = useGameStore((s) => s.territorioInvestigandoPendiente);
    // origenSeleccionado como fallback si el árbol se abre directamente
    const origenSeleccionado        = useGameStore((s) => s.origenSeleccionado);
    const grafoGlobal               = useGameStore((s) => s.grafoGlobal);

    if (!isArbolOpen) return null;

    // El territorio investigador es el pendiente (guardado antes del cierre del panel)
    // o el actualmente seleccionado en el mapa si se abrió el árbol directamente.
    const territorioInvestigador = territorioInvestigandoPendiente || origenSeleccionado;

    const estadoNodo = (tech) => calcularEstadoNodo(tech, tecnologiasDesbloqueadas);

    // Exclusión dual de artillería nivel 3
    const artilleria3AExcluida = tecnologiasDesbloqueadas.includes('ARTILLERIA_3B');
    const artilleria3BExcluida = tecnologiasDesbloqueadas.includes('ARTILLERIA_3A');

    // Razón de bloqueo para el tooltip
    const enFaseGestion          = faseActual === 'GESTION';
    const hayTerritorioActivo    = Boolean(territorioInvestigador);
    const yaInvestigandoGlobal   = Boolean(territorioInvestigando);
    const nodoYaDesbloqueado     = nodoSeleccionado && tecnologiasDesbloqueadas.includes(nodoSeleccionado.id);

    let razonBloqueado = null;
    if (!enFaseGestion)           razonBloqueado = 'Solo puedes investigar en la fase de Gestión.';
    else if (!hayTerritorioActivo) razonBloqueado = 'Selecciona un territorio en el mapa antes de abrir el árbol.';
    else if (yaInvestigandoGlobal) razonBloqueado = 'Ya tienes un territorio investigando este turno.';
    else if (nodoYaDesbloqueado)   razonBloqueado = 'Esta tecnología ya está desbloqueada.';

    const puedeInvestigar = enFaseGestion && hayTerritorioActivo && !yaInvestigandoGlobal && !nodoYaDesbloqueado;

    const nombreTerritorioActivo = territorioInvestigador
        ? (grafoGlobal?.get(territorioInvestigador)?.nombre || territorioInvestigador)
        : null;

    const handleConfirmar = async () => {
        if (!nodoSeleccionado) return;
        setEnviando(true);
        try {
            // investigarBackend usará territorioInvestigandoPendiente si no le pasamos el ID
            await investigarBackend(nodoSeleccionado.id, territorioInvestigador);
            setNodoSeleccionado(null);
        } finally {
            setEnviando(false);
        }
    };

    const renderNodo = (tech, excluida = false) => {
        if (excluida) {
            return (
                <div className="nodo-tech nodo-excluido" title="Tecnología alternativa ya elegida">
                    {/* Aqui va el icono cuando este disponible (img/assets) */}
                    <span className="icono-nodo">{tech.icono}</span>
                    <span className="nombre-nodo">{tech.nombre}</span>
                    <span className="badge-nodo">❌</span>
                </div>
            );
        }
        return (
            <NodoTecnologico
                key={tech.id}
                tech={tech}
                estado={estadoNodo(tech)}
                onClickNodo={setNodoSeleccionado}
            />
        );
    };

    return (
        <div className="panel-arbol-overlay">
            <div className="panel-arbol-contenedor">
                <button className="btn-cerrar-arbol" onClick={toggleArbol}>✕</button>
                <h2 className="arbol-titulo">Investigación y Desarrollo</h2>

                {/* Banner contextual */}
                <div className="arbol-contexto-banner">
                    {enFaseGestion && hayTerritorioActivo
                        ? <span>🔬 Territorio investigador: <b>{nombreTerritorioActivo}</b></span>
                        : enFaseGestion
                            ? <span>⚠️ Abre el árbol desde el panel de un territorio para investigar.</span>
                            : <span>ℹ️ Solo puedes investigar durante la fase de <b>Gestión</b>. (Modo consulta)</span>
                    }
                </div>

                <div className="ramas-grid">
                    {/* RAMA 1: Guerra Biológica — Rombo */}
                    <div className="rama">
                        <h3 className="rama-titulo">⚗️ Guerra Biológica</h3>
                        <div className="estructura-rombo">
                            <div className="celda-completa">{renderNodo(TECNOLOGIAS.BIOLOGICA_1)}</div>
                            <div className="celda-izq">{renderNodo(TECNOLOGIAS.BIOLOGICA_2A)}</div>
                            <div className="celda-der">{renderNodo(TECNOLOGIAS.BIOLOGICA_2B)}</div>
                            <div className="celda-completa">{renderNodo(TECNOLOGIAS.BIOLOGICA_3)}</div>
                        </div>
                    </div>

                    {/* RAMA 2: Operaciones & Logística — Y */}
                    <div className="rama">
                        <h3 className="rama-titulo">🎯 Operaciones & Logística</h3>
                        <div className="estructura-y">
                            <div className="celda-completa">{renderNodo(TECNOLOGIAS.OPERACIONES_1)}</div>
                            <div className="celda-izq">{renderNodo(TECNOLOGIAS.OPERACIONES_2A)}</div>
                            <div className="celda-der">{renderNodo(TECNOLOGIAS.OPERACIONES_2B)}</div>
                            <div className="celda-izq">{renderNodo(TECNOLOGIAS.OPERACIONES_3A)}</div>
                            <div className="celda-der">{renderNodo(TECNOLOGIAS.OPERACIONES_3B)}</div>
                        </div>
                    </div>

                    {/* RAMA 3: Artillería — Lineal con final dual */}
                    <div className="rama">
                        <h3 className="rama-titulo">💣 Artillería</h3>
                        <div className="estructura-lineal-dual">
                            <div className="celda-completa">{renderNodo(TECNOLOGIAS.ARTILLERIA_1)}</div>
                            <div className="celda-completa">{renderNodo(TECNOLOGIAS.ARTILLERIA_2)}</div>
                            <div className="celda-izq">{renderNodo(TECNOLOGIAS.ARTILLERIA_3A, artilleria3AExcluida)}</div>
                            <div className="celda-der">{renderNodo(TECNOLOGIAS.ARTILLERIA_3B, artilleria3BExcluida)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip de confirmación */}
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
