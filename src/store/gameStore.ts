// src/store/gameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EstadoJuego, FaseJuego } from '../types/game.types';
import { calcularComarcasEnRango, construirGrafoComarcas } from '../utils/graphUtils';
import { ComarcaDTO } from '../types/mapa.types';
import { fetchApi } from '../services/api';
import { gameApi } from '../services/gameApi';
import { useAuthStore } from './useAuthStore';
import { socketService } from '../services/socketService';

// Helpers internos

/**
 * Compara dos identificadores de jugador ignorando mayúsculas.
 */
const esMismoJugador = (j1: string | null, j2: string | null): boolean => {
    if (!j1 || !j2) return false;
    return String(j1).toLowerCase() === String(j2).toLowerCase();
};

/**
 * Normaliza la fase del backend al formato del frontend.
 * @param {string} faseBackend - String en snake_case.
 * @returns {FaseJuego} Fase convertida a mayúsculas.
 */
const normalizarFase = (faseBackend: string): FaseJuego =>
    faseBackend.toUpperCase() as FaseJuego;

/**
 * Extrae tropas y propietarios del mapa del backend.
 * @param {Record<string, any>} mapa - Datos físicos de las comarcas.
 * @returns {{ tropas: Record<string, number>; propietarios: Record<string, string> }}
 */
const parsearMapa = (
    mapa: Record<string, any>
): {
    tropas: Record<string, number>;
    propietarios: Record<string, string>;
    estadosBloqueo: Record<string, string | null>;
    estadosAlterados: Record<string, string[]>;
} => {
    const tropas: Record<string, number> = {};
    const propietarios: Record<string, string> = {};
    const estadosBloqueo: Record<string, string | null> = {};
    const estadosAlterados: Record<string, string[]> = {};

    for (const [id, t] of Object.entries(mapa)) {
        tropas[id] = t.units;
        propietarios[id] = t.owner_id;
        estadosBloqueo[id] = t.estado_bloqueo || null;

        // El backend manda un array de objetos en "efectos". Extraemos solo el "tipo_efecto".
        if (t.efectos && Array.isArray(t.efectos)) {
            estadosAlterados[id] = t.efectos.map((e: any) => e.tipo_efecto);
        } else {
            estadosAlterados[id] = [];
        }
    }
    return { tropas, propietarios, estadosBloqueo, estadosAlterados };
};


/**
 * Procesa el diccionario de jugadores para asignar colores y detectar la reserva local.
 * @param {Record<string, any>} jugadores - Diccionario de jugadores por username.
 * @param {string | null} jugadorLocalActual - Username actual almacenado.
 * @param {string | null} turnoActual - Username del jugador que tiene el turno.
 * @returns {{ coloresJugadores: Record<string, string>; tropasReservaLocal: number | null; tropasReservaActivo: number | null; jugadorLocalId: string | null; }}
 */
const parsearJugadores = (
    jugadores: Record<string, any>,
    jugadorLocalActual: string | null,
    turnoActual: string | null
): {
    coloresJugadores: Record<string, string>;
    tropasReservaLocal: number | null;
    tropasReservaActivo: number | null;
    jugadorLocalId: string | null;
    monedasLocal: number | null;
    tecnologiasLocal: string[] | null;
    armasCompradasLocal: string[] | null;
    territorioTrabajandoLocal: string | null;
    territorioInvestigandoLocal: string | null;
    ramaInvestigandoLocal: string | null;
} => {
    const MAP_COLORS = [
        'var(--color-jugador-1)',
        'var(--color-jugador-2)',
        'var(--color-jugador-3)',
        'var(--color-jugador-4)',
    ];

    const coloresJugadores: Record<string, string> = {};
    let tropasReservaLocal: number | null = null;
    let tropasReservaActivo: number | null = null;
    let monedasLocal: number | null = null;
    let tecnologiasLocal: string[] | null = null;
    let armasCompradasLocal: string[] | null = null;
    let territorioTrabajandoLocal: string | null = null;
    let territorioInvestigandoLocal: string | null = null;
    let ramaInvestigandoLocal: string | null = null;

    const miUsername =
        useAuthStore.getState().user?.username ??
        useAuthStore.getState().user?.nombre_usuario ??
        jugadorLocalActual ??
        '';

    for (const [username, info] of Object.entries<any>(jugadores)) {
        // Color: preferimos el del backend.
        if (info.color) {
            coloresJugadores[username] = info.color;
        } else if (info.numero_jugador !== undefined) {
            coloresJugadores[username] =
                MAP_COLORS[(info.numero_jugador - 1) % MAP_COLORS.length];
        }

        // Datos del jugador local (Matching robusto case-insensitive)
        if (esMismoJugador(username, miUsername)) {
            if (info.tropas_reserva !== undefined) tropasReservaLocal = info.tropas_reserva;
            if (info.monedas !== undefined) monedasLocal = info.monedas;
            if (info.tecnologias_predesbloqueadas !== undefined) tecnologiasLocal = info.tecnologias_predesbloqueadas;
            if (info.tecnologias_compradas !== undefined) armasCompradasLocal = info.tecnologias_compradas;
            if (info.territorio_trabajando !== undefined) territorioTrabajandoLocal = info.territorio_trabajando;
            if (info.territorio_investigando !== undefined) territorioInvestigandoLocal = info.territorio_investigando;
            if (info.rama_investigando !== undefined) ramaInvestigandoLocal = info.rama_investigando;
        }

        // Si es el jugador del turno, guardamos su reserva para que todos la vean
        if (esMismoJugador(username, turnoActual) && info.tropas_reserva !== undefined) {
            tropasReservaActivo = info.tropas_reserva;
        }
    }

    return {
        coloresJugadores,
        tropasReservaLocal,
        tropasReservaActivo,
        jugadorLocalId: miUsername || null,
        monedasLocal,
        tecnologiasLocal,
        armasCompradasLocal,
        territorioTrabajandoLocal,
        territorioInvestigandoLocal,
        ramaInvestigandoLocal
    };
};

/**
 * Convierte un objeto de log del backend (formato docs/logs_partida.md) en una frase
 * legible para mostrar en el panel LogPartida.
 * Soporta todos los tipo_evento definidos en la documentación.
 */
const logEntradaAFrase = (log: any): string => {
    const d = log.datos || {};
    const user = log.user ?? '?';
    switch ((log.tipo_evento || '').toLowerCase()) {
        case 'cambio_turno':
            return `🔄 Turno de ${d.turno_de || user}`;
        case 'ataque_convencional': {
            const victoria = d.victoria ? ' ¡Conquista!' : '';
            return `⚔️ ${user} atacó ${d.origen || '?'} → ${d.destino || '?'} (bajas: ${d.bajas_atacante ?? 0}/${d.bajas_defensor ?? 0})${victoria}`;
        }
        case 'conquista':
            return `🏴 ${user} conquistó ${d.territorio_conquistado || '?'} (antes de ${d.anterior_dueno || '?'})`;
        case 'ataque_especial':
            return `💥 ${user} lanzó ${d.tipo_ataque || '?'} sobre ${d.destino || '?'}`;
        case 'jugador_eliminado':
            return `💀 ${d.eliminado || user} ha sido eliminado`;
        case 'fin_partida':
            return `🏆 Partida terminada — Ganador: ${d.ganador || user}`;
        default:
            return `📋 [${log.tipo_evento}] ${user}`;
    }
};

