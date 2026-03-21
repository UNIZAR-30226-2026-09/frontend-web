import { GrafoSoberania } from './mapa.types';

/**
 * Tipos de fase por las que transcurre el flujo del juego en un turno.
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
 * Interfaz principal que define el almacén global de estado del juego.
 */
export interface EstadoJuego {
    grafoGlobal: GrafoSoberania | null;

    faseActual: FaseJuego;
    modoVista: ModoVista;

    dinero: number;
    tropasDisponibles: number;

    // Control de jugadores
    jugadorLocal: string;
    turnoActual: string;
    jugadores: string[];

    // Colecciones principales de datos en tiempo real
    tropas: Record<string, number>;
    propietarios: Record<string, string>;
    coloresJugadores: Record<string, string>;

    // Estado temporal de interacción en el mapa interactivo
    origenSeleccionado: string | null;
    destinoSeleccionado: string | null;

    // Estado temporal durante la fase de despliegue
    comarcaDespliegue: string | null;
    tropasAAsignar: number;
    mostrarAnimacionRefuerzos: boolean;
    refuerzosRecibidos: number;

    // Almacena los identificadores de comarcas a destacar visualmente (alcance)
    comarcasResaltadas: string[];

    // Región bajo el puntero del jugador (modo REGIONES)
    regionHover: string | null;

    /**
     * Inicializa la estructura de grafos y asigna los datos predeterminados.
     * @param {import('./mapa.types').ComarcaDTO[]} rawData JSON de entrada bruto.
     */
    inicializarJuego: (rawData: import('./mapa.types').ComarcaDTO[]) => void;

    /**
     * Obliga a la máquina de estados a saltar a una fase específica y limpia la UI.
     * @param {FaseJuego} nuevaFase Fase destino.
     */
    setFase: (nuevaFase: FaseJuego) => void;

    /**
     * Reemplaza masivamente la distribución de tropas en todo el mapa.
     * @param {Record<string, number>} nuevasTropas Mapa con los ID y sus tropas.
     */
    setTropas: (nuevasTropas: Record<string, number>) => void;

    /**
     * Sobrescribe el control territorial de los jugadores y sus asignaciones de color.
     * @param {Record<string, string>} nuevosPropietarios Mapa de ID a dueño.
     * @param {Record<string, string>} nuevosColores Mapa de Jugador a color asignado.
     */
    setEstadoMundo: (nuevosPropietarios: Record<string, string>, nuevosColores: Record<string, string>) => void;

    /**
     * Alterna la visualización jerárquica SVG del mapa (comarcas individuales vs bloque regional).
     */
    toggleModoVista: () => void;

    /**
     * Calcula el monto de refuerzos aplicables según el control base del jugador e inicia la notificación.
     */
    calcularRefuerzos: () => void;

    /**
     * Contabiliza las tropas a depositar en el nodo destino temporal.
     * @param {number} cantidad Valor pre-evaluado de ocupación.
     */
    setTropasAAsignar: (cantidad: number) => void;

    /**
     * Aplica la carga encolada de tropas al inventario real de la comarca destino y cierra la pasarela.
     */
    confirmarDespliegue: () => void;

    /**
     * Oculta el componente notificacional superpuesto de nuevos refuerzos.
     */
    cerrarAnimacionRefuerzos: () => void;

    /**
     * Elimina cualquier bloque de origen/destino y resetea las superposiciones visuales del radio.
     */
    limpiarSeleccion: () => void;

    /**
     * Actualiza la región que el jugador tiene actualmente bajo el puntero del ratón,
     * o la limpia cuando el cursor sale del mapa.
     * @param {string | null} regionId Identificador de la región o null para limpiar.
     */
    setRegionHover: (regionId: string | null) => void;

    /**
     * Conmuta la fase actual procesando secuencialmente el bucle de eventos del juego.
     */
    avanzarFase: () => void;

    /**
     * Enrutador para gestionar la lógica de acción sobre una comarca dependiente de su fase asignada.
     * @param {string} comarcaId Clave identificadora del nodo presionado.
     */
    manejarClickComarca: (comarcaId: string) => void;

    /**
     * Obtiene el total de territorios y tropas de un jugador específico.
     * @param {string} jugadorId Identificador del jugador.
     * @returns {{ territorios: number, tropas: number }} Estadísticas del jugador.
     */
    getEstadisticasJugador: (jugadorId: string) => { territorios: number, tropas: number };

    // Estado de la conexión del socket en tiempo real
    isSocketConnected: boolean;

    /**
     * Actualiza el estado de la conexión con el servidor de WebSockets.
     * @param {boolean} status Estado actual de la conexión.
     */
    setSocketConnection: (status: boolean) => void;

    /**
     * Recibe y procesa los mensajes entrantes emitidos por el servidor a través del WebSocket.
     * @param {any} mensaje Carga útil del mensaje recibido.
     */
    procesarMensajeSocket: (mensaje: any) => void;
}
