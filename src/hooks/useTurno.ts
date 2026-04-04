import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook para saber si es el turno del jugador local.
 * Compara robustamente IDs numéricos, strings y usernames.
 */
export const useTurno = () => {
    const turnoDe = useGameStore(state => state.turnoActual);
    const user = useAuthStore(state => state.user);

    const miId = user?.id;
    const miUsername = user?.username || user?.nombre_usuario || user?.nombre;

    const esMiTurno = Boolean(
        turnoDe && (
            String(turnoDe) === String(miId) ||
            String(turnoDe) === String(miUsername)
        )
    );

    console.log("🎲 [SISTEMA DE TURNOS]:", { 
        turnoDe: String(turnoDe), 
        miId: String(miId), 
        miUsername: String(miUsername), 
        esMiTurno 
    });

    return {
        turnoDe,
        miId,
        miUsername,
        esMiTurno
    };
};
