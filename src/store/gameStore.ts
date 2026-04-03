import { create } from 'zustand';
import { EstadoJuego, FaseJuego } from '../types/game.types';
import { calcularComarcasEnRango, construirGrafoComarcas } from '../utils/graphUtils';
import { ComarcaDTO } from '../types/mapa.types';
import { fetchApi } from '../services/api';
import { gameApi } from '../services/gameApi';
import { useAuthStore } from './useAuthStore';

export const useGameStore = create<EstadoJuego>((set, get) => ({
    // ESTADO INICIAL (inicializar todo)
    grafoGlobal: null,
    mapaEstatico: null,
    errorMapaEstatico: null,
    
    faseActual: 'DESPLIEGUE',
    modoVista: 'COMARCAS',
    dinero: 0,
    tropasDisponibles: 0,

    jugadorLocal: 'jugador1',
    turnoActual: 'jugador1',
    jugadores: ['jugador1', 'jugador2', 'jugador3', 'jugador4'],

    // Sala activa (lobby): se rellena tras crear o unirse a una partida
    salaActiva: { id: null, codigoInvitacion: null, estado: null, config_max_players: null },

    // Jugadores actualmente en el lobby
    jugadoresLobby: [],

    // true si este cliente creo la sala; false si se unio con codigo
    esCreadorSala: false,

    // Esto cambiará próximamente cuando se conecte con el estado real del backend
    tropas: {},
    propietarios: {},
    coloresJugadores: {
        'jugador1': 'var(--color-jugador-1)',
        'jugador2': 'var(--color-jugador-2)',
        'jugador3': 'var(--color-jugador-3)',
        'jugador4': 'var(--color-jugador-4)'
    },
    origenSeleccionado: null,
    destinoSeleccionado: null,
    comarcasResaltadas: [],
    regionHover: null,
    comarcaDespliegue: null,
    tropasAAsignar: 0,
    mostrarAnimacionRefuerzos: false,
    refuerzosRecibidos: 0,
    isSocketConnected: false,

    preparandoAtaque: false,
    movimientoConquistaPendiente: false,
    origenConquista: null,
    destinoConquista: null,
    preparandoFortificacion: false,

    // ACCIONES

    /**
     * Descarga el mapa estático del backend de forma asíncrona.
     */
    cargarMapaEstatico: async () => {
        try {
            set({ errorMapaEstatico: null });
            const data = await fetchApi('/v1/mapa');
            set({ mapaEstatico: data });
        } catch (error) {
            console.error('Error al cargar mapa estático:', error);
            set({ errorMapaEstatico: 'Fallo de conexión al descargar cartografía.' });
        }
    },

    /**
     * Cambia el modo de visualización del mapa (comarcas o regiones).
     */
    toggleModoVista: () => set((state) => ({
        modoVista: state.modoVista === 'COMARCAS' ? 'REGIONES' : 'COMARCAS'
    })),

    /**
     * Registra la región bajo el cursor del jugador para mostrar el panel de estadísticas.
     * @param {string | null} regionId - ID de la región activa, o null para limpiarla.
     */
    setRegionHover: (regionId: string | null) => set({ regionHover: regionId }),

    /**
     * Limpia cualquier selección activa de tropas o comarcas para evitar cruces impredecibles
     * en la interfaz al cambiar de fase o cancelar una decisión.
     */
    limpiarSeleccion: () => set({
        origenSeleccionado: null,
        destinoSeleccionado: null,
        comarcasResaltadas: []
    }),

    /**
     * Solicita al servidor el cambio de fase.
     */
    pasarFaseBackend: async () => {
        const estado = get();
        if (!estado.salaActiva?.id) return;

        try {
            // Limpiamos selecciones locales antes de llamar
            set({
                origenSeleccionado: null,
                destinoSeleccionado: null,
                comarcasResaltadas: [],
                comarcaDespliegue: null,
                tropasAAsignar: 0
            });
            const resp = await gameApi.pasarFase(estado.salaActiva.id);
            // Aplicamos explícitamente el cambio de fase devuelto por el HTTP para inmediatez visual
            if (resp && resp.nueva_fase) {
                const faseUpper = resp.nueva_fase.toUpperCase();
                set({
                    faseActual: faseUpper === 'REFUERZO' ? 'DESPLIEGUE' : faseUpper,
                    turnoActual: resp.turno_de || estado.turnoActual
                });
            }
            // El backend procesará y enviará un evento WS 'CAMBIO_FASE' que actualizará de nuevo por seguridad localmente.
        } catch (error) {
            console.error('Error al avanzar fase en el servidor:', error);
        }
    },

    /**
     * Cierra el panel de animación de recepción de refuerzos.
     */
    cerrarAnimacionRefuerzos: () => {
        set({ mostrarAnimacionRefuerzos: false });
    },

    /**
     * Permite ajustar cuántas tropas se van a asignar en la comarca temporalmente seleccionada.
     * @param {number} cantidad - Número exacto a pre-asignar validando el máximo disponible.
     */
    setTropasAAsignar: (cantidad: number) => {
        set((state) => {
            if (cantidad < 0 || cantidad > state.tropasDisponibles) return state;
            return { tropasAAsignar: cantidad };
        });
    },

    /**
     * Ejecuta un ataque utilizando el backend y devuelve el resultado matemático al componente.
     */
    ejecutarAtaque: async (origen: string, destino: string, tropas: number) => {
        const estado = get();
        if (!estado.salaActiva?.id) return;

        try {
            const result = await gameApi.atacarTerritorio(estado.salaActiva.id, origen, destino, tropas);
            return result;
        } catch (error) {
            console.error('Llamada a ejecutarAtaque fallida', error);
            throw error;
        }
    },

    /**
     * Comunica al backend mover las tropas de una conquista obligatoria.
     */
    moverTropasConquista: async (tropas: number) => {
        const estado = get();
        if (!estado.salaActiva?.id) return;

        try {
            await gameApi.moverConquista(estado.salaActiva.id, tropas);
        } catch (error) {
            console.error('Llamada a moverTropasConquista fallida', error);
            throw error;
        }
    },

    /**
     * Ejecuta una fortificación de tropas controlada por el backend.
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
                comarcasResaltadas: []
            });
        } catch (error) {
            console.error('Llamada a fortificar fallida', error);
            throw error;
        }
    },

    /**
     * Confirma la orden de despliegue delegando completamente en Server Authoritative logic.
     */
    confirmarDespliegue: async () => {
        const estado = get();
        if (!estado.comarcaDespliegue || estado.tropasAAsignar === 0 || !estado.salaActiva?.id) return;

        try {
            await gameApi.colocarTropas(estado.salaActiva.id, estado.comarcaDespliegue, estado.tropasAAsignar);
            // Ya no restamos tropasDisponibles localmente; será sobreescrito por la respuesta WS ('TROPAS_COLOCADAS' o GET si implementado)
            set({
                comarcaDespliegue: null,
                tropasAAsignar: 0
            });
        } catch (error) {
            console.error('Llamada a colocarTropas fallida', error);
        }
    },

    /**
     * Inicializa la estructura del mapa, construyendo el grafo y simulando datos si es necesario.
     * Esto cambiará próximamente para alimentarse completamente del estado emitido por el backend.
     * @param {ComarcaDTO[]} rawData - Colección de las comarcas parseadas del mapa estático.
     */
    inicializarJuego: (rawData: ComarcaDTO[]) => {
        try {
            const grafo = construirGrafoComarcas(rawData);

            set({
                grafoGlobal: grafo
            });
            console.log('Grafo del mapa inicializado estructuralmente.');
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
        }
    },

    /**
     * Salta a una fase concreta limpiando siempre el estado UI activo.
     * @param {FaseJuego} nuevaFase - La fase objetivo.
     */
    setFase: (nuevaFase: FaseJuego) => {
        set({
            faseActual: nuevaFase,
            origenSeleccionado: null,
            destinoSeleccionado: null,
            comarcasResaltadas: []
        });
    },

    /**
     * Actualiza el diccionario entero de tropas asignadas por el servidor.
     * @param {Record<string, number>} nuevasTropas - Mapa clave: comarca, valor: tropas.
     */
    setTropas: (nuevasTropas: Record<string, number>) => {
        set({ tropas: nuevasTropas });
    },

    /**
     * Sobrescribe el mapeo de dueños de comarcas y paleta en masa, útil tras recibir updates de red.
     */
    setEstadoMundo: (nuevosPropietarios: Record<string, string>, nuevosColores: Record<string, string>) => {
        set({ propietarios: nuevosPropietarios, coloresJugadores: nuevosColores });
    },

    /**
     * Enrutador central de interacciones sobre las áreas geométricas. Reacciona al click
     * dependiendo de nuestra fase y coordina la selección combinando BFS con el render de highlights.
     * @param {string} comarcaId - Identificador único de la región impactada.
     */
    manejarClickComarca: (comarcaId: string) => {
        const estado = get();

        // Control estricto de turnos
        if (estado.turnoActual !== estado.jugadorLocal) {
            console.log('No puedes interactuar, no es tu turno.');
            return;
        }

        switch (estado.faseActual) {
            case 'DESPLIEGUE':
                // Nos aseguramos que no despliegue en territorio hostil
                if (estado.propietarios[comarcaId] === estado.jugadorLocal) {
                    set({
                        comarcaDespliegue: comarcaId,
                        tropasAAsignar: 0
                    });
                }
                break;

            case 'ATAQUE_CONVENCIONAL': {
                const RANGO_ATAQUE_NORMAL = 1;

                // Si ya está preparando el ataque, bloquea clicks de fondo
                if (estado.preparandoAtaque || estado.movimientoConquistaPendiente) {
                    return;
                }

                if (estado.origenSeleccionado === comarcaId) {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: []
                    });
                    return;
                }

                if (estado.destinoSeleccionado === comarcaId) {
                    set({ destinoSeleccionado: null });

                    if (estado.grafoGlobal && estado.origenSeleccionado) {
                        const alcanzables = calcularComarcasEnRango(
                            estado.grafoGlobal,
                            estado.origenSeleccionado,
                            RANGO_ATAQUE_NORMAL
                        );

                        const propietarioOrigen = estado.propietarios[estado.origenSeleccionado];
                        const atacablesMismoJugadorFiltradas = Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] !== propietarioOrigen
                        );

                        set({ comarcasResaltadas: atacablesMismoJugadorFiltradas });
                    }
                    return;
                }

                if (!estado.origenSeleccionado) {
                    // Validar que el origen le pertenece y tiene más de 1 tropa
                    if (estado.propietarios[comarcaId] !== estado.jugadorLocal || estado.tropas[comarcaId] <= 1) {
                        console.log('Origen inválido para atacar');
                        return;
                    }

                    set({ origenSeleccionado: comarcaId });

                    try {
                        if (!estado.grafoGlobal) {
                            console.warn('Grafo no inicializado.');
                            return;
                        }

                        const alcanzables = calcularComarcasEnRango(
                            estado.grafoGlobal,
                            comarcaId,
                            RANGO_ATAQUE_NORMAL
                        );

                        const propietarioOrigen = estado.propietarios[comarcaId];
                        const atacablesMismoJugadorFiltradas = Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] !== propietarioOrigen
                        );

                        set({ comarcasResaltadas: atacablesMismoJugadorFiltradas });
                    } catch (error) {
                        console.error('Error en BFS:', error);
                    }
                    return;
                }

                if (estado.origenSeleccionado && estado.comarcasResaltadas.includes(comarcaId)) {
                    // El usuario procedió a atacar (seleccionó destino válido)
                    set({
                        destinoSeleccionado: comarcaId,
                        preparandoAtaque: true
                    });
                    return;
                }

                // Clic fuera del rango precalculado
                if (estado.origenSeleccionado && !estado.comarcasResaltadas.includes(comarcaId)) {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: []
                    });
                    console.log('Clic fuera del radio de ataque; selección limpiada');
                }

                break;
            }

            case 'FORTIFICACION': {
                const RANGO_MOVIMIENTO = 1; // Movimiento adyacente por ahora

                if (estado.preparandoFortificacion) return;

                if (!estado.origenSeleccionado) {
                    if (estado.propietarios[comarcaId] !== estado.jugadorLocal || estado.tropas[comarcaId] <= 1) {
                        return;
                    }
                    set({ origenSeleccionado: comarcaId });

                    if (estado.grafoGlobal) {
                        const alcanzables = calcularComarcasEnRango(
                            estado.grafoGlobal,
                            comarcaId,
                            RANGO_MOVIMIENTO
                        );
                        // Filtramos solo los territorios propios
                        const propiosAdyacentes = Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] === estado.jugadorLocal
                        );
                        set({ comarcasResaltadas: propiosAdyacentes });
                    }
                    return;
                }

                if (estado.origenSeleccionado === comarcaId) {
                    set({ origenSeleccionado: null, comarcasResaltadas: [] });
                    return;
                }

                if (estado.comarcasResaltadas.includes(comarcaId)) {
                    // Selecciona el destino válido y abre el Modal de Fortificar
                    set({
                        destinoSeleccionado: comarcaId,
                        preparandoFortificacion: true
                    });
                } else {
                    set({ origenSeleccionado: null, destinoSeleccionado: null, comarcasResaltadas: [] });
                }
                break;
            }

            default:
                console.warn(`Clic en comarca no implementado para la fase: ${estado.faseActual}`);
        }
    },

    getEstadisticasJugador: (jugadorId: string) => {
        const estado = get();
        let territorios = 0;
        let tropas = 0;

        Object.entries(estado.propietarios).forEach(([comarcaId, propietario]) => {
            if (propietario === jugadorId) {
                territorios++;
                tropas += estado.tropas[comarcaId] || 0;
            }
        });

        return { territorios, tropas };
    },

    // --- ACCIONES WEBSOCKET ---
    setSocketConnection: (status: boolean) => {
        set({ isSocketConnected: status });
    },

    procesarMensajeSocket: (mensaje: any) => {
        console.log('📡 Mensaje WS recibido:', mensaje);
        const tipo = mensaje.tipo_evento ?? mensaje.type ?? '';

        switch (tipo) {
            case 'NUEVO_JUGADOR':
            case 'JUGADOR_UNIDO': {
                const nuevo = mensaje.data || mensaje.payload || mensaje;
                const id = nuevo.jugador ?? nuevo.usuario_id ?? nuevo.id ?? '';
                const displayName = nuevo.username ?? nuevo.jugador ?? id;
                set((state) => {
                    const yaExiste = state.jugadoresLobby.some((j) => j.id === id || j.id === displayName);
                    if (yaExiste) return state;
                    return {
                        jugadoresLobby: [
                            ...state.jugadoresLobby,
                            { id, username: displayName, numeroJugador: state.jugadoresLobby.length + 1, esCreador: false }
                        ]
                    };
                });
                break;
            }

            case 'DESCONEXION':
            case 'JUGADOR_SALIO': {
                const saliente = mensaje.data || mensaje.payload || mensaje;
                const idSaliente = saliente.jugador ?? saliente.usuario_id ?? saliente.id ?? '';
                set((state) => ({
                    jugadoresLobby: state.jugadoresLobby.filter((j) => j.id !== idSaliente && j.username !== idSaliente)
                }));
                break;
            }

            case 'PARTIDA_INICIADA':
                set((state) => {
                    const payload = mensaje.data || mensaje.payload || mensaje;

                    // The backend map object includes units and owner_id
                    const nuevasTropas: Record<string, number> = {};
                    const nuevosPropietarios: Record<string, string> = {};

                    if (payload.mapa) {
                        for (const [id, t] of Object.entries<any>(payload.mapa)) {
                            nuevasTropas[id] = t.units;
                            nuevosPropietarios[id] = t.owner_id;
                        }
                    }

                    const nuevosJugadores = payload.jugadores ? Object.keys(payload.jugadores) : state.jugadores;
                    const nuevosColores = { ...state.coloresJugadores };
                    let tropasReserva = state.tropasDisponibles;

                    if (payload.jugadores) {
                        for (const [id, jInfo] of Object.entries<any>(payload.jugadores)) {
                            if (jInfo.numero_jugador !== undefined) {
                                const mapColors = ['var(--color-jugador-1)', 'var(--color-jugador-2)', 'var(--color-jugador-3)', 'var(--color-jugador-4)'];
                                nuevosColores[id] = mapColors[(jInfo.numero_jugador - 1) % mapColors.length];
                            } else if (jInfo.color) {
                                nuevosColores[id] = jInfo.color;
                            }
                            if (id === state.jugadorLocal && jInfo.tropas_reserva !== undefined) {
                                tropasReserva = jInfo.tropas_reserva;
                            }
                        }
                    }

                    return {
                        salaActiva: { ...state.salaActiva, estado: 'activa' },
                        faseActual: payload.fase_actual ? (payload.fase_actual.toUpperCase() === 'REFUERZO' ? 'DESPLIEGUE' : payload.fase_actual.toUpperCase()) : 'DESPLIEGUE',
                        turnoActual: payload.turno_de || state.turnoActual,
                        jugadores: nuevosJugadores,
                        coloresJugadores: nuevosColores,
                        tropasDisponibles: tropasReserva,
                        ...(payload.mapa && { tropas: nuevasTropas, propietarios: nuevosPropietarios })
                    }
                });
                break;

            case 'CAMBIO_FASE': {
                const data = mensaje.data || mensaje.payload || mensaje;
                set((state) => {
                    const faseBack = data.nueva_fase ? data.nueva_fase.toUpperCase() : '';
                    return {
                        faseActual: faseBack === 'REFUERZO' ? 'DESPLIEGUE' : faseBack,
                        turnoActual: data.jugador_activo || state.turnoActual
                    };
                });
                break;
            }

            case 'TROPAS_COLOCADAS': {
                const data = mensaje.data || mensaje.payload || mensaje;
                set((state) => ({
                    tropas: {
                        ...state.tropas,
                        [data.territorio]: data.tropas_totales_ahora
                    }
                }));
                break;
            }

            case 'ATAQUE_RESULTADO': {
                const data = mensaje.data || mensaje.payload || mensaje;
                set((state) => {
                    const nuevasTropas = { ...state.tropas };
                    nuevasTropas[data.origen] = nuevasTropas[data.origen] - data.bajas_atacante;
                    nuevasTropas[data.destino] = nuevasTropas[data.destino] - data.bajas_defensor;

                    const nuevosPropietarios = { ...state.propietarios };
                    if (data.victoria) {
                        // El atacante toma el control
                        nuevosPropietarios[data.destino] = state.propietarios[data.origen];
                    }

                    return {
                        tropas: nuevasTropas,
                        propietarios: nuevosPropietarios,
                        ...(data.victoria && {
                            movimientoConquistaPendiente: true,
                            origenConquista: data.origen,
                            destinoConquista: data.destino
                        }),
                        preparandoAtaque: false,
                        origenSeleccionado: data.victoria ? data.origen : null,
                        destinoSeleccionado: data.victoria ? data.destino : null,
                        comarcasResaltadas: []
                    };
                });
                break;
            }

            case 'MOVIMIENTO_CONQUISTA': {
                const data = mensaje.data || mensaje.payload || mensaje;
                set((state) => {
                    const nuevasTropas = { ...state.tropas };
                    nuevasTropas[data.origen] = nuevasTropas[data.origen] - data.tropas;
                    nuevasTropas[data.destino] = nuevasTropas[data.destino] + data.tropas;

                    return {
                        tropas: nuevasTropas,
                        movimientoConquistaPendiente: false,
                        origenConquista: null,
                        destinoConquista: null,
                        origenSeleccionado: null,
                        destinoSeleccionado: null
                    };
                });
                break;
            }

            case 'ACTUALIZACION_MAPA': {
                const payload = mensaje.data || mensaje.payload || mensaje;
                set((state) => {
                    const nuevasTropas: Record<string, number> = {};
                    const nuevosPropietarios: Record<string, string> = {};

                    if (payload.mapa) {
                        for (const [id, t] of Object.entries<any>(payload.mapa)) {
                            nuevasTropas[id] = t.units;
                            nuevosPropietarios[id] = t.owner_id;
                        }
                    }

                    return {
                        faseActual: payload.fase_actual ? payload.fase_actual.toUpperCase() : state.faseActual,
                        turnoActual: payload.turno_de || state.turnoActual,
                        ...(payload.mapa && { tropas: nuevasTropas, propietarios: nuevosPropietarios })
                    }
                });
                break;
            }

            default:
                break;
        }
    },

    /**
     * Crea una nueva partida en el backend y guarda los datos en salaActiva.
     * @param {object} [config] - Configuración opcional de la sala.
     * @param {number} [config.config_max_players=4] - Máximo de jugadores (2-4).
     * @param {string} [config.config_visibility='publica'] - Visibilidad: 'publica' | 'privada'.
     * @param {number} [config.config_timer_seconds=60] - Segundos por turno.
     * @returns {Promise<object|null>} El objeto PartidaRead del backend, o null si falla.
     */
    crearPartidaBackend: async (config = {}) => {
        const payload = {
            config_max_players: config.config_max_players ?? 4,
            config_visibility: config.config_visibility ?? 'publica',
            config_timer_seconds: config.config_timer_seconds ?? 60
        };

        try {
            const data = await fetchApi('/v1/partidas', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const authUser = useAuthStore.getState().user;
            const creadorId = authUser?.username ?? authUser?.nombre_usuario ?? authUser?.nombre ?? 'unknown';

            set({
                salaActiva: {
                    id: data.id,
                    codigoInvitacion: data.codigo_invitacion,
                    estado: data.estado,
                    config_max_players: data.config_max_players
                },
                jugadoresLobby: [
                    { id: creadorId, username: creadorId, numeroJugador: 1, esCreador: true }
                ],
                esCreadorSala: true
            });

            return data;
        } catch (error) {
            console.error('Error al crear la partida:', error);
            throw error;
        }
    },

    /**
     * Une al usuario actual a una sala existente mediante su código de invitación.
     * @param {string} codigo - Código alfanumérico proporcionado por el host.
     * @returns {Promise<object|null>} Objeto JugadorPartidaRead del backend, o null si falla.
     */
    unirsePartidaBackend: async (codigo: string) => {
        try {
            // 1. Unirse a la partida
            const data = await fetchApi(`/v1/partidas/${codigo}/unirse`, { method: 'POST' });
            const authUser = useAuthStore.getState().user;
            const jugadorLocal = authUser?.username ?? authUser?.nombre_usuario ?? authUser?.nombre ?? data.usuario_id;

            // 2. Obtener config de la sala (config_max_players) y su ID desde el listado publico
            let configMaxPlayers = 4;
            let realPartidaId = data.partida_id;

            try {
                const listaPartidas = await fetchApi('/v1/partidas');
                const miPartida = listaPartidas.find((p: any) => p.codigo_invitacion === codigo);
                if (miPartida) {
                    configMaxPlayers = miPartida.config_max_players;
                    realPartidaId = miPartida.id;
                }
            } catch (_) {
                configMaxPlayers = 4;
            }

            if (!realPartidaId) {
                console.warn("No se pudo obtener el ID de la partida del listado público");
                // Intento fallar si no hay ID para WS
                throw new Error("No se pudo localizar el ID de la sala para conectarse.");
            }

            // 3. Construir jugadoresLobby:
            // Usamos la lista de jugadores_en_sala y marcamos al creador
            const jugadoresLobby = (data.jugadores_en_sala || []).map((j: any, index: number) => ({
                id: j.usuario_id,
                username: j.usuario_id,
                numeroJugador: index + 1,
                esCreador: j.usuario_id === data.creador
            }));

            set((state) => ({
                salaActiva: {
                    ...state.salaActiva,
                    id: realPartidaId,
                    config_max_players: configMaxPlayers
                },
                jugadoresLobby,
                jugadorLocal,
                esCreadorSala: false
            }));

            return data;
        } catch (error) {
            console.error('Error al unirse a la partida:', error);
            throw error;
        }
    }
}));