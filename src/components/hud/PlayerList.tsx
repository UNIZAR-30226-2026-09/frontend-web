import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PlayerCard } from './PlayerCard';
import './PlayerList.css';

export const PlayerList: React.FC = () => {
    // Suscripción al store
    const { 
        jugadores, 
        jugadorLocal, 
        turnoActual, 
        coloresJugadores,
        diccionarioJugadores,
        getEstadisticasJugador,
        dinero
    } = useGameStore();

    // Escuchamos la capa de propietarios y tropas para forzar re-renderizado
    // al cambiar control de territorios o cantidades
    useGameStore(state => state.propietarios);
    useGameStore(state => state.tropas);

    const user = useAuthStore(state => state.user);
    const miUsername = user?.username || user?.nombre_usuario || user?.nombre;

    return (
        <div className="player-list-container">
            {jugadores.map((jugadorId) => {
                const stats = getEstadisticasJugador(jugadorId);
                const info = diccionarioJugadores ? diccionarioJugadores[jugadorId] : null;
                const nombre = info?.nombre || info?.jugador || info?.username || info?.nombre_usuario || (jugadorId.charAt(0).toUpperCase() + jugadorId.slice(1));
                
                return (
                    <PlayerCard
                        key={jugadorId}
                        idJugador={jugadorId}
                        nombre={nombre}
                        color={coloresJugadores[jugadorId]}
                        territorios={stats.territorios}
                        tropas={stats.tropas}
                        isTurnoActual={String(jugadorId) === String(turnoActual)}
                        isLocal={String(jugadorId) === String(jugadorLocal) || (miUsername && String(nombre).toLowerCase() === String(miUsername).toLowerCase())}
                        isDisconnected={info?.esta_desconectado}
                        dinero={String(jugadorId) === String(jugadorLocal) ? dinero : undefined}
                    />
                );
            })}
        </div>
    );
};
