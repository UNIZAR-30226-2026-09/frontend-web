import React from 'react';
import { BASE_URL } from '../../services/api';
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
    avatar?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    idJugador,
    nombre,
    color,
    territorios,
    tropas,
    isTurnoActual,
    isLocal,
    isDisconnected,
    avatar
}) => {
    return (
        <div className={`player-card-wrapper ${isTurnoActual ? 'turno-actual' : ''}`}>

            {/* Avatar: capa superior, se superpone sobre la info-box */}
            <img
                src={`${BASE_URL}${avatar || '/static/perfiles/default.png'}`}
                alt={nombre}
                className="player-avatar-badge"
                style={{ borderColor: color, boxShadow: `0 0 0 3px ${color}33` }}
            />

            {/* Caja de información: margen negativo izquierdo para el efecto solapado */}
            <div className="player-info-box" style={{ borderColor: color }}>

                {/* Badge "(Tú)" absoluto en esquina superior derecha */}
                {isLocal && (
                    <span className="local-badge" style={{ backgroundColor: color }}>Tú</span>
                )}
                {isDisconnected && (
                    <span className="disconnected-badge" title="Conexión perdida">⚠️</span>
                )}

                {/* Nombre centrado */}
                <div className="player-info-name">
                    <span style={{ color: color, opacity: isDisconnected ? 0.5 : 1 }}>
                        {nombre}
                    </span>
                </div>

                <hr className="player-info-separator" />

                {/* Stats centrados en fila */}
                <div className="player-info-stats">
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
        </div>
    );
};
