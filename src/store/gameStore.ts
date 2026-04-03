// src/store/gameStore.ts
import { create } from 'zustand';
import { EstadoJuego, FaseJuego } from '../types/game.types';
import { calcularComarcasEnRango, construirGrafoComarcas } from '../utils/graphUtils';
import { ComarcaDTO } from '../types/mapa.types';
import { fetchApi } from '../services/api';
import { gameApi } from '../services/gameApi';
import { useAuthStore } from './useAuthStore';

// Helpers internos

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
): { tropas: Record<string, number>; propietarios: Record<string, string> } => {
    const tropas: Record<string, number> = {};
    const propietarios: Record<string, string> = {};
    for (const [id, t] of Object.entries(mapa)) {
        tropas[id] = t.units;
        propietarios[id] = t.owner_id;
    }
    return { tropas, propietarios };
};

/**
 * Procesa el diccionario de jugadores para asignar colores y detectar la reserva local.
 * @param {Record<string, any>} jugadores - Diccionario de jugadores por username.
 * @param {string | null} jugadorLocalActual - Username actual almacenado.
 * @returns {{ coloresJugadores: Record<string, string>; tropasReservaLocal: number | null; jugadorLocalId: string | null; }}
 */
const parsearJugadores = (
    jugadores: Record<string, any>,
    jugadorLocalActual: string | null
): {
    coloresJugadores: Record<string, string>;
    tropasReservaLocal: number | null;
    jugadorLocalId: string | null;
} => {
    const MAP_COLORS = [
        'var(--color-jugador-1)',
        'var(--color-jugador-2)',
        'var(--color-jugador-3)',
        'var(--color-jugador-4)',
    ];

    const coloresJugadores: Record<string, string> = {};
    let tropasReservaLocal: number | null = null;

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

        // La clave del diccionario ES el username → comparación directa.
        if (username === miUsername && info.tropas_reserva !== undefined) {
            tropasReservaLocal = info.tropas_reserva;
        }
    }

    return {
        coloresJugadores,
        tropasReservaLocal,
        jugadorLocalId: miUsername || null,
    };
};

