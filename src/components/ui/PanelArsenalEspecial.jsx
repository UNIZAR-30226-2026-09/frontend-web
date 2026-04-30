import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/PanelArsenalEspecial.css';

/**
 * Mapa local de emojis para los IDs de tecnología del backend.
 * El catálogo del backend no incluye iconos visuales, por lo que
 * los definimos aquí manteniendo coherencia con el árbol tecnológico.
 */
const ICONOS_TECNOLOGIA = {
    // Rama Biológica
    gripe_aviar:           '🦠',
    vacuna_universal:      '💉',
    fatiga:                '🥱',
    coronavirus:           '☣️',
    // Rama Operaciones / Logística
    academia_militar:      '🎖️',
    inhibidor_senal:       '📡',
    inhibidor_señal:       '📡', // alias con tilde
    propaganda_subversiva: '📰',
    muro_fronterizo:       '🧱',
    sanciones_internacionales: '📜',
    sanciones_intern:      '📜',
    // Rama Artillería
    mortero_tactico:       '🪖',
    mortero_táctico:       '🪖',
    misil_crucero:         '🚀',
    misil_de_crucero:      '🚀',
    cabeza_nuclear:        '☢️',
    bomba_racimo:          '💥',
    bomba_de_racimo:       '💥',
};

const getIcono = (id) => {
    const normalizado = id?.toLowerCase().replace(/ /g, '_');
    return ICONOS_TECNOLOGIA[normalizado] || ICONOS_TECNOLOGIA[id] || '⚡';
};

/**
 * Helper: busca una habilidad por ID en el catálogo, que puede tener dos formas:
 *   Forma A: Record<id, HabilidadOut>  (catálogo plano)
 *   Forma B: { ramas: { nombre_rama: HabilidadOut[] } }  (respuesta del endpoint)
 * @param {Object} catalogo - Catálogo de tecnologías del store
 * @param {string} id       - ID de la habilidad a buscar
 * @returns {Object|null}   - El objeto HabilidadOut, o null si no se encuentra
 */
const buscarEnCatalogo = (catalogo, id) => {
    if (!catalogo || !id) return null;
    const idLower = id.toLowerCase();
    // Forma A: objeto plano { [id]: HabilidadOut }
    if (catalogo[id]) return catalogo[id];
    if (catalogo[idLower]) return catalogo[idLower];
    // Forma B: { ramas: { biologica: [HabilidadOut] } }
    if (catalogo.ramas) {
        for (const habilidades of Object.values(catalogo.ramas)) {
            const encontrada = habilidades.find(h => h.id?.toLowerCase() === idLower);
            if (encontrada) return encontrada;
        }
    }
    return null;
};

/**
 * Panel lateral izquierdo del Arsenal.
 * Visible SOLO durante la Fase de ATAQUE_ESPECIAL cuando el jugador
 * tiene al menos una tecnología en `tecnologias_desbloqueadas`.
 *
 * Estas son las tecnologías que el jugador ya ha INVESTIGADO en turnos anteriores.
 * Aquí se EJECUTAN/COMPRAN con monedas usando POST .../comprar_tecnologia.
 * (No confundir con investigar del Árbol, que solo bloquea el territorio.)
 */