// Store
export const useGameStore = create<EstadoJuego>()(
    persist(
        (set, get) => ({

            // Mapa estructural
            grafoGlobal: null,
            mapaEstatico: null,
            errorMapaEstatico: null,

            // Estado de partida
            faseActual: null,
            finFaseUtc: null,
            modoVista: 'COMARCAS',
            estadoPartidaLocal: 'JUGANDO',
            monedas: 0,
            estadosBloqueo: {},
            estadosAlterados: {},
            tropasDisponibles: null,
            movimientoRealizadoEnTurno: false,
            mensajeErrorGlobal: null,
            historialLog: [],

            // Jugador local
            jugadorLocal: null,
            turnoActual: null,
            jugadores: [],
            diccionarioJugadores: {},

            // Sala / lobby
            salaActiva: { id: null, codigoInvitacion: null, estado: null, config_max_players: null },
            jugadoresLobby: [],
            esCreadorSala: false,

            // Estado dinámico del mundo
            tropas: {},
            propietarios: {},
            coloresJugadores: {},

            // UI de selección e interacción
            origenSeleccionado: null,
            destinoSeleccionado: null,
            popupCoords: null,
            comarcasResaltadas: [],
            regionHover: null,
            comarcaRefuerzo: null,
            tropasAAsignar: 0,
            mostrarAnimacionRefuerzos: false,
            refuerzosRecibidos: 0,
            isArbolTecnologicoOpen: false,
            tecnologiasDesbloqueadas: [],
            armasCompradas: [],
            armaEspecialSeleccionada: null,
            territorioTrabajando: null,
            territorioInvestigando: null,
            ramaInvestigando: null,
            territorioInvestigandoPendiente: null,
            isSocketConnected: false,
            catalogoTecnologias: null,
            preparandoAtaqueEspecial: null,

            preparandoAtaque: false,
            movimientoConquistaPendiente: false,
            origenConquista: null,
            destinoConquista: null,
            preparandoFortificacion: false,

            // UI - Votación Pausa
            faseVotacionPausa: 'ninguna',
            jugadorSolicitantePausa: null,
            // ACCIONES — MAPA ESTÁTICO

            /**
             * Descarga el mapa estático del backend y lo almacena.
             */
            cargarMapaEstatico: async () => {
                try {
                    set({ errorMapaEstatico: null });
                    const data = await fetchApi('/v1/mapa');
                    set({ mapaEstatico: data });
                } catch (error) {
                    console.error('[cargarMapaEstatico] Error:', error);
                    set({ errorMapaEstatico: 'Fallo de conexión al descargar cartografía.' });
                }
            },

            /**
             * Construye el grafo de adyacencias a partir de los datos del mapa.
             * @param {ComarcaDTO[]} rawData - Lista de comarcas descargadas.
             */
            inicializarJuego: (rawData: ComarcaDTO[]) => {
                try {
                    const grafo = construirGrafoComarcas(rawData);
                    set({ grafoGlobal: grafo });
                    console.log('[inicializarJuego] Grafo inicializado.');
                } catch (error) {
                    console.error('[inicializarJuego] Error al construir grafo:', error);
                }
            },

            // Muestra un error flotante en la UI
            mostrarErrorGlobal: (mensaje: string) => {
                set({ mensajeErrorGlobal: mensaje });
                setTimeout(() => {
                    set((state) => state.mensajeErrorGlobal === mensaje ? { mensajeErrorGlobal: null } : state);
                }, 3000);
            },

            // Añade un mensaje al log de eventos (máximo 50 mensajes)
            agregarMensajeLog: (mensaje: string) => {
                set((state) => {
                    const nuevoHistorial = [mensaje, ...state.historialLog].slice(0, 50);
                    return { historialLog: nuevoHistorial };
                });
            },

            // Carga el historial de logs de la partida desde el backend (para reconexiones/F5)
            // Formato según docs/logs_partida.md: tipo_evento, user, datos
            cargarLogsPartida: async (overrideId?: number | string) => {
                const idToUse = overrideId || get().salaActiva?.id;
                console.log(`[cargarLogsPartida] Solicitando logs para partida: ${idToUse}`);
                if (!idToUse) {
                    console.warn('[cargarLogsPartida] ⚠️ No hay ID de partida disponible');
                    return;
                }
                try {
                    const logs: any[] = await fetchApi(`/v1/partidas/${idToUse}/logs`);
                    console.log(`[cargarLogsPartida] ✅ Respuesta del backend:`, logs);
                    if (!Array.isArray(logs) || logs.length === 0) {
                        console.log('[cargarLogsPartida] ℹ️ El endpoint devolvió 0 logs (array vacío)');
                        return;
                    }

                    // La API devuelve más reciente primero (según el doc)
                    const frases = logs.map(logEntradaAFrase);
                    console.log(`[cargarLogsPartida] 📋 Frases generadas:`, frases);
                    set({ historialLog: frases.slice(0, 50) });
                } catch (error) {
                    console.error('[cargarLogsPartida] ❌ Error al llamar al endpoint:', error);
                }
            },

            // ACCIONES — SINCRONIZACIÓN CON BACKEND

            /**
             * Recupera el estado completo de la partida desde el endpoint REST.
             * Endpoint: GET /v1/partidas/{partida_id}/estado
             *
             * Se usa para:
             *   - Recargar estado tras reconexión WebSocket.
             *   - Recuperar partida tras F5 (recarga de página).
             *   - Resolver inconsistencias entre UI y servidor.
             * 
             * @param {number|string} [overrideId] - ID Forzado para recuperar partida tras recarga.
             */
            sincronizarEstadoPartida: async (overrideId?: number | string) => {
                const idToSync = overrideId || get().salaActiva?.id;
                if (!idToSync) return;

                // Si es una reconexión por F5, aseguramos que el ID se guarde en el store
                if (overrideId && get().salaActiva?.id !== overrideId) {
                    set((state) => ({
                        salaActiva: { ...state.salaActiva, id: Number(overrideId) }
                    }));
                }

                try {
                    const data = await fetchApi(`/v1/partidas/${idToSync}/estado`);
                    get().setEstadoDinamico(data);
                    console.log('[sincronizarEstadoPartida] Estado sincronizado con éxito.');
                } catch (error) {
                    console.error('[sincronizarEstadoPartida] Error al sincronizar:', error);
                }
            },

            setEstadoDinamico: (payload: any) => {
                const { tropas, propietarios, estadosBloqueo, estadosAlterados } = payload.mapa
                    ? parsearMapa(payload.mapa)
                    : { tropas: get().tropas, propietarios: get().propietarios, estadosBloqueo: get().estadosBloqueo, estadosAlterados: get().estadosAlterados };

                const {
                    coloresJugadores,
                    tropasReservaLocal: _,
                    tropasReservaActivo,
                    jugadorLocalId,
                    monedasLocal,
                    tecnologiasLocal,
                    armasCompradasLocal,
                    territorioTrabajandoLocal,
                    territorioInvestigandoLocal,
                    ramaInvestigandoLocal
                } = payload.jugadores
                        ? parsearJugadores(payload.jugadores, get().jugadorLocal, payload.turno_de ?? get().turnoActual)
                        : {
                            coloresJugadores: get().coloresJugadores,
                            tropasReservaLocal: null,
                            tropasReservaActivo: null,
                            jugadorLocalId: get().jugadorLocal,
                            monedasLocal: null,
                            tecnologiasLocal: null,
                            armasCompradasLocal: null,
                            territorioTrabajandoLocal: null,
                            territorioInvestigandoLocal: null,
                            ramaInvestigandoLocal: null,
                        };

                set((state) => ({
                    faseActual: payload.fase_actual
                        ? normalizarFase(payload.fase_actual)
                        : state.faseActual,
                    finFaseUtc: payload.fin_fase_utc ?? state.finFaseUtc,
                    // Soportar múltiples claves de turno para robustez
                    turnoActual: payload.turno_de ?? payload.jugador_activo ?? payload.turno_actual ?? state.turnoActual,
                    ...(payload.mapa && { tropas, propietarios, estadosBloqueo, estadosAlterados }),
                    coloresJugadores: {
                        ...state.coloresJugadores,
                        ...coloresJugadores,
                    },
                    ...(tropasReservaActivo !== null && {
                        tropasDisponibles: tropasReservaActivo,
                    }),
                    jugadorLocal: jugadorLocalId ?? state.jugadorLocal,
                    diccionarioJugadores: payload.jugadores ?? state.diccionarioJugadores,
                    jugadores: payload.jugadores
                        ? Object.keys(payload.jugadores)
                        : state.jugadores,
                    monedas: monedasLocal ?? (typeof payload.monedas === 'number' ? payload.monedas : (payload.recursos?.monedas ?? state.monedas)),
                    tecnologiasDesbloqueadas: (tecnologiasLocal ?? payload.tecnologias_predesbloqueadas ?? state.tecnologiasDesbloqueadas).map((t: string) => t.toLowerCase()),
                    armasCompradas: (armasCompradasLocal ?? payload.tecnologias_compradas ?? state.armasCompradas).map((t: string) => t.toLowerCase()),
                    territorioTrabajando: territorioTrabajandoLocal ?? payload.territorio_trabajando ?? state.territorioTrabajando,
                    territorioInvestigando: territorioInvestigandoLocal ?? payload.territorio_investigando ?? state.territorioInvestigando,
                    ramaInvestigando: ramaInvestigandoLocal ?? payload.rama_investigando ?? state.ramaInvestigando,
                }));
            },

            setEstadoPartidaLocal: (nuevoEstado: any) => set({ estadoPartidaLocal: nuevoEstado }),

            // ACCIONES — UI

            toggleModoVista: () =>
                set((state) => ({
                    modoVista: state.modoVista === 'COMARCAS' ? 'REGIONES' : 'COMARCAS',
                    // Limpiar todas las selecciones al cambiar de modo visual
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    comarcasResaltadas: [],
                    popupCoords: null,
                    preparandoAtaque: false,
                    preparandoFortificacion: false,
                    comarcaRefuerzo: null,
                })),

            toggleArbolTecnologico: () =>
                set((state) => ({
                    isArbolTecnologicoOpen: !state.isArbolTecnologicoOpen,
                })),

            setTecnologiasDesbloqueadas: (techs: string[]) =>
                set({ tecnologiasDesbloqueadas: techs }),

            investigarBackend: async (tecnologiaId: string, territorioId?: string) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                // Usar el territorio pasado directamente, o el que se guardó al abrir el árbol
                const territorio = territorioId || estado.territorioInvestigandoPendiente;
                if (!territorio) {
                    console.warn('[investigarBackend] No hay territorio asignado para investigar.');
                    return;
                }
                try {
                    await gameApi.investigarTecnologia(estado.salaActiva.id, territorio, tecnologiaId);
                    set({ territorioInvestigando: territorio, territorioInvestigandoPendiente: null });
                    await get().sincronizarEstadoPartida();
                } catch (error) {
                    console.error('[investigarBackend] Error al investigar tecnología:', error);
                    alert("No se pudo investigar. Asegúrate de ser tu turno.");
                }
            },

            trabajarBackend: async (territorioId: string) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                try {
                    await gameApi.trabajarTerritorio(estado.salaActiva.id, territorioId);
                    set({ territorioTrabajando: territorioId });
                    await get().sincronizarEstadoPartida();
                } catch (error) {
                    console.error('[trabajarBackend] Error al ordenar trabajo:', error);
                    alert("El territorio no puede trabajar en este momento.");
                }
            },

            setRegionHover: (regionId: string | null) => set({ regionHover: regionId }),

            limpiarSeleccion: () =>
                set({
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    comarcasResaltadas: [],
                    popupCoords: null,
                    preparandoAtaque: false,
                    preparandoFortificacion: false,
                    preparandoAtaqueEspecial: null,
                }),

            cerrarAnimacionRefuerzos: () => set({ mostrarAnimacionRefuerzos: false }),

            setFase: (nuevaFase: FaseJuego) =>
                set({
                    faseActual: nuevaFase,
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    comarcasResaltadas: [],
                    popupCoords: null,
                }),

            setTropas: (nuevasTropas: Record<string, number>) => set({ tropas: nuevasTropas }),

            setEstadoMundo: (
                nuevosPropietarios: Record<string, string>,
                nuevosColores: Record<string, string>
            ) => set({ propietarios: nuevosPropietarios, coloresJugadores: nuevosColores }),

            // ACCIONES — REFUERZO (colocación de tropas)

            /**
             * Ajusta cuántas tropas se pre-asignarán en la comarca seleccionada.
             * Valida que la cantidad esté en el rango [0, tropasDisponibles].
             */
            setTropasAAsignar: (cantidad: number) => {
                set((state) => {
                    const disponibles = state.tropasDisponibles ?? 0;
                    if (cantidad < 1 || cantidad > disponibles) return state;
                    return { tropasAAsignar: cantidad };
                });
            },

            /**
             * Ejecuta la orden de refuerzo enviando la petición al backend.
             * @returns {Promise<void>}
             */
            confirmarRefuerzo: async () => {
                const estado = get();

                if (!estado.comarcaRefuerzo || !estado.salaActiva?.id) {
                    console.warn('[confirmarRefuerzo] Falta comarca o sala activa.');
                    return;
                }
                if (estado.tropasAAsignar < 1) {
                    console.warn('[confirmarRefuerzo] Tropas a asignar deben ser >= 1.');
                    return;
                }
                if (!esMismoJugador(estado.turnoActual, estado.jugadorLocal)) {
                    console.warn('[confirmarRefuerzo] No es el turno del jugador local.');
                    return;
                }
                if ((estado.tropasDisponibles ?? 0) <= 0) {
                    console.warn('[confirmarRefuerzo] Sin tropas en reserva.');
                    return;
                }

                const comarca = estado.comarcaRefuerzo;
                const cantidad = estado.tropasAAsignar;

                // Actualización optimista completa: el jugador ve INMEDIATAMENTE el incremento de tropas
                // en el territorio Y la disminución en la reserva sin esperar al round-trip de red.
                // Si hay error, revertimos ambos cambios. TROPAS_COLOCADAS simplemente confirma lo que
                // el usuario ya vio, por lo que es idempotente.
                set((state) => ({
                    tropas: {
                        ...state.tropas,
                        [comarca]: (state.tropas[comarca] ?? 0) + cantidad,
                    },
                    tropasDisponibles: (state.tropasDisponibles ?? 0) - cantidad,
                    comarcaRefuerzo: null,
                    tropasAAsignar: 0,
                    popupCoords: null,
                }));

                try {
                    await gameApi.colocarTropas(estado.salaActiva.id, comarca, cantidad);
                    await get().sincronizarEstadoPartida();
                } catch (error) {
                    console.error('[confirmarRefuerzo] Error al colocar tropas:', error);
                    set((state) => ({
                        tropas: {
                            ...state.tropas,
                            [comarca]: (state.tropas[comarca] ?? 0) - cantidad,
                        },
                        tropasDisponibles: (state.tropasDisponibles ?? 0) + cantidad,
                        comarcaRefuerzo: comarca,
                        tropasAAsignar: cantidad,
                    }));
                }
            },

            // ACCIONES — ARSENAL DE ATAQUES ESPECIALES

            /**
             * Descarga el catálogo de tecnologías de la partida activa y lo almacena en el store.
             * Endpoint: GET /v1/partidas/{partida_id}/tecnologias
             * Acepta un overrideId para casos donde salaActiva.id aún no esté en el store
             * (p.ej. primera carga antes de que Zustand haya hidratado el estado).
             */
            cargarCatalogoTecnologias: async (overrideId?: number | string) => {
                const partidaId = overrideId ?? get().salaActiva?.id;
                if (!partidaId) {
                    console.warn('[cargarCatalogoTecnologias] No hay partida activa, no se puede cargar el catálogo.');
                    return;
                }
                try {
                    const data = await gameApi.getTecnologias(partidaId);
                    set({ catalogoTecnologias: data });
                    console.log('[cargarCatalogoTecnologias] Catálogo cargado para partida', partidaId);
                } catch (error) {
                    console.error('[cargarCatalogoTecnologias] Error al cargar catálogo:', error);
                }
            },

            /**
             * Compra una habilidad (la añade a armasCompradas) restando el oro en backend.
             */
            comprarTecnologiaBackend: async (tecnologiaId: string) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                try {
                    const res = await gameApi.comprarTecnologia(estado.salaActiva.id, tecnologiaId);
                    console.log('[comprarTecnologiaBackend] Arma comprada:', tecnologiaId);
                    // El backend envía el nuevo estado completo por WebSocket (o podemos sincronizar)
                    await get().sincronizarEstadoPartida();
                    return res;
                } catch (error) {
                    console.error('[comprarTecnologiaBackend] Error:', error);
                    throw error;
                }
            },

            /**
             * Activa el modo de selección de objetivo para un arma que ya tenemos comprada.
             */
            prepararArmaEspecial: (tecnologiaId: string) => {
                set({
                    armaEspecialSeleccionada: tecnologiaId,
                    comarcasResaltadas: [], // Se calcularán en manejarClickComarca según el rango
                    popupCoords: null,
                    origenSeleccionado: null,
                    destinoSeleccionado: null
                });
            },

            /**
             * Compra una habilidad tecnológica y activa inmediatamente el modo de
             * selección de objetivo en el mapa (combina comprar + prepararArmaEspecial).
             */
            comprarYPrepararAtaque: async (tecnologiaId: string) => {
                await get().comprarTecnologiaBackend(tecnologiaId);
                get().prepararArmaEspecial(tecnologiaId);
            },

            /**
             * Cancela el modo de selección de objetivo del ataque especial sin ejecutarlo.
             */
            cancelarAtaqueEspecial: () => {
                set({
                    armaEspecialSeleccionada: null,
                    comarcasResaltadas: [],
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    popupCoords: null,
                });
            },

            /**
             * Ejecuta el ataque especial sobre el territorio destino seleccionado.
             * Limpia todo el estado del arsenal trás la ejecución (exitosa o no).
             */
            ejecutarAtaqueEspecialBackend: async (destinoId: string, tipoAtaque: string, origenId: string | null = null) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;

                // Limpiar estado UI inmediatamente (feedback rápido)
                set({
                    armaEspecialSeleccionada: null,
                    comarcasResaltadas: [],
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    popupCoords: null,
                });

                try {
                    await gameApi.ejecutarAtaqueEspecial(estado.salaActiva.id, tipoAtaque, destinoId, origenId);
                    console.log('[ejecutarAtaqueEspecialBackend] Ataque especial ejecutado:', tipoAtaque, '->', destinoId);
                    await get().sincronizarEstadoPartida();
                } catch (error) {
                    console.error('[ejecutarAtaqueEspecialBackend] Error:', error);
                    alert('El ataque especial no pudo ejecutarse. Inténtalo de nuevo.');
                }
            },


            /**
             * Solicita al servidor el avance de fase.
             * NO predice la nueva fase localmente: espera CAMBIO_FASE por WebSocket.
             * Sí limpia la UI inmediatamente para feedback visual rápido.
             */
            pasarFaseBackend: async () => {
                const estado = get();
                if (!estado.salaActiva?.id) return;

                set({
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    comarcasResaltadas: [],
                    comarcaRefuerzo: null,
                    tropasAAsignar: 0,
                    popupCoords: null,
                });

                try {
                    await gameApi.pasarFase(estado.salaActiva.id);
                    await get().sincronizarEstadoPartida();
                    socketService.sendRaw({ accion: 'CHAT', mensaje: '@@SYS_SYNC_PHASE@@' });
                } catch (error) {
                    console.error('[pasarFaseBackend] Error:', error);
                }
            },

            /**
             * Ejecuta una acción de ataque entre dos territorios.
             * @param {string} origen - ID comarca atacante.
             * @param {string} destino - ID comarca defensora.
             * @param {number} tropas - Número de unidades enviadas.
             * @returns {Promise<any>} Resultado del combate.
             */
            ejecutarAtaque: async (origen: string, destino: string, tropas: number) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                try {
                    const result = await gameApi.atacarTerritorio(estado.salaActiva.id, origen, destino, tropas);
                    await get().sincronizarEstadoPartida();
                    return result;
                } catch (error) {
                    console.error('[ejecutarAtaque] Error:', error);
                    throw error;
                }
            },

            moverTropasConquista: async (tropas: number) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                try {
                    await gameApi.moverConquista(estado.salaActiva.id, tropas);
                    await get().sincronizarEstadoPartida();
                } catch (error) {
                    console.error('[moverTropasConquista] Error:', error);
                    throw error;
                }
            },

            prepararTrasladoConquista: (origen: string, destino: string) => {
                set({
                    movimientoConquistaPendiente: true,
                    origenConquista: origen,
                    destinoConquista: destino,
                    origenSeleccionado: origen,
                    destinoSeleccionado: destino,
                    popupCoords: null,
                });
            },

            /**
             * Ejecuta una fortificación entre dos comarcas propias.
             * @param {string} origen - Comarca de salida.
             * @param {string} destino - Comarca de llegada.
             * @param {number} tropas - Unidades a mover.
             * @returns {Promise<void>}
             */
            fortificarBackend: async (origen: string, destino: string, tropas: number) => {
                const estado = get();
                if (!estado.salaActiva?.id) return;
                try {
                    await gameApi.fortificar(estado.salaActiva.id, origen, destino, tropas);
                    await get().sincronizarEstadoPartida();
                    set({
                        preparandoFortificacion: false,
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        popupCoords: null,
                        comarcasResaltadas: [],
                        movimientoRealizadoEnTurno: true,
                    });
                } catch (error) {
                    console.error('[fortificarBackend] Error:', error);
                    throw error;
                }
            },

            /**
             * Enrutador central de interacciones tácticas sobre el mapa.
             * @param {string} comarcaId - Identificador de la comarca pulsada.
             * @param {{x: number, y: number}} [coords] - Posición en la pantalla.
             */
            manejarClickComarca: (comarcaId: string, coords?: { x: number, y: number }) => {
                const estado = get();

                if (estado.estadoPartidaLocal === 'ESPECTANDO') {
                    console.log('[manejarClickComarca] Estás en modo espectador.');
                    return;
                }

                if (String(estado.turnoActual).toLowerCase() !== String(estado.jugadorLocal).toLowerCase()) {
                    estado.mostrarErrorGlobal('No puedes realizar acciones fuera de tu turno.');
                    return;
                }

                // BLOQUEO ESTRICTO: Si el territorio propio está ocupado con una tarea, no se puede interactuar con él
                const estadoBloqueo = estado.estadosBloqueo?.[comarcaId];
                if (estadoBloqueo && estado.propietarios[comarcaId] === estado.jugadorLocal) {
                    const nombreFase = estado.faseActual === 'ATAQUE_CONVENCIONAL' ? 'Ataque' :
                        estado.faseActual === 'FORTIFICACION' ? 'Fortificación' :
                            estado.faseActual === 'REFUERZO' ? 'Refuerzo' : 'Gestión';
                    const nombreEstado = estadoBloqueo.startsWith('investigando') ? 'investigando' : 'trabajando';

                    estado.mostrarErrorGlobal(`Este territorio no puede usarse en la fase de ${nombreFase} porque está ${nombreEstado}.`);
                    return;
                }

                switch (estado.faseActual) {

                    case 'ATAQUE_ESPECIAL': {
                        const armaId = estado.armaEspecialSeleccionada;
                        if (!armaId) {
                            estado.mostrarErrorGlobal('Debes seleccionar un ataque especial.');
                            return;
                        }

                        const catalogo = estado.catalogoTecnologias || {};

                        // Helper interno para buscar el rango
                        let rango = null;
                        const idLower = armaId.toLowerCase();
                        if (catalogo[armaId]) {
                            rango = catalogo[armaId].rango;
                        } else if (catalogo[idLower]) {
                            rango = catalogo[idLower].rango;
                        } else if (catalogo.ramas) {
                            for (const habilidades of Object.values(catalogo.ramas)) {
                                const encontrada = (habilidades as any[]).find(h => h.id?.toLowerCase() === idLower);
                                if (encontrada) {
                                    rango = encontrada.rango;
                                    break;
                                }
                            }
                        }

                        // Caso A: Rango null -> no requiere origen, se ejecuta directo sobre el destino
                        if (rango === null || rango === undefined) {
                            // Clic destino: ejecutar
                            const propietario = String(estado.propietarios[comarcaId]);
                            const esEnemigo = propietario && !esMismoJugador(propietario, estado.jugadorLocal);
                            if (esEnemigo) {
                                get().ejecutarAtaqueEspecialBackend(comarcaId, armaId, null);
                            } else {
                                get().cancelarAtaqueEspecial();
                            }
                            return;
                        }

                        // Caso B: Rango numérico -> requiere origen
                        if (!estado.origenSeleccionado) {
                            // Seleccionar origen
                            if (estado.propietarios[comarcaId] === estado.jugadorLocal) {
                                if (!estado.grafoGlobal) return;
                                const alcanzables = calcularComarcasEnRango(
                                    estado.grafoGlobal,
                                    comarcaId,
                                    rango
                                );

                                const enemigosAlcanzables = Array.from(alcanzables).filter(
                                    id => estado.propietarios[id] !== estado.jugadorLocal
                                );

                                if (enemigosAlcanzables.length === 0) {
                                    estado.mostrarErrorGlobal('Ningún objetivo enemigo a rango.');
                                    return;
                                }
                                set({
                                    origenSeleccionado: comarcaId,
                                    comarcasResaltadas: enemigosAlcanzables
                                });
                            }
                        } else {
                            // Seleccionar destino
                            if (estado.origenSeleccionado === comarcaId) {
                                set({ origenSeleccionado: null, comarcasResaltadas: [] });
                                return;
                            }

                            if (estado.comarcasResaltadas.includes(comarcaId)) {
                                get().ejecutarAtaqueEspecialBackend(comarcaId, armaId, estado.origenSeleccionado);
                            } else {
                                estado.mostrarErrorGlobal('Objetivo fuera de rango.');
                                set({ origenSeleccionado: null, comarcasResaltadas: [] });
                            }
                        }
                        break;
                    }

                    case 'REFUERZO': {
                        if (estado.propietarios[comarcaId] !== estado.jugadorLocal) {
                            estado.mostrarErrorGlobal('No puedes reforzar territorios enemigos.');
                            return;
                        }
                        if ((estado.tropasDisponibles ?? 0) <= 0) {
                            estado.mostrarErrorGlobal('Todos los refuerzos ya han sido desplegados.');
                            return;
                        }
                        
                        if (estado.comarcaRefuerzo === comarcaId) {
                            set({ comarcaRefuerzo: null, popupCoords: null });
                        } else {
                            set({ comarcaRefuerzo: comarcaId, tropasAAsignar: Math.max(1, estado.tropasDisponibles ?? 0), popupCoords: coords || null });
                        }
                        break;
                    }

                    case 'ATAQUE_CONVENCIONAL': {
                        const RANGO_ATAQUE = 1;

                        if (estado.preparandoAtaque || estado.movimientoConquistaPendiente) return;

                        if (estado.origenSeleccionado && String(estado.origenSeleccionado) === String(comarcaId)) {
                            set({
                                origenSeleccionado: null,
                                destinoSeleccionado: null,
                                comarcasResaltadas: [],
                                popupCoords: null,
                            });
                            return;
                        }

                        if (estado.destinoSeleccionado && String(estado.destinoSeleccionado) === String(comarcaId)) {
                            set({ destinoSeleccionado: null, popupCoords: null });
                            if (estado.grafoGlobal && estado.origenSeleccionado) {
                                const alcanzables = calcularComarcasEnRango(
                                    estado.grafoGlobal,
                                    estado.origenSeleccionado,
                                    RANGO_ATAQUE
                                );
                                const propietarioOrigen =
                                    estado.propietarios[estado.origenSeleccionado];
                                set({
                                    comarcasResaltadas: Array.from(alcanzables).filter(
                                        (id) => estado.propietarios[id] !== propietarioOrigen
                                    ),
                                });
                            }
                            return;
                        }

                        if (!estado.origenSeleccionado) {
                            if (estado.propietarios[comarcaId] !== estado.jugadorLocal) {
                                estado.mostrarErrorGlobal('Solamente puedes realizar ataques desde tus territorios.');
                                return;
                            }
                            if ((estado.tropas[comarcaId] ?? 0) <= 1) {
                                estado.mostrarErrorGlobal('No puedes atacar con una sola tropa.');
                                return;
                            }
                            if (!estado.grafoGlobal) return;

                            const alcanzables = calcularComarcasEnRango(
                                estado.grafoGlobal,
                                comarcaId,
                                RANGO_ATAQUE
                            );
                            const propietarioOrigen = estado.propietarios[comarcaId];
                            const enemigosAlcanzables = Array.from(alcanzables).filter(
                                (id) => estado.propietarios[id] !== propietarioOrigen
                            );

                            if (enemigosAlcanzables.length === 0) {
                                estado.mostrarErrorGlobal('No tienes acceso a territorios enemigos desde aquí.');
                                return;
                            }

                            set({
                                origenSeleccionado: comarcaId,
                                comarcasResaltadas: enemigosAlcanzables,
                                popupCoords: coords || null,
                            });
                            return;
                        }

                        const strResaltadas = estado.comarcasResaltadas.map(String);
                        if (strResaltadas.includes(String(comarcaId))) {
                            set({ destinoSeleccionado: comarcaId, preparandoAtaque: true, popupCoords: coords || null });
                            return;
                        }

                        set({
                            origenSeleccionado: null,
                            destinoSeleccionado: null,
                            comarcasResaltadas: [],
                            popupCoords: null,
                        });
                        break;
                    }

                    case 'FORTIFICACION': {
                        if (estado.preparandoFortificacion) return;

                        if (!estado.origenSeleccionado) {
                            if (estado.movimientoRealizadoEnTurno) {
                                estado.mostrarErrorGlobal('Solamente se puede fortificar una vez por fase.');
                                return;
                            }
                            if (estado.propietarios[comarcaId] !== estado.jugadorLocal) {
                                estado.mostrarErrorGlobal('No puedes fortificar territorios enemigos.');
                                return;
                            }
                            if ((estado.tropas[comarcaId] ?? 0) <= 1) {
                                estado.mostrarErrorGlobal('No puedes fortificar con una sola tropa.');
                                return;
                            }
                            if (estado.estadosBloqueo?.[comarcaId]) {
                                estado.mostrarErrorGlobal('No puedes fortificar desde un territorio que está trabajando o investigando.');
                                return;
                            }

                            if (!estado.grafoGlobal) return;

                            // BFS: Buscamos todas las comarcas conectadas que también sean nuestras
                            const alcanzables = calcularComarcasEnRango(
                                estado.grafoGlobal,
                                comarcaId,
                                Infinity, // Rango infinito para buscar por todo el mapa conectado
                                (id) => estado.propietarios[id] === estado.jugadorLocal
                            );

                            if (alcanzables.size === 0) {
                                estado.mostrarErrorGlobal('Un territorio aislado no puede fortificarse.');
                                return;
                            }

                            set({
                                origenSeleccionado: comarcaId,
                                comarcasResaltadas: Array.from(alcanzables).filter(id => !estado.estadosBloqueo?.[id]),
                                popupCoords: coords || null,
                            });
                            return;
                        }

                        if (estado.origenSeleccionado && String(estado.origenSeleccionado) === String(comarcaId)) {
                            set({ origenSeleccionado: null, comarcasResaltadas: [], popupCoords: null });
                            return;
                        }

                        const strResaltadas = estado.comarcasResaltadas.map(String);
                        if (strResaltadas.includes(String(comarcaId))) {
                            set({ destinoSeleccionado: comarcaId, preparandoFortificacion: true, popupCoords: coords || null });
                        } else {
                            set({
                                origenSeleccionado: null,
                                destinoSeleccionado: null,
                                comarcasResaltadas: [],
                                popupCoords: null,
                            });
                        }
                        break;
                    }

                    case 'GESTION': {
                        if (estado.propietarios[comarcaId] !== estado.jugadorLocal) {
                            estado.mostrarErrorGlobal('No puedes gestionar territorios enemigos.');
                            return;
                        }

                        // Comprobar si ya se han agotado las acciones de gestión
                        const hayTrabajo = Object.entries(estado.estadosBloqueo || {}).some(([id, e]) => e === 'trabajando' && estado.propietarios[id] === estado.jugadorLocal);
                        const hayInvestigacion = Object.entries(estado.estadosBloqueo || {}).some(([id, e]) => e && e.startsWith('investigando') && estado.propietarios[id] === estado.jugadorLocal);
                        
                        if (hayTrabajo && hayInvestigacion) {
                            estado.mostrarErrorGlobal('Ya has ordenado trabajar e investigar. No puedes hacer más tareas esta fase.');
                            return;
                        }

                        // Toggle selección
                        if (estado.origenSeleccionado === comarcaId) {
                            set({ origenSeleccionado: null, popupCoords: null });
                        } else {
                            set({ origenSeleccionado: comarcaId, popupCoords: coords || null });
                        }
                        break;
                    }

                    default:
                        console.warn(
                            `[manejarClickComarca] Fase no manejada: ${estado.faseActual}`
                        );
                }
            },

            /**
             * Calcula estadísticas de control territorial.
             * @param {string} jugadorId - Username del jugador.
             * @returns {{ territorios: number, tropas: number }}
             */
            getEstadisticasJugador: (jugadorId: string) => {
                const estado = get();
                let territorios = 0;
                let tropas = 0;
                for (const [comarcaId, propietario] of Object.entries(estado.propietarios)) {
                    if (propietario === jugadorId) {
                        territorios++;
                        tropas += estado.tropas[comarcaId] ?? 0;
                    }
                }
                return { territorios, tropas };
            },

            /**
             * Actualiza el estado de la conexión del WebSocket.
             * @param {boolean} status - True si está conectado.
             */
            setSocketConnection: (status: boolean) => set({ isSocketConnected: status }),

            /**
             * Inyecta el evento del WebSocket directamente en Zustand.
             */
            actualizarDesdeSocket: (mensaje: any) => {
                console.log('%c🔄 Tablero actualizado por otro jugador', 'color: cyan; font-weight: bold;');
                console.log('📡 [WS RECIBIDO]:', mensaje);

                if (mensaje.estado_partida) {
                    get().setEstadoDinamico(mensaje.estado_partida);
                    return;
                }

                const tipo = mensaje.tipo_evento ?? mensaje.type ?? mensaje.tipo ?? '';

                // Soporte para alias y recarga forzada si el mensaje es parcial
                if (tipo === 'ESTADO_ACTUALIZADO' || tipo === 'ACTUALIZACION_MAPA') {
                    get().setEstadoDinamico(mensaje.data ?? mensaje.payload ?? mensaje);
                    return;
                }


                switch (tipo) {

                    //  Lobby: jugador se une 
                    case 'NUEVO_JUGADOR':
                    case 'JUGADOR_UNIDO': {
                        const nuevo = mensaje.data ?? mensaje.payload ?? mensaje;
                        const id = nuevo.jugador ?? nuevo.usuario_id ?? nuevo.id ?? '';
                        const displayName = nuevo.username ?? nuevo.jugador ?? id;
                        set((state) => {
                            const yaExiste = state.jugadoresLobby.some(
                                (j) => j.id === id || j.id === displayName
                            );
                            if (yaExiste) return state;
                            return {
                                jugadoresLobby: [
                                    ...state.jugadoresLobby,
                                    {
                                        id,
                                        username: displayName,
                                        numeroJugador: state.jugadoresLobby.length + 1,
                                        esCreador: false,
                                    },
                                ],
                            };
                        });
                        break;
                    }

                    //  Lobby: jugador sale 
                    case 'DESCONEXION':
                    case 'JUGADOR_SALIO': {
                        const saliente = mensaje.data ?? mensaje.payload ?? mensaje;
                        const idSaliente =
                            saliente.jugador ?? saliente.username ?? saliente.usuario_id ?? saliente.id ?? '';

                        set((state) => {
                            const nuevoDiccionario = { ...state.diccionarioJugadores };
                            if (nuevoDiccionario[idSaliente]) {
                                nuevoDiccionario[idSaliente] = {
                                    ...nuevoDiccionario[idSaliente],
                                    esta_desconectado: true
                                };
                            }

                            return {
                                jugadoresLobby: state.jugadoresLobby.filter(
                                    (j) => j.id !== idSaliente && j.username !== idSaliente
                                ),
                                diccionarioJugadores: nuevoDiccionario
                            };
                        });
                        break;
                    }

                    case 'JUGADOR_ELIMINADO': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        // Soportar tanto "jugador" como "username"
                        const eliminadoId = data.jugador ?? data.username ?? data.usuario_id;

                        if (eliminadoId) {
                            // Usar el log embebido si viene, si no construir frase de fallback
                            const frase = mensaje.log
                                ? logEntradaAFrase(mensaje.log)
                                : `💀 ${eliminadoId} ha sido eliminado`;
                            get().agregarMensajeLog(frase);
                        }

                        set((state) => {
                            if (!eliminadoId) return state;

                            const nuevoDiccionario = { ...state.diccionarioJugadores };

                            if (nuevoDiccionario[eliminadoId]) {
                                nuevoDiccionario[eliminadoId] = {
                                    ...nuevoDiccionario[eliminadoId],
                                    es_muerto: true,
                                    estado_jugador: 'muerto'
                                };
                            }

                            if (eliminadoId === state.jugadorLocal) {
                                return {
                                    diccionarioJugadores: nuevoDiccionario,
                                    estadoPartidaLocal: 'DERROTA'
                                };
                            }

                            const propietariosRestantes = new Set(Object.values(state.propietarios));

                            // Eliminamos al jugador que sale de la lista de propietarios.
                            // Convertimos a string por seguridad tipográfica.
                            propietariosRestantes.delete(String(eliminadoId));

                            const esVictoria =
                                !!state.jugadorLocal &&
                                propietariosRestantes.size === 1 &&
                                propietariosRestantes.has(state.jugadorLocal);

                            return {
                                diccionarioJugadores: nuevoDiccionario,
                                ...(esVictoria && { estadoPartidaLocal: 'VICTORIA' }),
                            };
                        });
                        break;
                    }

                    case 'PARTIDA_INICIADA': {
                        const payload = mensaje.data ?? mensaje.payload ?? mensaje;
                        get().setEstadoDinamico(payload);
                        set((state) => ({
                            salaActiva: { ...state.salaActiva, estado: 'activa' },
                        }));
                        break;
                    }

                    case 'SALA_CERRADA': {
                        const payload = mensaje.data ?? mensaje.payload ?? mensaje;
                        window.dispatchEvent(new CustomEvent('sala_cerrada', { detail: payload }));

                        set({
                            salaActiva: { id: null, codigoInvitacion: null, estado: null, config_max_players: null },
                            jugadoresLobby: [],
                            esCreadorSala: false
                        });
                        socketService.disconnect();
                        break;
                    }

                    case 'CHAT': {
                        const msj = mensaje.mensaje ?? mensaje.data?.mensaje ?? '';
                        if (msj === '@@SYS_SYNC_PHASE@@') {
                            const emisor = mensaje.emisor ?? mensaje.data?.emisor ?? '';
                            if (emisor !== get().jugadorLocal) {
                                // AÑADIMOS RETRASO PARA EVITAR CONDICIÓN DE CARRERA
                                setTimeout(() => {
                                    get().sincronizarEstadoPartida();
                                }, 800);
                            }
                        }
                        break;
                    }

                    case 'FASE_CAMBIADA':
                    case 'CAMBIO_FASE': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        const faseRaw = data.nueva_fase ?? data.fase_actual;
                        const jugadorRaw = data.jugador_activo ?? data.turno_de ?? '';
                        const tropasRecibidas: number = data.tropas_recibidas ?? 0;

                        // Generar log desde los datos del propio mensaje WS
                        if (jugadorRaw) {
                            const faseDisplay = faseRaw || '?';
                            get().agregarMensajeLog(`🔄 Turno de ${jugadorRaw} | Fase: ${faseDisplay}`);
                        }

                        set((state) => {
                            const nuevaFase = faseRaw ? normalizarFase(faseRaw) : state.faseActual;
                            const jugadorActivo = jugadorRaw || state.turnoActual;
                            const esRefuerzo = nuevaFase === 'REFUERZO';
                            const esMiTurno = jugadorActivo === state.jugadorLocal;
                            const esEntrandoAGestion = nuevaFase === 'GESTION';

                            // Si cambia de jugador reseteamos marcadores de gestion
                            const cambioTurno = jugadorActivo !== state.turnoActual;

                            return {
                                faseActual: nuevaFase,
                                finFaseUtc: data.fin_fase_utc ?? null,
                                turnoActual: jugadorActivo,

                                // Reseteo forzado de tareas al entrar en Gestión o cambiar de turno
                                ...((cambioTurno || esEntrandoAGestion) && {
                                    territorioTrabajando: null,
                                    territorioInvestigando: null
                                }),

                                // Limpiar ataque especial pendiente al cambiar de fase
                                preparandoAtaqueEspecial: null,

                                // Sincronización de tropas disponibles: ahora se actualiza para todos
                                // para que el rival vea cuántas tropas tiene el activo.
                                tropasDisponibles:
                                    esRefuerzo && tropasRecibidas > 0
                                        ? (state.tropasDisponibles ?? 0) + tropasRecibidas
                                        : state.tropasDisponibles,

                                mostrarAnimacionRefuerzos:
                                    esRefuerzo && esMiTurno && tropasRecibidas > 0,
                                refuerzosRecibidos:
                                    esRefuerzo ? tropasRecibidas : state.refuerzosRecibidos,

                                // LIMPIEZA CRÍTICA: Limpiar selecciones locales para que la UI 
                                // se refresque (botones se oculten, comarcas se de-resalten)
                                origenSeleccionado: null,
                                destinoSeleccionado: null,
                                comarcasResaltadas: [],
                                comarcaRefuerzo: null,
                                tropasAAsignar: 0,
                                popupCoords: null,
                                preparandoAtaque: false,
                                preparandoFortificacion: false,
                                movimientoConquistaPendiente: false,
                            };
                        });

                        // REFRESCO CRÍTICO: Sincronizar estado completo al cambiar de fase
                        // para capturar monedas generadas, tecnologías desbloqueadas, etc.
                        setTimeout(() => {
                            get().sincronizarEstadoPartida().then(() => {
                                // Recargar catálogo para reflejar nuevos desbloqueos
                                get().cargarCatalogoTecnologias();
                            });
                        }, 800);

                        break;
                    }

                    case 'TROPAS_COLOCADAS': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        const jugadorQueColoca = data.jugador || get().turnoActual;

                        // Generar log directamente desde los datos del mensaje WS
                        if (data.territorio) {
                            get().agregarMensajeLog(`🪖 ${jugadorQueColoca} desplegó tropas en ${data.territorio}`);
                        }

                        set((state) => {
                            // Calculamos cuántas se han puesto comparando con el estado actual
                            const tropasPrevias = state.tropas[data.territorio] ?? 0;
                            const cantidadColocada = Math.max(0, data.tropas_totales_ahora - tropasPrevias);

                            const esMiAccion = esMismoJugador(jugadorQueColoca, state.jugadorLocal);

                            return {
                                tropas: {
                                    ...state.tropas,
                                    [data.territorio]: data.tropas_totales_ahora,
                                },
                                // Si NO soy yo quien las puso (o si queremos ser deterministas con el socket),
                                // restamos de la reserva global. 
                                // Nota: El local ya restó optimísticamente en confirmarRefuerzo.
                                ...(!esMiAccion && {
                                    tropasDisponibles: Math.max(0, (state.tropasDisponibles ?? 0) - cantidadColocada)
                                })
                            };
                        });
                        break;
                    }

                    case 'ATAQUE_RESULTADO': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        const atacante = get().propietarios[data.origen] || 'Alguien';
                        const victoriaStr = data.victoria ? ' ¡Conquistado!' : '';

                        // Generar log directamente desde los datos del mensaje WS
                        if (data.destino) {
                            const victoria = data.victoria ? ' ¡Conquista!' : '';
                            get().agregarMensajeLog(`⚔️ ${atacante} atacó ${data.origen || '?'} → ${data.destino} (bajas: ${data.bajas_atacante ?? 0}/${data.bajas_defensor ?? 0})${victoria}`);
                        }
                        set((state) => {
                            const nuevasTropas = { ...state.tropas };
                            nuevasTropas[data.origen] =
                                (nuevasTropas[data.origen] ?? 0) - data.bajas_atacante;
                            nuevasTropas[data.destino] =
                                (nuevasTropas[data.destino] ?? 0) - data.bajas_defensor;

                            const nuevosPropietarios = { ...state.propietarios };
                            if (data.victoria) {
                                nuevosPropietarios[data.destino] =
                                    state.propietarios[data.origen];
                            }

                            return {
                                tropas: nuevasTropas,
                                propietarios: nuevosPropietarios,
                                preparandoAtaque: false,
                                // El trigger de movimientoConquistaPendiente se quita de aquí
                                // para que sea el jugador atacante quien lo dispare manualmente
                                // tras cerrar el resumen de batalla.
                                comarcasResaltadas: [],
                                popupCoords: null,
                            };
                        });
                        break;
                    }

                    case 'MOVIMIENTO_CONQUISTA': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        set((state) => {
                            const nuevasTropas = { ...state.tropas };
                            nuevasTropas[data.origen] =
                                (nuevasTropas[data.origen] ?? 0) - data.tropas;
                            nuevasTropas[data.destino] =
                                (nuevasTropas[data.destino] ?? 0) + data.tropas;
                            return {
                                tropas: nuevasTropas,
                                movimientoConquistaPendiente: false,
                                origenConquista: null,
                                destinoConquista: null,
                                origenSeleccionado: null,
                                destinoSeleccionado: null,
                                popupCoords: null,
                            };
                        });
                        break;
                    }

                    case 'ACTUALIZACION_MAPA': {
                        const payload = mensaje.data ?? mensaje.payload ?? mensaje;
                        get().setEstadoDinamico(payload);
                        break;
                    }

                    case 'ATAQUE_ESPECIAL':
                    case 'ataque_especial': {
                        const data = mensaje.data ?? mensaje.payload ?? mensaje;
                        const afectados = data.resultado?.afectados || [];

                        console.log(`Ataque Especial detectado: ${data.tipo} por ${data.atacante}`);

                        set((state) => {
                            const nuevasTropas = { ...state.tropas };
                            const nuevosEstadosAlterados = { ...state.estadosAlterados };

                            afectados.forEach((afectado: any) => {
                                const id = afectado.territorio_id;
                                if (!id) return; // Si es un ataque a jugador (Sanción/Propaganda), lo ignoramos aquí

                                // 1. Impacto directo: Aplicar bajas inmediatas (Misiles, Bombas, Coronavirus inicial)
                                if (afectado.bajas || afectado.bajas_iniciales) {
                                    const bajas = afectado.bajas || afectado.bajas_iniciales;
                                    nuevasTropas[id] = Math.max(0, (nuevasTropas[id] ?? 0) - bajas);
                                }

                                // 2. Efecto persistente: Aplicar el icono al instante (Gripe, Inhibidor)
                                if (afectado.efecto_añadido) {
                                    const actuales = nuevosEstadosAlterados[id] || [];
                                    if (!actuales.includes(afectado.efecto_añadido)) {
                                        nuevosEstadosAlterados[id] = [...actuales, afectado.efecto_añadido];
                                    }
                                }
                            });

                            return {
                                tropas: nuevasTropas,
                                estadosAlterados: nuevosEstadosAlterados
                            };
                        });
                        break;
                    }

                    case 'SOLICITUD_PAUSA': {
                        const data = mensaje.data || mensaje.payload || mensaje;
                        const solicitante = data.jugador_solicitante || data.solicitante || data.jugador || data.usuario_id || data.username;

                        // Verificamos si no somos nosotros para mostrar el modal de voto
                        if (!esMismoJugador(solicitante, get().jugadorLocal)) {
                            set({
                                faseVotacionPausa: 'votando',
                                jugadorSolicitantePausa: solicitante
                            });
                        } else {
                            // Si somos nosotros los que lo hemos pedido, nos forzamos a la pantalla de espera
                            set({ faseVotacionPausa: 'esperando', jugadorSolicitantePausa: solicitante });
                        }
                        break;
                    }

                    case 'VOTO_PAUSA': {
                        // El backend avisa que alguien ha votado. Lo ignoramos para que no salga el error amarillo.
                        break;
                    }

                    case 'PAUSA_RECHAZADA': {
                        set({ faseVotacionPausa: 'ninguna', jugadorSolicitantePausa: null });
                        alert('La votación de pausa ha sido rechazada. La guerra continúa.');
                        break;
                    }

                    case 'PARTIDA_PAUSADA': {
                        set({ faseVotacionPausa: 'ninguna' });
                        alert('La partida ha sido pausada correctamente. Podréis reanudarla más adelante.');
                        // Aquí el juego debería cerrarse o mandarte al lobby
                        window.location.href = '/lobby';
                        break;
                    }

                    default:
                        console.warn(`[WS] Tipo de evento desconocido: "${tipo}"`);
                        break;
                }
            },

            // Acciones de Sala / Lobby
            /**
             * Crea una nueva partida en el backend.
             * @param {any} config - Configuración de la sala.
             * @returns {Promise<any>} Datos de la sala creada.
             */
            crearPartidaBackend: async (config = {}) => {
                const payload = {
                    config_max_players: (config as any).config_max_players ?? 4,
                    config_visibility: (config as any).config_visibility ?? 'publica',
                    config_timer_seconds: (config as any).config_timer_seconds ?? 60,
                };

                try {
                    const data = await fetchApi('/v1/partidas', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                    });

                    const authUser = useAuthStore.getState().user;
                    const creadorId =
                        authUser?.username ??
                        authUser?.nombre_usuario ??
                        authUser?.nombre ??
                        'unknown';

                    set({
                        salaActiva: {
                            id: data.id,
                            codigoInvitacion: data.codigo_invitacion,
                            estado: data.estado,
                            config_max_players: data.config_max_players,
                        },
                        jugadoresLobby: [
                            {
                                id: creadorId,
                                username: creadorId,
                                numeroJugador: 1,
                                esCreador: true,
                            },
                        ],
                        jugadorLocal: creadorId,
                        esCreadorSala: true,
                        // Reset de variables de votación para evitar caching entre salas
                        faseVotacionPausa: 'ninguna',
                        jugadorSolicitantePausa: null,
                    });

                    return data;
                } catch (error) {
                    console.error('[crearPartidaBackend] Error:', error);
                    throw error;
                }
            },

            /**
             * Une al usuario a una sala existente mediante código.
             * @param {string} codigo - Código de invitación.
             * @returns {Promise<any>} Respuesta del servidor.
             */
            unirsePartidaBackend: async (codigo: string) => {
                try {
                    const data = await fetchApi(`/v1/partidas/${codigo}/unirse`, {
                        method: 'POST',
                    });
                    const authUser = useAuthStore.getState().user;
                    const jugadorLocal =
                        authUser?.username ??
                        authUser?.nombre_usuario ??
                        authUser?.nombre ??
                        data.usuario_id;

                    // ✅ NUEVA LÓGICA DE EXTRACCIÓN DE ID:
                    // 1. Miramos si viene en la raíz (por si el backend lo arregla en el futuro)
                    let realPartidaId = data.id || data.partida_id;

                    // 2. Si no está en la raíz, ¡lo robamos de la lista de jugadores!
                    if (!realPartidaId && data.jugadores_en_sala && data.jugadores_en_sala.length > 0) {
                        realPartidaId = data.jugadores_en_sala[0].partida_id;
                    }

                    let configMaxPlayers = data.config_max_players;

                    // 3. Truco de la lista pública para extraer config_max_players (ya que el backend WS no lo manda)
                    if (!realPartidaId || !configMaxPlayers) {
                        try {
                            const listaPartidas = await fetchApi('/v1/partidas');
                            const miPartida = listaPartidas.find(
                                (p: any) => p.codigo_invitacion === codigo
                            );
                            if (miPartida) {
                                configMaxPlayers = miPartida.config_max_players;
                                if (!realPartidaId) realPartidaId = miPartida.id;
                            }
                        } catch (_) {
                            // Fallo silencioso
                        }
                    }

                    configMaxPlayers = configMaxPlayers || 4;

                    if (!realPartidaId) {
                        throw new Error(
                            'No se pudo localizar el ID de la sala para conectarse. Revisa la respuesta del servidor.'
                        );
                    }

                    const jugadoresLobby = (data.jugadores_en_sala || []).map(
                        (j: any, index: number) => ({
                            id: j.usuario_id,
                            username: j.usuario_id,
                            numeroJugador: index + 1,
                            esCreador: j.usuario_id === data.creador,
                        })
                    );

                    set((state) => ({
                        salaActiva: {
                            ...state.salaActiva,
                            id: realPartidaId,
                            config_max_players: configMaxPlayers,
                            codigoInvitacion: codigo,
                            estado: null, // ← limpiar estado persistido para evitar navegación prematura
                        },
                        jugadoresLobby,
                        jugadorLocal,
                        esCreadorSala: false,
                        // Reset de variables de votación para evitar caching entre salas
                        faseVotacionPausa: 'ninguna',
                        jugadorSolicitantePausa: null,
                    }));

                    return data;
                } catch (error) {
                    console.error('[unirsePartidaBackend] Error:', error);
                    throw error;
                }
            },

            abandonarSoberania: async () => {
                const { salaActiva } = get();
                try {
                    if (salaActiva?.id) {
                        await gameApi.abandonarPartida(salaActiva.id);
                    }
                } catch (error) {
                    console.error('[abandonarSoberania] Error al notificar al servidor:', error);
                } finally {
                    socketService.disconnect();
                    set({
                        salaActiva: { id: null, codigoInvitacion: null, estado: null, config_max_players: null },
                        jugadoresLobby: [],
                        faseActual: null,
                        tropas: {},
                        propietarios: {},
                        coloresJugadores: {},
                        jugadorLocal: null,
                        turnoActual: null,
                        jugadores: [],
                        diccionarioJugadores: {},
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: [],
                        comarcaRefuerzo: null,
                        tropasAAsignar: 0,
                        mostrarAnimacionRefuerzos: false,
                        refuerzosRecibidos: 0,
                        preparandoAtaque: false,
                        movimientoConquistaPendiente: false,
                        preparandoFortificacion: false,
                        preparandoAtaqueEspecial: null,
                        catalogoTecnologias: null,
                        esCreadorSala: false,
                        // Reset de variables de votación para evitar caching entre salas
                        faseVotacionPausa: 'ninguna',
                        jugadorSolicitantePausa: null
                    });
                }
            },

            // ACCIONES — VOTACIÓN PAUSA

            /**
             * Cambia la fase local de la votación de pausa.
            
            setFaseVotacionPausa: (fase: 'ninguna' | 'confirmando_local' | 'esperando' | 'votando') => {
                set({ faseVotacionPausa: fase });
            },
            */
            setFaseVotacionPausa: (fase) => set({ faseVotacionPausa: fase }),

            /**
             * El jugador local inicia una solicitud de pausa por consenso mediante API REST.
             * Y automáticamente emite su voto a favor.
             */
            iniciarSolicitudPausa: async () => {
                const estado = get();
                // El endpoint requiere el código único de la partida
                const codigo = estado.salaActiva?.codigoInvitacion;

                if (!codigo) {
                    console.error("No se encontró el código de la partida activa.");
                    return;
                }

                set({ faseVotacionPausa: 'esperando' });

                try {
                    //Abrimos la votación en el servidor
                    await fetchApi(`/v1/partidas/${codigo}/pausa/solicitar`, {
                        method: 'POST'
                    });
                    console.log("🚀 [REST] Petición de pausa enviada al servidor");

                    //Votamos que SÍ automáticamente ya que somos los proponentes
                    await fetchApi(`/v1/partidas/${codigo}/pausa/votar`, {
                        method: 'POST',
                        body: JSON.stringify({ voto_a_favor: true })
                    });
                    console.log("🚀 [REST] Auto-voto a favor enviado al servidor");

                } catch (error) {
                    console.error('[iniciarSolicitudPausa] Error:', error);
                    set({ faseVotacionPausa: 'ninguna' });
                    estado.mostrarErrorGlobal("No se pudo solicitar la pausa al servidor.");
                }
            },

            /**
             * El jugador local emite su voto (a favor / en contra) sobre la pausa.
             * @param {boolean} voto - true = acepta pausar, false = rechaza.
             */
            enviarVotoPausa: async (voto: boolean) => {
                const estado = get();
                const codigo = estado.salaActiva?.codigoInvitacion;

                if (!codigo) return;

                set({ faseVotacionPausa: 'esperando' });

                try {
                    await fetchApi(`/v1/partidas/${codigo}/pausa/votar`, {
                        method: 'POST',
                        body: JSON.stringify({ voto_a_favor: voto })
                    });
                    console.log(`🚀 [REST] Voto de pausa (${voto}) enviado al servidor`);
                } catch (error) {
                    console.error('[enviarVotoPausa] Error:', error);
                    estado.mostrarErrorGlobal("Error al registrar tu voto.");
                }
            },
        }),
        {
            name: 'soberania-session-storage', // Clave en localStorage
            storage: createJSONStorage(() => localStorage),
            // IMPORTANTE: Aquí decides qué sobrevive al F5
            partialize: (state) => ({
                faseVotacionPausa: state.faseVotacionPausa,
                jugadorSolicitantePausa: state.jugadorSolicitantePausa,
                salaActiva: state.salaActiva,
                jugadorLocal: state.jugadorLocal,
                estadoPartidaLocal: state.estadoPartidaLocal,
            }),
        }
    )
);
