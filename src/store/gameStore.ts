import { create } from 'zustand';
import { EstadoJuego, FaseJuego } from '../types/game.types';
import { calcularComarcasEnRango, construirGrafoComarcas } from '../utils/graphUtils';
import { ComarcaDTO } from '../types/mapa.types';

export const useGameStore = create<EstadoJuego>((set, get) => ({
    // ESTADO INICIAL (inicializar todo)
    grafoGlobal: null,
    faseActual: 'DESPLIEGUE',
    origenSeleccionado: null,
    destinoSeleccionado: null,
    comarcasResaltadas: [],

    // ACCIONES

    inicializarJuego: (rawData: ComarcaDTO[]) => {
        try {
            const grafo = construirGrafoComarcas(rawData);
            set({ grafoGlobal: grafo });
            console.log('Grafo del mapa inicializado correctamente.');
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

    // Manejador central de clics en base a la fase activa
    manejarClickComarca: (comarcaId: string) => {
        const estado = get();

        switch (estado.faseActual) {
            case 'DESPLIEGUE':
                // Lógica de despliegue inicial
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
                        set({ comarcasResaltadas: Array.from(alcanzables) });
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

                        set({ comarcasResaltadas: Array.from(alcanzables) });
                    } catch (error) {
                        console.error('Error en BFS:', error);
                    }
                    return;
                }

                // 3. Seleccionar Destino
                if (estado.origenSeleccionado && estado.comarcasResaltadas.includes(comarcaId)) {
                    set({
                        destinoSeleccionado: comarcaId,
                        comarcasResaltadas: []
                    });

                    console.log(`Intento de ataque: ${estado.origenSeleccionado} -> ${comarcaId}`);
                    return;
                }

                // 4. Clic fuera del rango válido
                if (estado.origenSeleccionado && !estado.comarcasResaltadas.includes(comarcaId)) {
                    console.warn(`Comarca ${comarcaId} fuera de rango.`);
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
