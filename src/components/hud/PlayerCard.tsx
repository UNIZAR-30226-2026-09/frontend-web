import React from 'react';
import './PlayerCard.css';

interface PlayerCardProps {
    idJugador: string;
    nombre: string;
    color: string;
    territorios: number;
    tropas: number;
    isTurnoActual: boolean;
    isLocal: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    idJugador,
    nombre,
    color,
    territorios,
    tropas,
    isTurnoActual,
    isLocal
}) => {
    return (
        <div 
            className={`player-card ${isTurnoActual ? 'turno-actual' : ''} ${isLocal ? 'jugador-local' : ''}`}
            style={{ borderColor: color }}
        >
            <div className="player-card-header">
                <span className="player-name" style={{ color: color }}>
                    {nombre}
                </span>
                {isLocal && <span className="local-badge" style={{ backgroundColor: color }}>(Tú)</span>}
            </div>
            <div className="player-card-stats">
                <div className="stat">
                    <span className="stat-icon">🏰</span>
                    <span className="stat-value">{territorios}</span>
                </div>
                <div className="stat">
                    <span className="stat-icon">⚔️</span>
                    <span className="stat-value">{tropas}</span>
                </div>
            </div>
        </div>
    );
};
