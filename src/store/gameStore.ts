// src/store/gameStore.ts
import { create } from 'zustand';
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
} => {
    const tropas: Record<string, number> = {};
    const propietarios: Record<string, string> = {};
    const estadosBloqueo: Record<string, string | null> = {};

    for (const [id, t] of Object.entries(mapa)) {
        tropas[id] = t.units;
        propietarios[id] = t.owner_id;
        estadosBloqueo[id] = t.estado_bloqueo || null;
    }
    return { tropas, propietarios, estadosBloqueo };
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
            if (info.tecnologias_compradas !== undefined) tecnologiasLocal = info.tecnologias_compradas;
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
        territorioTrabajandoLocal,
        territorioInvestigandoLocal,
        ramaInvestigandoLocal
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
    estadoPartidaLocal: 'JUGANDO',
    monedas: 0,
    estadosBloqueo: {},
    tropasDisponibles: null,
    movimientoRealizadoEnTurno: false,

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
        const { tropas, propietarios } = payload.mapa
            ? parsearMapa(payload.mapa)
            : { tropas: get().tropas, propietarios: get().propietarios };

        const { 
            coloresJugadores, 
            tropasReservaLocal: _, 
            tropasReservaActivo, 
            jugadorLocalId,
            monedasLocal,
            tecnologiasLocal,
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
                territorioTrabajandoLocal: null,
                territorioInvestigandoLocal: null,
                ramaInvestigandoLocal: null,
            };

        set((state) => ({
            faseActual: payload.fase_actual
                ? normalizarFase(payload.fase_actual)
                : state.faseActual,
            // Soportar múltiples claves de turno para robustez
            turnoActual: payload.turno_de ?? payload.jugador_activo ?? payload.turno_actual ?? state.turnoActual,
            ...(payload.mapa && { tropas, propietarios }),
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
            tecnologiasDesbloqueadas: (tecnologiasLocal ?? payload.tecnologias_desbloqueadas ?? state.tecnologiasDesbloqueadas).map((t: string) => t.toLowerCase()),
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
     * Descarga el catálogo global de tecnologías y lo almacena en el store.
     * Endpoint: GET /api/v1/partidas/tecnologias
     */
    cargarCatalogoTecnologias: async () => {
        try {
            const data = await gameApi.getCatalogoTecnologias();
            set({ catalogoTecnologias: data });
            console.log('[cargarCatalogoTecnologias] Catálogo cargado:', Object.keys(data).length, 'tecnologías.');
        } catch (error) {
            console.error('[cargarCatalogoTecnologias] Error al cargar catálogo:', error);
        }
    },

    /**
     * Compra una habilidad desbloqueada y activa el modo de selección de objetivo.
     * - Actualiza dinero en el store con dinero_restante del backend.
     * - Resalta todos los territorios enemigos como objetivos válidos.
     */
    comprarYPrepararAtaque: async (tecnologiaId: string) => {
        const estado = get();
        if (!estado.salaActiva?.id) return;
        try {
            const res = await gameApi.comprarTecnologia(estado.salaActiva.id, tecnologiaId);
            console.log('[comprarYPrepararAtaque] Habilidad comprada:', tecnologiaId, res);

            // Resaltar territorios enemigos como objetivos válidos
            const territoriosEnemigos = Object.entries(estado.propietarios)
                .filter(([, owner]) => !esMismoJugador(owner, estado.jugadorLocal) && owner)
                .map(([id]) => id);

            set({
                preparandoAtaqueEspecial: tecnologiaId,
                comarcasResaltadas: territoriosEnemigos,
                popupCoords: null,
                origenSeleccionado: null,
                ...(res?.monedas_restantes !== undefined && { monedas: res.monedas_restantes }),
            });
        } catch (error) {
            console.error('[comprarYPrepararAtaque] Error:', error);
            throw error; // Propagamos para que el componente muestre el mensaje
        }
    },

    /**
     * Cancela el modo de selección de objetivo del ataque especial sin ejecutarlo.
     */
    cancelarAtaqueEspecial: () => {
        set({
            preparandoAtaqueEspecial: null,
            comarcasResaltadas: [],
            origenSeleccionado: null,
            popupCoords: null,
        });
    },

    /**
     * Ejecuta el ataque especial sobre el territorio destino seleccionado.
     * Limpia todo el estado del arsenal trás la ejecución (exitosa o no).
     */
    ejecutarAtaqueEspecialBackend: async (destinoId: string) => {
        const estado = get();
        if (!estado.salaActiva?.id || !estado.preparandoAtaqueEspecial) return;

        const tipoAtaque = estado.preparandoAtaqueEspecial;
        const origen = estado.origenSeleccionado ?? undefined;

        // Limpiar estado UI inmediatamente (feedback rápido)
        set({
            preparandoAtaqueEspecial: null,
            comarcasResaltadas: [],
            origenSeleccionado: null,
            destinoSeleccionado: null,
            popupCoords: null,
        });

        try {
            await gameApi.ejecutarAtaqueEspecial(estado.salaActiva.id, tipoAtaque, destinoId, origen);
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
            console.log(`[manejarClickComarca] No es tu turno. (Local: ${estado.jugadorLocal}, Turno: ${estado.turnoActual})`);
            return;
        }

        // BLOQUEO ESTRICTO: Si el territorio está ocupado con una tarea, ignorar clic en REFUERZO o FORTIFICACION
        if (estado.faseActual === 'REFUERZO' || estado.faseActual === 'FORTIFICACION') {
            if (estado.estadosBloqueo?.[comarcaId]) {
                console.warn(`[manejarClickComarca] Territorio ${comarcaId} bloqueado: está trabajando o investigando.`);
                return;
            }
        }

        // ══ INTERCEPCIÓN ATAQUE ESPECIAL ══
        // Si hay una habilidad comprada esperando objetivo, manejamos el clic aquí
        // antes del switch de fases para tener prioridad total.
        if (estado.preparandoAtaqueEspecial) {
            const propietario = String(estado.propietarios[comarcaId]);
            const esEnemigo = propietario && !esMismoJugador(propietario, estado.jugadorLocal);
            if (esEnemigo) {
                get().ejecutarAtaqueEspecialBackend(comarcaId);
            } else {
                // Clic en territorio propio o neutro: cancelar modo objetivo
                get().cancelarAtaqueEspecial();
            }
            return;
        }

        switch (estado.faseActual) {

            case 'REFUERZO': {
                if (estado.propietarios[comarcaId] === estado.jugadorLocal) {
                    // Bloqueo si el territorio está ocupado (trabajando o investigando)
                    if (estado.estadosBloqueo?.[comarcaId]) {
                        console.log(`[manejarClickComarca] Territorio ${comarcaId} ocupado, no se puede reforzar.`);
                        return;
                    }
                    set({ comarcaRefuerzo: comarcaId, tropasAAsignar: Math.max(1, estado.tropasDisponibles ?? 0), popupCoords: coords || null });
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
                        popupCoords: null,
                    });
                    return;
                }

                if (estado.destinoSeleccionado === comarcaId) {
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
                    const enemigosAlcanzables = Array.from(alcanzables).filter(
                        (id) => estado.propietarios[id] !== propietarioOrigen
                    );

                    if (enemigosAlcanzables.length === 0) {
                        console.log('[manejarClickComarca] Origen rodeado por aliados.');
                        return;
                    }

                    set({
                        origenSeleccionado: comarcaId,
                        comarcasResaltadas: enemigosAlcanzables,
                        popupCoords: coords || null,
                    });
                    return;
                }

                if (estado.comarcasResaltadas.includes(comarcaId)) {
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

                if (
                    !estado.origenSeleccionado &&
                    estado.propietarios[comarcaId] === estado.jugadorLocal &&
                    (estado.tropas[comarcaId] ?? 0) > 1
                ) {
                    // Bloqueo si el territorio está ocupado
                    if (estado.estadosBloqueo?.[comarcaId]) {
                        console.log(`[manejarClickComarca] Territorio ${comarcaId} ocupado, no puede ser origen de fortificación.`);
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
                        console.log('[manejarClickComarca] Ningún territorio aliado conectado.');
                        return;
                    }

                    set({
                        origenSeleccionado: comarcaId,
                        comarcasResaltadas: Array.from(alcanzables).filter(id => !estado.estadosBloqueo?.[id]),
                        popupCoords: coords || null,
                    });
                    return;
                }

                if (estado.origenSeleccionado === comarcaId) {
                    set({ origenSeleccionado: null, comarcasResaltadas: [], popupCoords: null });
                    return;
                }

                if (estado.comarcasResaltadas.includes(comarcaId)) {
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

            case 'GESTION':
            case 'ATAQUE_ESPECIAL': {
                // Solo permitimos seleccionar territorios propios
                if (estado.propietarios[comarcaId] === estado.jugadorLocal) {
                    // Toggle selección
                    if (estado.origenSeleccionado === comarcaId) {
                        set({ origenSeleccionado: null, popupCoords: null });
                    } else {
                        set({ origenSeleccionado: comarcaId, popupCoords: coords || null });
                    }
                } else {
                    set({ origenSeleccionado: null, popupCoords: null });
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

            case 'CHAT': {
                const msj = mensaje.mensaje ?? mensaje.data?.mensaje ?? '';
                if (msj === '@@SYS_SYNC_PHASE@@') {
                    const emisor = mensaje.emisor ?? mensaje.data?.emisor ?? '';
                    if (emisor !== get().jugadorLocal) {
                        get().sincronizarEstadoPartida();
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

                // REFREZCO CRÍTICO: Sincronizar estado completo al cambiar de fase
                // para capturar monedas generadas, tecnologías desbloqueadas, etc.
                get().sincronizarEstadoPartida();

                break;
            }

            case 'TROPAS_COLOCADAS': {
                const data = mensaje.data ?? mensaje.payload ?? mensaje;
                const jugadorQueColoca = data.jugador || get().turnoActual;

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
            });
        }
    },
}));