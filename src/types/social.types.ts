// src/types/social.types.ts

/**
 * Representa las estadísticas globales e históricas de un jugador.
 * Este modelo coincide exactamente con el JSON que devuelve el backend.
 */
export interface EstadisticasJugador {
    nombre_user: string;
    num_partidas_jugadas: number;
    num_partidas_ganadas: number;
    num_continentes_conquistados: number;
    num_regiones_conquistadas: number;
    num_soldados_matados: number;
    winrate: number;
    region_mas_conquistada: string;
    posicion_ranking?: number; // Puesto en el ranking global
    avatar?: string;
}

/**
 * Los diferentes estados en los que puede estar un amigo.
 * Útil para pintar los puntitos de colores o cambiar los botones disponibles.
 */
export type EstadoPresencia = 'ONLINE' | 'JUGANDO' | 'EN_LOBBY' | 'DESCONECTADO';

/**
 * Representa la información de un jugador en la lista de amigos.
 */
export interface Amigo {
    username: string;
    estado: EstadoPresencia;
    // Guardamos la ID de la sala si está jugando o en lobby para habilitar el botón de "Espectar" o "Unirse"
    salaActivaId?: string | null;
    // Por si en un futuro le metéis fotos de perfil
    avatarUrl?: string;
}