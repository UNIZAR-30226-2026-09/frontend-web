import { GrafoSoberania } from './mapa.types';

/**
 * las fases en el orden en el que se juegan
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
 * la chicha del juego, aquí está guardado todo lo que pasa en la partida
 */
export interface EstadoJuego {
    grafoGlobal: GrafoSoberania | null;

    faseActual: FaseJuego;
    modoVista: ModoVista;

    dinero: number;
    tropasDisponibles: number;

    // guardamos quién tiene cada sitio, cuántas tropas y de qué color es cada uno
    tropas: Record<string, number>;
    propietarios: Record<string, string>;
    coloresJugadores: Record<string, string>;

    // para saber qué comarcas ha clicado el jugador ahora mismo
    origenSeleccionado: string | null;  // desde dónde atacamos
    destinoSeleccionado: string | null; // a quién le pegamos

    // variables sueltas para cuando te toca poner refuerzos al empezar
    comarcaDespliegue: string | null; // el sitio donde haces clic para meterlas
    tropasAAsignar: number; // lo que escribes en el cuadrito
    mostrarAnimacionRefuerzos: boolean; // para enseñar el cartel ese gigante en medio
    refuerzosRecibidos: number; // lo guardamos para enseñarlo en el cartel

    // lista de ids que tenemos que iluminar en amarillo (o en el color que toque)
    comarcasResaltadas: string[];

    /**
     * le pasamos el json y nos monta todo el grafo y los datos por defecto para empezar
     */
    inicializarJuego: (rawData: import('./mapa.types').ComarcaDTO[]) => void;

    /**
     * fuerza el cambio de fase y borra lo que tuvieras clicado para que no haya bugs
     */
    setFase: (nuevaFase: FaseJuego) => void;

    /**
     * pisa las tropas de todo el mapa por las de este objeto (pensado para el backend)
     */
    setTropas: (nuevasTropas: Record<string, number>) => void;

    /**
     * igual que el de arriba pero para machacar de quién es cada comarca
     */
    setEstadoMundo: (nuevosPropietarios: Record<string, string>, nuevosColores: Record<string, string>) => void;

    /**
     * cambia entre el modo de ver comarcas sueltas o el modo provincias/regiones
     */
    toggleModoVista: () => void;

    /**
     * funciones sueltas que llamamos solo cuando estamos repartiendo tropas
     */
    calcularRefuerzos: () => void;
    setTropasAAsignar: (cantidad: number) => void;
    confirmarDespliegue: () => void;
    cerrarAnimacionRefuerzos: () => void;

    /**
     * borra los clics a fuego, viene de lujo cuando cancelas un ataque a mitad
     */
    limpiarSeleccion: () => void;

    /**
     * pasa al siguiente string del enum FaseJuego, y si estamos en el último vuelve a empezar
     */
    avanzarFase: () => void;

    /**
     * el núcleo del mapa: le pasas dónde ha hecho clic y él solo sabe si la lía 
     * o si es un ataque, dependiendo en qué fase estemos
     */
    manejarClickComarca: (comarcaId: string) => void;
}
