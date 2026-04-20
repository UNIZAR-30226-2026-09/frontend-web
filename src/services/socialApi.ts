// src/services/socialApi.ts
import { fetchApi } from './api';
import { EstadisticasJugador, Amigo } from '../types/social.types';

/**
 * Servicio para gestionar las llamadas al backend relacionadas con la parte social:
 * Estadísticas, amigos, buscar jugadores, etc.
 */
export const socialApi = {
    /**
     * Obtiene las estadísticas históricas de un jugador.
     * @returns {Promise<EstadisticasJugador>} JSON con las estadísticas calculadas.
     */
    obtenerEstadisticas: async (): Promise<EstadisticasJugador> => {
        return await fetchApi(`/v1/estadisticas/me`, {
            method: 'GET',
        });
    },

    /**
     * Obtiene la lista actual de amigos del jugador logueado junto con su estado de conexión.
     * @returns {Promise<Amigo[]>} Lista de amigos.
     */
    obtenerAmigos: async (): Promise<Amigo[]> => {
        return await fetchApi('/v1/amigos', {
            method: 'GET',
        });
    },

    /**
     * Envía una solicitud de amistad a otro jugador.
     * @param {string} usernameDestino - Jugador al que queremos agregar.
     */
    enviarSolicitudAmistad: async (usernameDestino: string): Promise<void> => {
        return await fetchApi('/v1/amigos/solicitar', {
            method: 'POST',
            body: JSON.stringify({ user_2: usernameDestino }),
        });
    },

    /**
     * Obtiene la lista de solicitudes de amistad pendientes.
     */
    obtenerSolicitudes: async () => {
        return await fetchApi('/v1/amigos/solicitudes', {
            method: 'GET',
        });
    },

    /**
     * Acepta o rechaza una solicitud de amistad.
     * @param {number} solicitudId - ID de la solicitud.
     * @param {'ACEPTADA' | 'RECHAZADA'} estado - La decisión tomada.
     */
    procesarSolicitud: async (solicitudId: number, estado: 'ACEPTADA' | 'RECHAZADA') => {
        return await fetchApi(`/v1/amigos/solicitudes/${solicitudId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: estado }),
        });
    }

};

