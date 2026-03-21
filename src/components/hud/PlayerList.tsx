import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { PlayerCard } from './PlayerCard';
import './PlayerList.css';

export const PlayerList: React.FC = () => {
    // Suscripción al store
    const { 
        jugadores, 
        jugadorLocal, 
        turnoActual, 
        coloresJugadores,
        getEstadisticasJugador
    } = useGameStore();

    // Escuchamos la capa de propietarios y tropas para forzar re-renderizado
    // al cambiar control de territorios o cantidades
    useGameStore(state => state.propietarios);
    useGameStore(state => state.tropas);

    return (
        <div className="player-list-container">
            {jugadores.map((jugadorId) => {
                const stats = getEstadisticasJugador(jugadorId);
                // Simple capitalización del nombre mockeado 'jugador1' -> 'Jugador1'
                const nombre = jugadorId.charAt(0).toUpperCase() + jugadorId.slice(1);
                
                return (
                    <PlayerCard
                        key={jugadorId}
                        idJugador={jugadorId}
                        nombre={nombre}
                        color={coloresJugadores[jugadorId]}
                        territorios={stats.territorios}
                        tropas={stats.tropas}
                        isTurnoActual={jugadorId === turnoActual}
                        isLocal={jugadorId === jugadorLocal}
                    />
                );
            })}
        </div>
    );
};
