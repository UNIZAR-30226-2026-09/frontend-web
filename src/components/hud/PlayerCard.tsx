import React from 'react';
import { BASE_URL } from '../../services/api';
import { useGameStore } from '../../store/gameStore';
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
    monedas?: number;
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
    avatar,
    monedas
}) => {
    const mensajesActivos = useGameStore(state => state.mensajesActivos);
    const activeMessage = mensajesActivos[idJugador];

    return (
        <div className={`player-card-wrapper ${isTurnoActual ? 'turno-actual' : ''}`}>

            {/* Avatar: capa superior, se superpone sobre la info-box */}
            <div style={{ position: 'relative', zIndex: 3 }}>
                {activeMessage && (
                    <div className="chat-bubble" style={{ '--bubble-border-color': color }}>
                        {activeMessage.tipo === 'reaccion' ? (
                            <img
                                src={`${BASE_URL}/static/reacciones/${activeMessage.contenido}`}
                                alt="reaccion"
                                className="chat-bubble-reaccion"
                            />
                        ) : (
                            <span className="chat-bubble-mensaje">{activeMessage.contenido}</span>
                        )}
                    </div>
                )}
                <img
                    src={`${BASE_URL}${avatar || '/static/perfiles/default.png'}`}
                    alt={nombre}
                    className="player-avatar-badge"
                    style={{ borderColor: color, boxShadow: `0 0 0 3px ${color}33` }}
                />
            </div>

            {/* Caja de información: margen negativo izquierdo para el efecto solapado */}
            <div className="player-info-box" style={{ borderColor: color }}>

                {/* Badge "(Tú)" absoluto en esquina superior derecha */}
                {isLocal && (
                    <span className="local-badge" style={{ backgroundColor: color }}>Tú</span>
                )}

                {/* Nombre centrado */}
                <div className="player-info-name">
                    <span style={{ color: color }}>
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
                    {monedas !== undefined && monedas !== null && (
                        <div className="stat">
                            <span className="stat-icon" style={{ filter: 'grayscale(0)' }}>🪙</span>
                            <span className="stat-value" style={{ color: '#F6E05E', textShadow: '0 0 4px rgba(246, 224, 94, 0.4)' }}>{monedas}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
