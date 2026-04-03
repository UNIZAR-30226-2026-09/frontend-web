import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook para extraer el perfil exacto del jugador local desde el diccionario 
 * del servidor emparejándolo por username contra la sesión autenticada.
 */
export const useJugadorLocal = () => {
    const user = useAuthStore(state => state.user);
    const miUsername = user?.username || user?.nombre_usuario || user?.nombre;
    const jugadores = useGameStore(state => state.diccionarioJugadores || {});

    // Devolvemos el objeto del jugador cuyo nombre coincida en el diccionario
    return useMemo(() => {
        if (!miUsername) return undefined;
        const normalizedMiUsername = String(miUsername).toLowerCase();
        return Object.values(jugadores).find(j => 
            (j.nombre && String(j.nombre).toLowerCase() === normalizedMiUsername) || 
            (j.jugador && String(j.jugador).toLowerCase() === normalizedMiUsername) || 
            (j.username && String(j.username).toLowerCase() === normalizedMiUsername)
        );
    }, [jugadores, miUsername]);
};
