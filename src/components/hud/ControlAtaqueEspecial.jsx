import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/gameStore';
import '../../styles/ControlAtaqueEspecial.css';

// Iconos por ID
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
    bomba_racimo: '💥',
};

const getIcono = (id) => {
    const norm = id?.toLowerCase().replace(/ /g, '_');
    return ICONOS[norm] || ICONOS[id] || '⚡';
};

// Helper: busca en ambas formas del catálogo
const buscarEnCatalogo = (catalogo, id) => {
    if (!catalogo || !id) return null;
    const idLower = id.toLowerCase();
    if (catalogo[id]) return { id, ...catalogo[id] };
    if (catalogo[idLower]) return { id, ...catalogo[idLower] };
    if (catalogo.ramas) {
        for (const habilidades of Object.values(catalogo.ramas)) {
            const encontrada = habilidades.find(h => h.id?.toLowerCase() === idLower);
            if (encontrada) return encontrada;
        }
    }
    return null;
};

// Recorre el catálogo y construye la lista de habilidades visibles
/**
 * Una habilidad aparece en el Arsenal si:
 *   A) predesbloqueada === true  (la investigación ha avanzado, lista para comprar)
 *   B) Su ID está en tecnologias_desbloqueadas del jugador local
 */
const obtenerHabilidadesDisponibles = (catalogo, desbloqueadas) => {
    if (!catalogo) return [];
    const desbNorm = (desbloqueadas || []).map(t => t.toLowerCase());
    const result = [];

    const procesar = (hab) => {
        const idNorm = (hab.id || '').toLowerCase();
        if (hab.predesbloqueada || desbNorm.includes(idNorm)) {
            result.push(hab);
        }
    };

    if (catalogo.ramas) {
        for (const habilidades of Object.values(catalogo.ramas)) {
            habilidades.forEach(procesar);
        }
    } else {
        for (const [id, tech] of Object.entries(catalogo)) {
            procesar({ id, ...tech });
        }
    }
    return result;
};

// Tooltip flotante con position:fixed que aparece a la derecha del icono
const TooltipArsenal = ({ hab, monedas, comprando, onComprar, onCerrar, tooltipX, tooltipY }) => {
    const sinDinero = monedas !== null && monedas < (hab.precio ?? 0);

    return createPortal(
        <div
            className="arsenal-tooltip"
            role="dialog"
            aria-label={hab.nombre}
            style={{ position: 'fixed', left: `${tooltipX}px`, top: `${tooltipY}px`, transform: 'translateY(-50%)', zIndex: 9999 }}
        >
            {/* Flecha izquierda (apunta al icono) */}
            <div className="arsenal-tooltip-flecha" aria-hidden="true" />

            <div className="arsenal-tooltip-header">
                <span className="arsenal-tooltip-icono">{getIcono(hab.id)}</span>
                <h4 className="arsenal-tooltip-nombre">{hab.nombre || hab.id}</h4>
            </div>

            <p className="arsenal-tooltip-desc">
                {hab.descripcion || 'Sin descripción disponible.'}
            </p>

            <div className="arsenal-tooltip-precio">
                💰 <strong>{hab.precio ?? '—'}</strong> monedas
                {sinDinero && (
                    <span className="arsenal-tooltip-insuf"> (Insuf.)</span>
                )}
            </div>

            <div className="arsenal-tooltip-botones">
                <button
                    className="btn-arsenal-comprar"
                    onClick={() => onComprar(hab.id)}
                    disabled={sinDinero || comprando}
                    title={sinDinero ? 'Monedas insuficientes' : `Ejecutar ${hab.nombre}`}
                >
                    {comprando ? '⏳' : '⚔️ Comprar'}
                </button>
                <button
                    className="btn-arsenal-cerrar"
                    onClick={onCerrar}
                    title="Cerrar"
                >
                    ✕
                </button>
            </div>
        </div>,
        document.body
    );
};

// Botón icono individual
const BtnIcono = ({ hab, monedas, onSeleccionar, esActivo, preparandoEsteAtaque }) => {
    const sinDinero = monedas !== null && monedas < (hab.precio ?? 0);
    const icono = getIcono(hab.id);

    const clases = [
        'arsenal-btn-icono',
        esActivo ? 'arsenal-btn-activo' : '',
        sinDinero ? 'arsenal-btn-pobre' : '',
        preparandoEsteAtaque ? 'arsenal-btn-preparando' : '',
    ].filter(Boolean).join(' ');

    return (
        <button
            className={clases}
            onClick={(e) => onSeleccionar(hab.id, e)}
            title={`${hab.nombre} — ${hab.precio ?? 0} 💰`}
            aria-pressed={esActivo}
            aria-label={hab.nombre}
        >
            <span className="arsenal-icono-emoji">{icono}</span>
            {sinDinero && <span className="arsenal-btn-badge-pobre" aria-hidden="true">✕</span>}
            {preparandoEsteAtaque && <span className="arsenal-btn-badge-activo" aria-hidden="true">🎯</span>}
        </button>
    );
};

// Componente principal
/**
 * Arsenal de Ataques Especiales.
 * Barra vertical lateral izquierda visible solo en fase ATAQUE_ESPECIAL.
 * Muestra las habilidades que el jugador puede ejecutar (predesbloqueadas o desbloqueadas).
 * Al hacer hover/click en un icono aparece un tooltip con info y botón de compra.
 */