// Store
export const useGameStore = create<EstadoJuego>((set, get) => ({

    // Mapa estructural
    grafoGlobal: null,
    mapaEstatico: null,
    errorMapaEstatico: null,

    // Estado de partida
    faseActual: null,
    modoVista: 'COMARCAS',
    dinero: 0,
    tropasDisponibles: null,

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
    comarcasResaltadas: [],
    regionHover: null,
    comarcaRefuerzo: null,
    tropasAAsignar: 0,
    mostrarAnimacionRefuerzos: false,
    refuerzosRecibidos: 0,
    isSocketConnected: false,

    preparandoAtaque: false,
    movimientoConquistaPendiente: false,
    origenConquista: null,
    destinoConquista: null,
    preparandoFortificacion: false,

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

    // ACCIONES — SINCRONIZACIÓN CON BACKEND

    /**
     * Recupera el estado completo de la partida desde el endpoint REST.
     * Endpoint: GET /v1/partidas/{partida_id}/estado
     *
     * Se usa para:
     *   - Recargar estado tras reconexión WebSocket.
     *   - Resolver inconsistencias entre UI y servidor.
     */
    sincronizarEstadoPartida: async () => {
        const { salaActiva, jugadorLocal } = get();
        if (!salaActiva?.id) {
            console.warn('[sincronizarEstadoPartida] Sin salaActiva.id, abortando.');
            return;
        }

        try {
            const data = await fetchApi(`/v1/partidas/${salaActiva.id}/estado`);

            const { tropas, propietarios } = data.mapa
                ? parsearMapa(data.mapa)
                : { tropas: get().tropas, propietarios: get().propietarios };

            const { coloresJugadores, tropasReservaLocal, jugadorLocalId } =
                data.jugadores
                    ? parsearJugadores(data.jugadores, jugadorLocal)
                    : {
                        coloresJugadores: get().coloresJugadores,
                        tropasReservaLocal: null,
                        jugadorLocalId: jugadorLocal,
                    };

            set((state) => ({
                faseActual: data.fase_actual
                    ? normalizarFase(data.fase_actual)
                    : state.faseActual,
                turnoActual: data.turno_de ?? state.turnoActual,
                jugadorLocal: jugadorLocalId ?? state.jugadorLocal,
                tropas,
                propietarios,
                coloresJugadores: { ...state.coloresJugadores, ...coloresJugadores },
                diccionarioJugadores: data.jugadores ?? state.diccionarioJugadores,
                jugadores: data.jugadores
                    ? Object.keys(data.jugadores)
                    : state.jugadores,
                ...(tropasReservaLocal !== null && {
                    tropasDisponibles: tropasReservaLocal,
                }),
            }));

            console.log('[sincronizarEstadoPartida] Estado sincronizado con el servidor.');
        } catch (error) {
            console.error('[sincronizarEstadoPartida] Error al sincronizar:', error);
        }
    },

    // ACCIONES — UI

    toggleModoVista: () =>
        set((state) => ({
            modoVista: state.modoVista === 'COMARCAS' ? 'REGIONES' : 'COMARCAS',
        })),

    setRegionHover: (regionId: string | null) => set({ regionHover: regionId }),

    limpiarSeleccion: () =>
        set({
            origenSeleccionado: null,
            destinoSeleccionado: null,
            comarcasResaltadas: [],
        }),

    cerrarAnimacionRefuerzos: () => set({ mostrarAnimacionRefuerzos: false }),

    setFase: (nuevaFase: FaseJuego) =>
        set({
            faseActual: nuevaFase,
            origenSeleccionado: null,
            destinoSeleccionado: null,
            comarcasResaltadas: [],
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
            if (cantidad < 0 || cantidad > disponibles) return state;
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
        if (estado.tropasAAsignar <= 0) {
            console.warn('[confirmarRefuerzo] Tropas a asignar deben ser > 0.');
            return;
        }
        if (String(estado.turnoActual) !== String(estado.jugadorLocal)) {
            console.warn('[confirmarRefuerzo] No es el turno del jugador local.');
            return;
        }
        if ((estado.tropasDisponibles ?? 0) <= 0) {
            console.warn('[confirmarRefuerzo] Sin tropas en reserva.');
            return;
        }

        const comarca = estado.comarcaRefuerzo;
        const cantidad = estado.tropasAAsignar;

        // Descuento optimista: el jugador ve el gasto inmediatamente sin
        // esperar al round-trip de red. ACTUALIZACION_MAPA lo corregirá si hay
        // diferencia con el servidor.
        set((state) => ({
            tropasDisponibles: (state.tropasDisponibles ?? 0) - cantidad,
            comarcaRefuerzo: null,
            tropasAAsignar: 0,
        }));

        try {
            await gameApi.colocarTropas(estado.salaActiva.id, comarca, cantidad);
            // TROPAS_COLOCADAS → actualiza comarca en el mapa.
            // ACTUALIZACION_MAPA → sobreescribe tropasDisponibles con verdad del servidor.
        } catch (error) {
            console.error('[confirmarRefuerzo] Error al colocar tropas:', error);
            set((state) => ({
                tropasDisponibles: (state.tropasDisponibles ?? 0) + cantidad,
                comarcaRefuerzo: comarca,
                tropasAAsignar: cantidad,
            }));
        }
    },

    // ACCIONES — ATAQUE / CONQUISTA / FORTIFICACIÓN

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
        });

        try {
            await gameApi.pasarFase(estado.salaActiva.id);
            // La nueva fase llega por WS → CAMBIO_FASE.
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
            return await gameApi.atacarTerritorio(estado.salaActiva.id, origen, destino, tropas);
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
        } catch (error) {
            console.error('[moverTropasConquista] Error:', error);
            throw error;
        }
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
            set({
                preparandoFortificacion: false,
                origenSeleccionado: null,
                destinoSeleccionado: null,
                comarcasResaltadas: [],
            });
        } catch (error) {
            console.error('[fortificarBackend] Error:', error);
            throw error;
        }
    },

    /**
     * Enrutador central de interacciones tácticas sobre el mapa.
     * @param {string} comarcaId - Identificador de la comarca pulsada.
     */
    manejarClickComarca: (comarcaId: string) => {
        const estado = get();

        if (String(estado.turnoActual) !== String(estado.jugadorLocal)) {
            console.log('[manejarClickComarca] No es tu turno.');
            return;
        }

        switch (estado.faseActual) {

            case 'REFUERZO': {
                if ((estado.tropasDisponibles ?? 0) <= 0) {
                    console.log('[manejarClickComarca] Sin tropas disponibles en reserva.');
                    return;
                }
                if (estado.propietarios[comarcaId] === estado.jugadorLocal) {
                    set({ comarcaRefuerzo: comarcaId, tropasAAsignar: 0 });
                }
                break;
            }

            case 'ATAQUE_CONVENCIONAL': {
                const RANGO_ATAQUE = 1;

                if (estado.preparandoAtaque || estado.movimientoConquistaPendiente) return;

                if (estado.origenSeleccionado === comarcaId) {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: [],
                    });
                    return;
                }

                if (estado.destinoSeleccionado === comarcaId) {
                    set({ destinoSeleccionado: null });
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
                    if (
                        estado.propietarios[comarcaId] !== estado.jugadorLocal ||
                        (estado.tropas[comarcaId] ?? 0) <= 1
                    ) {
                        console.log('[manejarClickComarca] Origen inválido para atacar.');
                        return;
                    }
                    if (!estado.grafoGlobal) return;

                    const alcanzables = calcularComarcasEnRango(
                        estado.grafoGlobal,
                        comarcaId,
                        RANGO_ATAQUE
                    );
                    const propietarioOrigen = estado.propietarios[comarcaId];
                    set({
                        origenSeleccionado: comarcaId,
                        comarcasResaltadas: Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] !== propietarioOrigen
                        ),
                    });
                    return;
                }

                if (estado.comarcasResaltadas.includes(comarcaId)) {
                    set({ destinoSeleccionado: comarcaId, preparandoAtaque: true });
                    return;
                }

                set({
                    origenSeleccionado: null,
                    destinoSeleccionado: null,
                    comarcasResaltadas: [],
                });
                break;
            }

            case 'FORTIFICACION': {
                const RANGO_MOVIMIENTO = 1;

                if (estado.preparandoFortificacion) return;

                if (!estado.origenSeleccionado) {
                    if (
                        estado.propietarios[comarcaId] !== estado.jugadorLocal ||
                        (estado.tropas[comarcaId] ?? 0) <= 1
                    )
                        return;

                    if (!estado.grafoGlobal) return;
                    const alcanzables = calcularComarcasEnRango(
                        estado.grafoGlobal,
                        comarcaId,
                        RANGO_MOVIMIENTO
                    );
                    set({
                        origenSeleccionado: comarcaId,
                        comarcasResaltadas: Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] === estado.jugadorLocal
                        ),
                    });
                    return;
                }

                if (estado.origenSeleccionado === comarcaId) {
                    set({ origenSeleccionado: null, comarcasResaltadas: [] });
                    return;
                }

                if (estado.comarcasResaltadas.includes(comarcaId)) {
                    set({ destinoSeleccionado: comarcaId, preparandoFortificacion: true });
                } else {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: [],
                    });
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
     * Procesa los eventos entrantes del WebSocket y actualiza el estado.
     * @param {any} mensaje - 
     */
    procesarMensajeSocket: (mensaje: any) => {
        console.log('📡 [WS]', mensaje);
        const tipo = mensaje.tipo_evento ?? mensaje.type ?? '';

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
                    saliente.jugador ?? saliente.usuario_id ?? saliente.id ?? '';
                set((state) => ({
                    jugadoresLobby: state.jugadoresLobby.filter(
                        (j) => j.id !== idSaliente && j.username !== idSaliente
                    ),
                }));
                break;
            }

            case 'PARTIDA_INICIADA': {
                const payload = mensaje.data ?? mensaje.payload ?? mensaje;

                const { tropas, propietarios } = payload.mapa
                    ? parsearMapa(payload.mapa)
                    : { tropas: {}, propietarios: {} };

                const { coloresJugadores, tropasReservaLocal, jugadorLocalId } =
                    payload.jugadores
                        ? parsearJugadores(payload.jugadores, get().jugadorLocal)
                        : {
                            coloresJugadores: {},
                            tropasReservaLocal: null,
                            jugadorLocalId: get().jugadorLocal,
                        };

                set((state) => ({
                    salaActiva: { ...state.salaActiva, estado: 'activa' },
                    faseActual: payload.fase_actual
                        ? normalizarFase(payload.fase_actual)
                        : 'REFUERZO',
                    turnoActual: payload.turno_de ?? state.turnoActual,
                    jugadores: payload.jugadores
                        ? Object.keys(payload.jugadores)
                        : state.jugadores,
                    diccionarioJugadores:
                        payload.jugadores ?? state.diccionarioJugadores,
                    coloresJugadores,
                    jugadorLocal: jugadorLocalId ?? state.jugadorLocal,
                    tropasDisponibles:
                        tropasReservaLocal !== null
                            ? tropasReservaLocal
                            : state.tropasDisponibles,
                    ...(payload.mapa && { tropas, propietarios }),
                }));
                break;
            }

            case 'CAMBIO_FASE': {
                const data = mensaje.data ?? mensaje.payload ?? mensaje;
                const nuevaFase: FaseJuego | null = data.nueva_fase
                    ? normalizarFase(data.nueva_fase)
                    : null;
                const jugadorActivo: string = data.turno_de ?? data.jugador_activo ?? '';
                const tropasRecibidas: number = data.tropas_recibidas ?? 0;

                set((state) => {
                    const esRefuerzo = nuevaFase === 'REFUERZO';
                    const esMiTurno = jugadorActivo === state.jugadorLocal;

                    return {
                        faseActual: nuevaFase ?? state.faseActual,
                        turnoActual: jugadorActivo || state.turnoActual,

                        tropasDisponibles:
                            esRefuerzo && esMiTurno && tropasRecibidas > 0
                                ? (state.tropasDisponibles ?? 0) + tropasRecibidas
                                : state.tropasDisponibles,

                        mostrarAnimacionRefuerzos:
                            esRefuerzo && esMiTurno && tropasRecibidas > 0,
                        refuerzosRecibidos:
                            esRefuerzo && esMiTurno
                                ? tropasRecibidas
                                : state.refuerzosRecibidos,

                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: [],
                        comarcaRefuerzo: null,
                        tropasAAsignar: 0,
                        preparandoAtaque: false,
                        preparandoFortificacion: false,
                    };
                });
                break;
            }

            case 'TROPAS_COLOCADAS': {
                const data = mensaje.data ?? mensaje.payload ?? mensaje;
                set((state) => ({
                    tropas: {
                        ...state.tropas,
                        [data.territorio]: data.tropas_totales_ahora,
                    },
                }));
                break;
            }

            case 'ATAQUE_RESULTADO': {
                const data = mensaje.data ?? mensaje.payload ?? mensaje;
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
                        origenSeleccionado: data.victoria ? data.origen : null,
                        destinoSeleccionado: data.victoria ? data.destino : null,
                        comarcasResaltadas: [],
                        ...(data.victoria && {
                            movimientoConquistaPendiente: true,
                            origenConquista: data.origen,
                            destinoConquista: data.destino,
                        }),
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
                    };
                });
                break;
            }

            case 'ACTUALIZACION_MAPA': {
                const payload = mensaje.data ?? mensaje.payload ?? mensaje;

                const { tropas, propietarios } = payload.mapa
                    ? parsearMapa(payload.mapa)
                    : { tropas: get().tropas, propietarios: get().propietarios };

                const { coloresJugadores, tropasReservaLocal } = payload.jugadores
                    ? parsearJugadores(payload.jugadores, get().jugadorLocal)
                    : {
                        coloresJugadores: get().coloresJugadores,
                        tropasReservaLocal: null,
                    };

                set((state) => ({
                    faseActual: payload.fase_actual
                        ? normalizarFase(payload.fase_actual)
                        : state.faseActual,
                    turnoActual: payload.turno_de ?? state.turnoActual,
                    ...(payload.mapa && { tropas, propietarios }),
                    coloresJugadores: {
                        ...state.coloresJugadores,
                        ...coloresJugadores,
                    },
                    ...(tropasReservaLocal !== null && {
                        tropasDisponibles: tropasReservaLocal,
                    }),
                }));
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

            // Obtener config y ID real de la sala desde el listado público.
            let configMaxPlayers = 4;
            let realPartidaId = data.partida_id;

            try {
                const listaPartidas = await fetchApi('/v1/partidas');
                const miPartida = listaPartidas.find(
                    (p: any) => p.codigo_invitacion === codigo
                );
                if (miPartida) {
                    configMaxPlayers = miPartida.config_max_players;
                    realPartidaId = miPartida.id;
                }
            } catch (_) {
                configMaxPlayers = 4;
            }

            if (!realPartidaId) {
                throw new Error(
                    'No se pudo localizar el ID de la sala para conectarse.'
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
                },
                jugadoresLobby,
                jugadorLocal,
                esCreadorSala: false,
            }));

            return data;
        } catch (error) {
            console.error('[unirsePartidaBackend] Error:', error);
            throw error;
        }
    },
}));