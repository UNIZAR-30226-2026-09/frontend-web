import { GrafoSoberania } from './mapa.types';

/**
 * Tipos de fase por las que transcurre el flujo del juego en un turno.
 */
export type FaseJuego =
    | 'REFUERZO'
    | 'ATAQUE_CONVENCIONAL'
    | 'FORTIFICACION'
    | 'GESTION';

export type ModoVista = 'COMARCAS' | 'REGIONES';

/**
 * Interfaz principal que define el almacén global de estado del juego.
 */
export interface EstadoJuego {
    grafoGlobal: GrafoSoberania | null;
    mapaEstatico: { 
        metadata?: any;
        regions?: Record<string, { name: string; bonus_troops: number; comarcas: string[] }>;
        comarcas: Record<string, { name: string; region_id: string; adjacent_to: string[] }> 
    } | null;
    errorMapaEstatico: string | null;

    faseActual: FaseJuego | null;
    modoVista: ModoVista;
    estadoPartidaLocal: 'JUGANDO' | 'DERROTA' | 'VICTORIA' | 'ESPECTANDO';

    dinero: number;
    tropasDisponibles: number | null;

    // Control de jugadores
    jugadorLocal: string | null;
    turnoActual: string | null;
    jugadores: string[];
    diccionarioJugadores: Record<string, any>;

    // Sala de lobby procedente del backend (tras crear o unirse a partida)
    salaActiva: {
        id: number | null;
        codigoInvitacion: string | null;
        estado: string | null;
        config_max_players?: number | null;
    };

    // Jugadores presentes en el lobby de la sala activa
    jugadoresLobby: { id: string; username: string; numeroJugador: number; color?: string; esCreador?: boolean }[];

    // true si este cliente creo la sala (HOST); false si se unio con codigo (GUEST)
    esCreadorSala: boolean;

    // Colecciones principales de datos en tiempo real
    tropas: Record<string, number>;
    propietarios: Record<string, string>;
    coloresJugadores: Record<string, string>;

    // Estado temporal de interacción en el mapa interactivo
    origenSeleccionado: string | null;
    destinoSeleccionado: string | null;
    popupCoords: { x: number, y: number, orientacionArriba?: boolean } | null;

    // Estado temporal durante la fase de refuerzo
    comarcaRefuerzo: string | null;
    tropasAAsignar: number;
    mostrarAnimacionRefuerzos: boolean;
    refuerzosRecibidos: number;

    // Almacena los identificadores de comarcas a destacar visualmente (alcance)
    comarcasResaltadas: string[];

    // Tácticas y modales de juego
    preparandoAtaque: boolean;
    movimientoConquistaPendiente: boolean;
    origenConquista: string | null;
    destinoConquista: string | null;

    preparandoFortificacion: boolean;

    // Región bajo el puntero del jugador (modo REGIONES)
    regionHover: string | null;

    movimientoRealizadoEnTurno: boolean;

    // Árbol Tecnológico y Gestión
    isArbolTecnologicoOpen: boolean;
    tecnologiasDesbloqueadas: string[];
    territorioTrabajando: string | null;
    territorioInvestigando: string | null;
    /** ID del territorio que abrió el árbol para investigar (antes de limpiar selección) */
    territorioInvestigandoPendiente: string | null;

    /**
     * Inicializa la estructura de grafos y asigna los datos predeterminados.
     * @param {import('./mapa.types').ComarcaDTO[]} rawData JSON de entrada bruto.
     */
    inicializarJuego: (rawData: import('./mapa.types').ComarcaDTO[]) => void;

    /**
     * Descarga el mapa estático del backend y lo guarda en el store.
     */
    cargarMapaEstatico: () => Promise<void>;

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
     * Contabiliza las tropas a depositar en el nodo destino temporal.
     * @param {number} cantidad Valor pre-evaluado de ocupación.
     */
    setTropasAAsignar: (cantidad: number) => void;

    /**
     * Envía la petición al backend para colocar tropas de la reserva.
     */
    confirmarRefuerzo: () => Promise<void>;

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
     * Informa al backend que el jugador actual desea pasar de fase.
     */
    pasarFaseBackend: () => Promise<void>;

    /**
     * Solicita al backend la ejecución de un ataque.
     */
    ejecutarAtaque: (origen: string, destino: string, tropas: number) => Promise<any>;

    /**
     * Mueve tropas post-conquista comunicándolo al backend.
     */
    moverTropasConquista: (tropas: number) => Promise<void>;

    /**
     * Realiza un traslado táctico (fortificación) a través del backend.
     */
    fortificarBackend: (origen: string, destino: string, tropas: number) => Promise<void>;

    /**
     * Enrutador para gestionar la lógica de acción sobre una comarca dependiente de su fase asignada.
     * @param {string} comarcaId Clave identificadora del nodo presionado.
     * @param {{x: number, y: number, orientacionArriba?: boolean}} [coords] Coordenadas en pantalla del territorio.
     */
    manejarClickComarca: (comarcaId: string, coords?: {x: number, y: number, orientacionArriba?: boolean}) => void;

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
    actualizarDesdeSocket: (mensaje: any) => void;

    /**
     * Envía la configuración al backend para crear una nueva sala y persiste los datos en salaActiva.
     * @param {object} [config] - Parámetros opcionales de configuración de la partida.
     * @returns {Promise<object|null>} Objeto PartidaRead devuelto por el servidor, o null si hay error.
     */
    crearPartidaBackend: (config?: {
        config_max_players?: number;
        config_visibility?: 'publica' | 'privada';
        config_timer_seconds?: number;
    }) => Promise<any>;

    /**
     * Une al usuario a una sala existente usando su código de invitación.
     * @param {string} codigo - Código alfanumérico de la sala.
     * @returns {Promise<object|null>} Objeto JugadorPartidaRead del backend, o null si falla.
     */
    unirsePartidaBackend: (codigo: string) => Promise<any>;

    /**
     * Sincroniza el estado completo de la partida desde el servidor.
     */
    sincronizarEstadoPartida: () => Promise<void>;

    /**
     * Informa al backend que el jugador abandona la partida y limpia el estado local.
     */
    abandonarSoberania: () => Promise<void>;

    /**
     * Prepara el estado para mostrar el panel de traslado de tropas tras una conquista exitosa.
     * @param {string} origen - ID de la comarca de origen.
     * @param {string} destino - ID de la comarca conquistada.
     */
    prepararTrasladoConquista: (origen: string, destino: string) => void;

    /**
     * Inyecta un estado dinámico completo en el almacén (desde WS o REST).
     * @param {any} estado - Payload con mapa, jugadores, turno, etc.
     */
    setEstadoDinamico: (estado: any) => void;

    /**
     * Define el estado local de la partida (victoria, derrota, espectador).
     */
    setEstadoPartidaLocal: (estado: 'JUGANDO' | 'DERROTA' | 'VICTORIA' | 'ESPECTANDO') => void;

    /**
     * Alterna la visibilidad del panel del árbol tecnológico.
     */
    toggleArbolTecnologico: () => void;

    /**
     * Establece el listado de tecnologías desbloqueadas.
     */
    setTecnologiasDesbloqueadas: (techs: string[]) => void;

    /**
     * Llama al backend para investigar una nueva tecnología en el territorio actual.
     * @param {string} tecnologiaId 
     * @param {string} territorioId 
     */
    investigarBackend: (tecnologiaId: string, territorioId: string) => Promise<void>;

    /**
     * Llama al backend para poner un territorio a trabajar y generar dinero.
     * @param {string} territorioId 
     */
    trabajarBackend: (territorioId: string) => Promise<void>;
}