const ControlAtaqueEspecial = () => {
    const [seleccionado, setSeleccionado] = useState(null); // id del icono con tooltip abierto
    const [tooltipX, setTooltipX] = useState(0);
    const [tooltipY, setTooltipY] = useState(0);
    const [comprando, setComprando] = useState(false);
    const [error, setError] = useState(null);
    const panelRef = useRef(null);

    const faseActual = useGameStore(s => s.faseActual);
    const turnoActual = useGameStore(s => s.turnoActual);
    const jugadorLocal = useGameStore(s => s.jugadorLocal);
    const catalogoTecnologias = useGameStore(s => s.catalogoTecnologias);
    const tecnologiasDesbloqueadas = useGameStore(s => s.tecnologiasDesbloqueadas);
    const monedas = useGameStore(s => s.monedas);
    const preparandoAtaqueEspecial = useGameStore(s => s.preparandoAtaqueEspecial);
    const comprarYPrepararAtaque = useGameStore(s => s.comprarYPrepararAtaque);
    const cancelarAtaqueEspecial = useGameStore(s => s.cancelarAtaqueEspecial);

    const esMiTurno = String(turnoActual) === String(jugadorLocal);

    useEffect(() => {
        const handleClickFuera = (e) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target) &&
                !e.target.closest('.arsenal-tooltip')
            ) {
                setSeleccionado(null);
            }
        };
        document.addEventListener('mousedown', handleClickFuera);
        return () => document.removeEventListener('mousedown', handleClickFuera);
    }, []);

    // Guard clauses
    if (faseActual !== 'ATAQUE_ESPECIAL') return null;
    if (!esMiTurno) return null;

    // Construir lista de habilidades visibles
    const habilidades = obtenerHabilidadesDisponibles(catalogoTecnologias, tecnologiasDesbloqueadas);
    if (!habilidades.length) return null;

    const habSeleccionada = seleccionado
        ? buscarEnCatalogo(catalogoTecnologias, seleccionado)
        : null;

    // Handlers
    const handleSeleccionar = (id, event) => {
        setError(null);
        if (seleccionado === id) {
            setSeleccionado(null);
            return;
        }
        if (event?.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltipX(rect.right + 12);
            setTooltipY(rect.top + rect.height / 2);
        }
        setSeleccionado(id);
    };

    const handleComprar = async (id) => {
        setComprando(true);
        setError(null);
        try {
            await comprarYPrepararAtaque(id);
            setSeleccionado(null); // cierra tooltip tras comprar
        } catch (e) {
            setError(e?.message || 'No se pudo ejecutar la habilidad.');
        } finally {
            setComprando(false);
        }
    };

    const handleCerrarTooltip = () => {
        setSeleccionado(null);
        setError(null);
    };

    return (
        <div className="arsenal-panel-lateral" ref={panelRef} role="complementary" aria-label="Arsenal de ataques especiales">

            {/* Cabecera */}
            <div className="arsenal-panel-header">
                <span className="arsenal-panel-titulo-icono" aria-hidden="true">⚔️</span>
            </div>

            {/* Modo: objetivo seleccionado (preparando ataque) */}
            {preparandoAtaqueEspecial && (
                <div className="arsenal-modo-activo" title="Haz click en un territorio enemigo para lanzar el ataque">
                    <span className="arsenal-modo-icono">{getIcono(preparandoAtaqueEspecial)}</span>
                    <span className="arsenal-modo-texto">Selecciona objetivo</span>
                    <button
                        className="arsenal-btn-cancelar-modo"
                        onClick={cancelarAtaqueEspecial}
                        title="Cancelar ataque"
                        aria-label="Cancelar ataque especial"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Lista de iconos */}
            <ul className="arsenal-lista-iconos" role="list">
                {habilidades.map(hab => {
                    const esActivo = seleccionado === hab.id;
                    const preparandoEste = preparandoAtaqueEspecial === hab.id;
                    const deshabilitado = !!preparandoAtaqueEspecial && !preparandoEste;

                    return (
                        <li key={hab.id} className="arsenal-item" role="listitem">
                            <BtnIcono
                                hab={hab}
                                monedas={monedas}
                                esActivo={esActivo}
                                preparandoEsteAtaque={preparandoEste}
                                onSeleccionar={deshabilitado ? () => { } : handleSeleccionar}
                            />

                            {/* Tooltip flotante derecha con posición absoluta */}
                            {esActivo && habSeleccionada && !preparandoAtaqueEspecial && (
                                <TooltipArsenal
                                    hab={habSeleccionada}
                                    monedas={monedas}
                                    comprando={comprando}
                                    onComprar={handleComprar}
                                    onCerrar={handleCerrarTooltip}
                                    tooltipX={tooltipX}
                                    tooltipY={tooltipY}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>

            {/* Error de compra */}
            {error && (
                <div className="arsenal-error" role="alert">
                    ⚠️ {error}
                </div>
            )}

            {/* Monedas disponibles  */}
            {monedas !== null && (
                <div className="arsenal-monedas" title="Monedas disponibles">
                    💰 {monedas}
                </div>
            )}
        </div>
    );
};

export default ControlAtaqueEspecial;
