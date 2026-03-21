import { create } from 'zustand';
import { EstadoJuego, FaseJuego } from '../types/game.types';
import { calcularComarcasEnRango, construirGrafoComarcas } from '../utils/graphUtils';
import { ComarcaDTO } from '../types/mapa.types';

export const useGameStore = create<EstadoJuego>((set, get) => ({
    // ESTADO INICIAL (inicializar todo)
    grafoGlobal: null,
    faseActual: 'DESPLIEGUE',
    modoVista: 'COMARCAS',
    dinero: 0,
    tropasDisponibles: 0,

    jugadorLocal: 'jugador1',
    turnoActual: 'jugador1',
    jugadores: ['jugador1', 'jugador2', 'jugador3', 'jugador4'],

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

    // ACCIONES

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
     * Gestiona la máquina de estados finitos que controla los turnos del juego.
     * Si el jugador está en la fase de despliegue y le sobran tropas, se bloquea la transición 
     * para evitar que pierda sus refuerzos por error. Si todo está correcto, avanza a la siguiente fase 
     * y purga las selecciones anteriores.
     */
    avanzarFase: () => {
        const fasesOrden: FaseJuego[] = [
            'DESPLIEGUE',
            'INVESTIGACION',
            'ATAQUE_NORMAL',
            'MOVER_TROPAS',
            'ATAQUE_ESPECIAL',
            'FORTIFICACION'
        ];

        if (get().faseActual === 'DESPLIEGUE' && get().tropasDisponibles > 0) {
            console.log('No se puede avanzar: Faltan tropas por desplegar');
            return;
        }

        set((state) => {
            const indexActual = fasesOrden.indexOf(state.faseActual);
            const siguienteIndex = (indexActual + 1) % fasesOrden.length;
            const nuevaFase = fasesOrden[siguienteIndex];

            if (nuevaFase === 'DESPLIEGUE') {
                setTimeout(() => get().calcularRefuerzos(), 10);
            }

            return {
                faseActual: nuevaFase,
                origenSeleccionado: null,
                destinoSeleccionado: null,
                comarcasResaltadas: [],
                comarcaDespliegue: null,
                tropasAAsignar: 0
            };
        });
    },

    /**
     * Calcula los refuerzos correspondientes al jugador basándose en su control territorial.
     * Cuenta las comarcas poseídas (por ahora del jugador 1) y divide entre 3, asegurando siempre
     * un mínimo de 3 tropas para mantener el equilibrio del juego clásico.
     */
    calcularRefuerzos: () => {
        set((state) => {
            const misComarcas = Object.values(state.propietarios).filter(p => p === 'jugador1').length;
            const refuerzos = Math.max(3, Math.floor(misComarcas / 3));

            return {
                tropasDisponibles: state.tropasDisponibles + refuerzos,
                mostrarAnimacionRefuerzos: true,
                refuerzosRecibidos: refuerzos
            };
        });
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
     * Confirma la orden de despliegue UI, moviendo el buffer temporal (tropasAAsignar)
     * a la guarnición global inmutable para no causar problemas con React.
     */
    confirmarDespliegue: () => {
        set((state) => {
            if (!state.comarcaDespliegue || state.tropasAAsignar === 0) return state;

            const nuevasTropas = { ...state.tropas };
            nuevasTropas[state.comarcaDespliegue] = (nuevasTropas[state.comarcaDespliegue] || 0) + state.tropasAAsignar;

            return {
                tropasDisponibles: state.tropasDisponibles - state.tropasAAsignar,
                tropas: nuevasTropas,
                comarcaDespliegue: null,
                tropasAAsignar: 0
            };
        });
    },

    /**
     * Inicializa la estructura del mapa, construyendo el grafo y simulando datos si es necesario.
     * Esto cambiará próximamente para alimentarse completamente del estado emitido por el backend.
     * @param {ComarcaDTO[]} rawData - Colección de las comarcas parseadas del mapa estático.
     */
    inicializarJuego: (rawData: ComarcaDTO[]) => {
        try {
            const grafo = construirGrafoComarcas(rawData);

            // Esto cambiará próximamente (datos controlados desde el backend)
            const mockTropas: Record<string, number> = {};
            const mockPropietarios: Record<string, string> = {};
            const jugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];

            rawData.forEach((comarca, index) => {
                const jugadorAsignado = jugadores[index % jugadores.length];
                mockPropietarios[comarca.id] = jugadorAsignado;
                mockTropas[comarca.id] = Math.floor(Math.random() * 10) + 1;
            });

            set({
                grafoGlobal: grafo,
                tropas: mockTropas,
                propietarios: mockPropietarios
            });
            console.log('Grafo del mapa inicializado correctamente.');

            get().calcularRefuerzos();
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

        switch (estado.faseActual) {
            case 'DESPLIEGUE':
                // Nos aseguramos que no despliegue en territorio hostil
                if (estado.propietarios[comarcaId] === 'jugador1') {
                    set({
                        comarcaDespliegue: comarcaId,
                        tropasAAsignar: 0
                    });
                }
                break;

            case 'INVESTIGACION':
                // Lógica de desarrollo e investigación
                break;

            case 'ATAQUE_NORMAL': {
                const RANGO_ATAQUE_NORMAL = 1;

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
                    set({
                        destinoSeleccionado: comarcaId,
                        comarcasResaltadas: []
                    });

                    console.log(`Intento de ataque: ${estado.origenSeleccionado} -> ${comarcaId}`);
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

            case 'MOVER_TROPAS':
                // Por implementar
                break;

            case 'ATAQUE_ESPECIAL':
                // Por implementar
                break;

            case 'FORTIFICACION':
                // Por implementar
                break;

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
        console.log("📡 Mensaje WS recibido en Zustand:", mensaje);
        // Aquí irá el switch gigante (Dispatcher) cuando el backend empiece a mandar ataques y turnos
        // switch(mensaje.type) { case 'ACTUALIZAR_TROPAS': ... }
    }
}));