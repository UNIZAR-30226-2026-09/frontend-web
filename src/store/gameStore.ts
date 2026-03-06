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
    // esto se machacará con lo que venga del backend, de momento empieza vacío
    // para rellenarse luego al inicializar el mapa
    tropas: {},
    propietarios: {},
    coloresJugadores: {
        'jugador1': '#3B82F6',
        'jugador2': '#EF4444',
        'jugador3': '#10B981',
        'jugador4': '#F59E0B'
    },
    origenSeleccionado: null,
    destinoSeleccionado: null,
    comarcasResaltadas: [],
    comarcaDespliegue: null,
    tropasAAsignar: 0,
    mostrarAnimacionRefuerzos: false,
    refuerzosRecibidos: 0,

    // ACCIONES

    toggleModoVista: () => set((state) => ({
        modoVista: state.modoVista === 'COMARCAS' ? 'REGIONES' : 'COMARCAS'
    })),

    limpiarSeleccion: () => set({
        origenSeleccionado: null,
        destinoSeleccionado: null,
        comarcasResaltadas: []
    }),

    /**
     * @function avanzarFase
     * @description gestiona la máquina de estados finitos que controla los turnos del juego.
     * si el jugador está en la fase de Despliegue y le sobran tropas en el inventario,
     * bloquea la transición para evitar que se salte el paso y pierda los refuerzos.
     * si todo está ok, pasa a la siguiente fase y limpia las variables basura que hayan 
     * quedado de la fase anterior (orígenes, destinos, etc).
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

        // si nos quedan tropas por desplegar, bloqueamos el paso de fase
        if (get().faseActual === 'DESPLIEGUE' && get().tropasDisponibles > 0) {
            console.log("No se puede avanzar: Faltan tropas por desplegar");
            return;
        }

        set((state) => {
            const indexActual = fasesOrden.indexOf(state.faseActual);
            // la última fase vuelve al principio, luego habrá que hacer bien el final de turno
            const siguienteIndex = (indexActual + 1) % fasesOrden.length;
            const nuevaFase = fasesOrden[siguienteIndex];

            // calcular los refuerzos si acabamos de empezar la fase de despliegue
            if (nuevaFase === 'DESPLIEGUE') {
                setTimeout(() => get().calcularRefuerzos(), 10);
            }

            return { // limpiar selecciones al cambiar de fase
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
     * @function calcularRefuerzos
     * @description función tirada para contar los refuerzos que le tocan a un jugador
     * basándose en las comarcas que tiene. lee la longitud del array filtrado
     * por las propiedades del jugador 1 y lo divide entre 3 (como en las reglas del TEG originales).
     * siempre devuelve 3 como mínimo gracias al math.max.
     */
    calcularRefuerzos: () => {
        set((state) => {
            // asumimos que el cliente local es siempre el jugador 1 por ahora
            const misComarcas = Object.values(state.propietarios).filter(p => p === 'jugador1').length;
            const refuerzos = Math.max(3, Math.floor(misComarcas / 3)); // 3 es el mínimo de refuerzos
            return {
                tropasDisponibles: state.tropasDisponibles + refuerzos,
                mostrarAnimacionRefuerzos: true,
                refuerzosRecibidos: refuerzos
            };
        });
    },

    cerrarAnimacionRefuerzos: () => {
        set({ mostrarAnimacionRefuerzos: false });
    },

    setTropasAAsignar: (cantidad: number) => {
        set((state) => {
            if (cantidad < 0 || cantidad > state.tropasDisponibles) return state;
            return { tropasAAsignar: cantidad };
        });
    },

    /**
     * @function confirmarDespliegue
     * @description método para confirmar el botón del UI y vaciar el buffer temporal
     * de tropasAAsignar al diccionario principal de tropas. hace una copia destructurada
     * para no mutar el estado de zustand a lo loco (react se queja).
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
     * @function inicializarJuego
     * @description método que se llama justo al arrancar la pantalla y hace el data ingestion.
     * carga toda las mierdas del JSON crudo, llama a la utilidad constructora de grafos,
     * e inicializa todos los diccionarios del estado con IDs inventados temporalmente.
     * @param rawData {ComarcaDTO[]} array con información geoespacial de cada nodo del mapa
     * @throws {Error} si el JSON está mal formado o las coordenadas rompen el parser
     */
    inicializarJuego: (rawData: ComarcaDTO[]) => {
        try {
            const grafo = construirGrafoComarcas(rawData);

            // datos mock temporales para probar la UI
            // asignamos dueños en orden y tropas aleatorias
            const mockTropas: Record<string, number> = {};
            const mockPropietarios: Record<string, string> = {};
            const jugadores = ['jugador1', 'jugador2', 'jugador3', 'jugador4'];

            rawData.forEach((comarca, index) => {
                const jugadorAsignado = jugadores[index % jugadores.length];
                mockPropietarios[comarca.id] = jugadorAsignado;

                // de 1 a 10 tropas aleatorias para que no esté vacío
                mockTropas[comarca.id] = Math.floor(Math.random() * 10) + 1;
            });

            set({
                grafoGlobal: grafo,
                tropas: mockTropas,
                propietarios: mockPropietarios
            });
            console.log('grafo del mapa inicializado correctamente.');

            // calcular los refuerzos iniciales para tener tropas al arrancar
            get().calcularRefuerzos();
        } catch (error) {
            console.error('Error al inicializar el mapa:', error);
        }
    },

    // Transiciones del estado de la partida
    setFase: (nuevaFase: FaseJuego) => {
        set({
            faseActual: nuevaFase,
            origenSeleccionado: null,
            destinoSeleccionado: null,
            comarcasResaltadas: []
        });
    },

    setTropas: (nuevasTropas: Record<string, number>) => {
        set({ tropas: nuevasTropas });
    },

    setEstadoMundo: (nuevosPropietarios: Record<string, string>, nuevosColores: Record<string, string>) => {
        set({ propietarios: nuevosPropietarios, coloresJugadores: nuevosColores });
    },

    /**
     * @function manejarClickComarca
     * @description el router gigante que decide qué demonios debe hacer el click
     * basándose en qué fase del juego nos encontremos actualmente. es el backend del frontend.
     * en despliegue te setea la variable para desplegar. en ataque monta toda la parafernalia
     * de ir seleccionando el nodo origen, pintar con BFS y luego capturar click en nodos
     * destino usando la lista de comarcas alcanzables.
     * @param comarcaId {string} la id del polígono SVG que tiró el onClick
     */
    manejarClickComarca: (comarcaId: string) => {
        const estado = get();

        switch (estado.faseActual) {
            case 'DESPLIEGUE':
                // comprobamos que la comarca seleccionada sea nuestra
                if (estado.propietarios[comarcaId] === 'jugador1') {
                    set({
                        comarcaDespliegue: comarcaId,
                        tropasAAsignar: 0 // reiniciar contador al cambiar de comarca
                    });
                }
                break;

            case 'INVESTIGACION':
                // Lógica de desarrollo e investigación
                break;

            case 'ATAQUE_NORMAL': {
                const RANGO_ATAQUE_NORMAL = 1;

                // 1.A Deseleccionar origen
                if (estado.origenSeleccionado === comarcaId) {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: []
                    });
                    return;
                }

                // 1.B Deseleccionar destino (y recalcular posibles ataques)
                if (estado.destinoSeleccionado === comarcaId) {
                    set({ destinoSeleccionado: null });

                    if (estado.grafoGlobal && estado.origenSeleccionado) {
                        const alcanzables = calcularComarcasEnRango(
                            estado.grafoGlobal,
                            estado.origenSeleccionado,
                            RANGO_ATAQUE_NORMAL
                        );

                        // evitamos fuego amigo filtrando nuestras propias comarcas
                        const propietarioOrigen = estado.propietarios[estado.origenSeleccionado];
                        const atacablesMismoJugadorFiltradas = Array.from(alcanzables).filter(
                            (id) => estado.propietarios[id] !== propietarioOrigen
                        );

                        set({ comarcasResaltadas: atacablesMismoJugadorFiltradas });
                    }
                    return;
                }

                // 2. Seleccionar Origen
                if (!estado.origenSeleccionado) {
                    set({ origenSeleccionado: comarcaId });

                    try {
                        if (!estado.grafoGlobal) {
                            console.warn("Grafo no inicializado.");
                            return;
                        }

                        const alcanzables = calcularComarcasEnRango(
                            estado.grafoGlobal,
                            comarcaId,
                            RANGO_ATAQUE_NORMAL
                        );

                        // también filtramos el fuego amigo por si cambió el origen
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

                // 3. seleccionar a quién atacamos
                if (estado.origenSeleccionado && estado.comarcasResaltadas.includes(comarcaId)) {
                    set({
                        destinoSeleccionado: comarcaId,
                        comarcasResaltadas: []
                    });

                    console.log(`Intento de ataque: ${estado.origenSeleccionado} -> ${comarcaId}`);
                    return;
                }

                // 4. limpiar estado si hace clic fuera de las opciones válidas
                if (estado.origenSeleccionado && !estado.comarcasResaltadas.includes(comarcaId)) {
                    set({
                        origenSeleccionado: null,
                        destinoSeleccionado: null,
                        comarcasResaltadas: []
                    });
                    console.log('clic fuera del radio de ataque; selección limpiada');
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
    }
}));