const PanelArsenalEspecial = () => {
    const [nodoAbierto, setNodoAbierto] = useState(null);
    const [comprando, setComprando] = useState(false);
    const [errorCompra, setErrorCompra] = useState(null);

    const faseActual               = useGameStore(s => s.faseActual);
    const turnoActual              = useGameStore(s => s.turnoActual);
    const jugadorLocal             = useGameStore(s => s.jugadorLocal);
    const tecnologiasDesbloqueadas = useGameStore(s => s.tecnologiasDesbloqueadas);
    const armasCompradas           = useGameStore(s => s.armasCompradas);
    const catalogoTecnologias      = useGameStore(s => s.catalogoTecnologias);
    const armaEspecialSeleccionada = useGameStore(s => s.armaEspecialSeleccionada);
    const haUsadoAtaqueEspecial    = useGameStore(s => s.haUsadoAtaqueEspecial);
    const monedas                  = useGameStore(s => s.monedas);
    const comprarTecnologiaBackend = useGameStore(s => s.comprarTecnologiaBackend);
    const prepararArmaEspecial     = useGameStore(s => s.prepararArmaEspecial);
    const cancelarAtaqueEspecial   = useGameStore(s => s.cancelarAtaqueEspecial);

    if (haUsadoAtaqueEspecial) return null;

    const esMiTurno = String(turnoActual) === String(jugadorLocal);

    // Solo visible en mi turno y durante la fase de ATAQUE_ESPECIAL
    if (!esMiTurno || faseActual !== 'ATAQUE_ESPECIAL') return null;
    if (!tecnologiasDesbloqueadas.length) return null;

    // Filtrar: solo las tecnologías que están en tecnologias_desbloqueadas Y en el catálogo.
    // Soporta ambas formas del catálogo: plana y { ramas: {...} }
    const habilidades = catalogoTecnologias
        ? tecnologiasDesbloqueadas
            .map(id => {
                const datos = buscarEnCatalogo(catalogoTecnologias, id);
                return datos ? { id, ...datos } : null;
            })
            .filter(Boolean)
        : tecnologiasDesbloqueadas.map(id => ({ id, nombre: id, precio: 0, descripcion: '' }));

    if (!habilidades.length) return null;

    const handleComprar = async (tech) => {
        setComprando(true);
        setErrorCompra(null);
        try {
            await comprarTecnologiaBackend(tech.id);
            setNodoAbierto(null);
        } catch (e) {
            const msg = e?.message || 'No se pudo realizar la compra.';
            setErrorCompra(msg);
        } finally {
            setComprando(false);
        }
    };

    const handleToggleNodo = (id) => {
        setNodoAbierto(prev => (prev === id ? null : id));
        setErrorCompra(null);
    };

    const tecActivaInfo = armaEspecialSeleccionada
        ? buscarEnCatalogo(catalogoTecnologias, armaEspecialSeleccionada)
        : null;

    return (
        <div className="panel-arsenal-lateral">
            {/* Cabecera */}
            <div className="arsenal-header">
                <span className="arsenal-titulo-icono">⚔️</span>
                <span className="arsenal-titulo-texto">Arsenal</span>
            </div>

            {/* Banner: modo selección de objetivo activo */}
            {armaEspecialSeleccionada && (
                <div className="arsenal-modo-objetivo-banner">
                    <span>{getIcono(armaEspecialSeleccionada)}</span>
                    <span style={{ fontSize: '0.55rem' }}>
                        {tecActivaInfo?.nombre || armaEspecialSeleccionada}
                    </span>
                    <span style={{ fontSize: '0.5rem' }}>
                        {tecActivaInfo?.rango === null ? 'Selecciona objetivo' : 'Selecciona origen'}
                    </span>
                    <button
                        className="btn-arsenal-cancelar-pequeño"
                        onClick={cancelarAtaqueEspecial}
                        title="Cancelar ataque especial"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Lista de habilidades */}
            <div className="arsenal-lista">
                {habilidades.map(tech => {
                    const icono      = getIcono(tech.id);
                    const esteActivo = armaEspecialSeleccionada === tech.id;
                    const sinDinero  = monedas < tech.precio;
                    const popAbierto = nodoAbierto === tech.id;
                    const yaComprada = armasCompradas.includes(tech.id.toLowerCase());

                    return (
                        <div
                            key={tech.id}
                            className={`arsenal-item-wrapper ${esteActivo ? 'arsenal-item-activo' : ''}`}
                        >
                            {/* Botón icono */}
                            <button
                                className={`btn-arsenal-icono ${esteActivo ? 'activo' : ''}`}
                                style={{ 
                                    filter: yaComprada ? 'none' : 'grayscale(100%)', 
                                    opacity: yaComprada ? 1 : 0.75 
                                }}
                                onClick={() => !armaEspecialSeleccionada && handleToggleNodo(tech.id)}
                                title={`${tech.nombre} — ${yaComprada ? 'Lista para usar' : `${tech.precio} 💰`}`}
                                disabled={!!armaEspecialSeleccionada && !esteActivo}
                            >
                                <span className="arsenal-emoji">{icono}</span>
                            </button>

                            {/* Popover de detalle y compra */}
                            {popAbierto && !preparandoAtaqueEspecial && (
                                <div className="arsenal-popover">
                                    <div className="arsenal-popover-header">
                                        <span className="arsenal-popover-icono">{icono}</span>
                                        <h4 className="arsenal-popover-nombre">{tech.nombre}</h4>
                                    </div>

                                    <p className="arsenal-popover-desc">
                                        {tech.descripcion || 'Sin descripción disponible.'}
                                    </p>

                                    <div className="arsenal-popover-precio">
                                        💰 <strong>{tech.precio}</strong> monedas
                                        {sinDinero && (
                                            <span className="arsenal-fondos-insuf"> (Insuficiente)</span>
                                        )}
                                    </div>

                                    {errorCompra && (
                                        <p style={{
                                            color: '#FC8181',
                                            fontSize: '0.7rem',
                                            marginBottom: '0.5rem',
                                            background: 'rgba(229,62,62,0.1)',
                                            padding: '4px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            ⚠️ {errorCompra}
                                        </p>
                                    )}

                                    <div className="arsenal-popover-botones">
                                        {!yaComprada ? (
                                            <button
                                                className="btn-arsenal-comprar"
                                                onClick={() => handleComprar(tech)}
                                                disabled={sinDinero || comprando}
                                                title={sinDinero ? 'Monedas insuficientes' : `Comprar ${tech.nombre}`}
                                            >
                                                {comprando ? '⏳ Comprando...' : `💰 Comprar`}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-arsenal-comprar"
                                                onClick={() => {
                                                    prepararArmaEspecial(tech.id);
                                                    setNodoAbierto(null);
                                                }}
                                                title={`Preparar ${tech.nombre}`}
                                                style={{ backgroundColor: '#4C51BF' }}
                                            >
                                                ⚔️ Usar
                                            </button>
                                        )}
                                        <button
                                            className="btn-arsenal-cerrar-pop"
                                            onClick={() => setNodoAbierto(null)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PanelArsenalEspecial;
