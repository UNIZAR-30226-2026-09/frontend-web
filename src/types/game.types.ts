import { GrafoSoberania } from './mapa.types';

/**
 * Fases principales de un turno
 */
export type FaseJuego =
    | 'DESPLIEGUE'
    | 'INVESTIGACION'
    | 'ATAQUE_NORMAL'
    | 'MOVER_TROPAS'
    | 'ATAQUE_ESPECIAL'
    | 'FORTIFICACION';
export type ModoVista = 'COMARCAS' | 'REGIONES';

/**
 * Definimos la maquina de estados
 * 
 */
export interface EstadoJuego {
    grafoGlobal: GrafoSoberania | null;

    faseActual: FaseJuego;
    modoVista: ModoVista;

    // Selección temporal del jugador en la interfaz
    origenSeleccionado: string | null;  // ID de la comarca desde la que se ataca
    destinoSeleccionado: string | null; // ID de la comarca objetivo

    // Comarcas que la se deben resaltar
    comarcasResaltadas: string[];

    /**
     * Carga el JSON crudo del mapa, lo valida y lo inyecta como cerebro del store.
     */
    inicializarJuego: (rawData: import('./mapa.types').ComarcaDTO[]) => void;

    /**
     * Cambia la fase del juego limpiando el estado temporal (resaltados, selecciones).
     */
    setFase: (nuevaFase: FaseJuego) => void;

    /**
     * Alterna la vista activa del mapa
     */
    toggleModoVista: () => void;

    /**
     * Limpia completamente cualquier selección activa en el momento (origen, destino, resaltados)
     */
    limpiarSeleccion: () => void;

    /**
     * Acción principal y universal para interactuar con el mapa.
     * Su comportamiento interno mutará dramáticamente dependiendo de 'faseActual'.
     */
    manejarClickComarca: (comarcaId: string) => void;
}
