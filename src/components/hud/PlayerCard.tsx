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
    isDisconnected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    idJugador,
    nombre,
    color,
    territorios,
    tropas,
    isTurnoActual,
    isLocal,
    isDisconnected
}) => {
    return (
        <div 
            className={`player-card ${isTurnoActual ? 'turno-actual' : ''} ${isLocal ? 'jugador-local' : ''}`}
            style={{ borderColor: color }}
        >
            <div className="player-card-header">
                <span className="player-name" style={{ color: color, opacity: isDisconnected ? 0.5 : 1 }}>
                    {nombre}
                </span>
                {isLocal && <span className="local-badge" style={{ backgroundColor: color }}>(Tú)</span>}
                {isDisconnected && <span className="disconnected-badge" title="Conexión perdida">⚠️ OFF</span>}
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
