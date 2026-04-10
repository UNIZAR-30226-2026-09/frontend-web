// src/components/social/PanelEstadisticas.tsx
import React from 'react';
import { EstadisticasJugador } from '../../types/social.types';
import '../../styles/PanelEstadisticas.css';

interface Props {
    estadisticas: EstadisticasJugador | null;
    isLoading: boolean;
}

const PanelEstadisticas: React.FC<Props> = ({ estadisticas, isLoading }) => {
    if (isLoading) {
        return (
            <div className="panel-estadisticas cargando">
                <div className="loader-radar"></div>
                <p>Decodificando historial de batalla...</p>
            </div>
        );
    }

    if (!estadisticas) {
        return (
            <div className="panel-estadisticas vacio">
                <p>No se han encontrado registros de combate.</p>
            </div>
        );
    }

    return (
        <div className="panel-estadisticas">
            <h2 className="titulo-panel">ESTADÍSTICAS GLOBALES</h2>
            <div className="divisor-dorado"></div>

            <div className="stats-grid">
                <div className="stat-card destacado">
                    <span className="stat-label">Winrate</span>
                    <span className="stat-value">{estadisticas.winrate}%</span>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Partidas Jugadas</span>
                    <span className="stat-value">{estadisticas.num_partidas_jugadas}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Victorias Totales</span>
                    <span className="stat-value">{estadisticas.num_partidas_ganadas}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Bajas Inemigas</span>
                    <span className="stat-value">{estadisticas.num_soldados_matados}</span>
                </div>

                <div className="stat-card">
                    <span className="stat-label">Territorios Conquistados</span>
                    <span className="stat-value">{estadisticas.num_res_conquistadas}</span>
                </div>

                <div className="stat-card favorita">
                    <span className="stat-label">Región Favorita</span>
                    <span className="stat-value">
                        {estadisticas.region_favorita ? estadisticas.region_favorita : 'Ninguna (Aún)'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PanelEstadisticas;