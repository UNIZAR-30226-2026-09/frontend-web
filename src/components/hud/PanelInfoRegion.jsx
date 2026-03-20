import React from 'react';
import { useGameStore } from '../../store/gameStore';
import mapData from '../../data/map_aragon.json';
import '../../styles/PanelInfoRegion.css';

// Jugador local actual — sustituir por el valor real cuando se conecte el backend
const JUGADOR_LOCAL = 'jugador1';

/**
 * Calcula el dominio territorial de un jugador sobre una región concreta.
 *
 * @param {string} idRegion    - Identificador de la región a evaluar.
 * @param {string} jugador     - Identificador del jugador local.
 * @param {Record<string, string>} propietarios - Mapa comarca → jugador propietario.
 * @returns {{ total: number, poseeJugador: number, porcentaje: number }}
 */
const calcularDominioRegion = (idRegion, jugador, propietarios) => {
    const regionData = mapData.regions[idRegion];

    if (!regionData) {
        return { total: 0, poseeJugador: 0, porcentaje: 0 };
    }

    const comarcasRegion = regionData.comarcas;
    const total          = comarcasRegion.length;
    const poseeJugador   = comarcasRegion.filter((id) => propietarios[id] === jugador).length;
    const porcentaje     = total > 0 ? Math.round((poseeJugador / total) * 100) : 0;

    return { total, poseeJugador, porcentaje };
};

/**
 * Panel flotante que muestra estadísticas de dominio sobre la región
 * que el jugador tiene bajo el cursor en el modo de vista por regiones.
 *
 * @returns {JSX.Element|null}
 */
const PanelInfoRegion = () => {
    const modoVista    = useGameStore((state) => state.modoVista);
    const regionHover  = useGameStore((state) => state.regionHover);
    const propietarios = useGameStore((state) => state.propietarios);

    // Solo se muestra en modo REGIONES con una región activa
    if (modoVista !== 'REGIONES') return null;
    if (!regionHover) return null;

    const regionData = mapData.regions[regionHover];

    if (!regionData) return null;

    const { total, poseeJugador, porcentaje } = calcularDominioRegion(regionHover, JUGADOR_LOCAL, propietarios);

    return (
        <div className="panel-info-region">
            <h3 className="panel-info-region__titulo">
                {regionData.name.toUpperCase()}
            </h3>

            <p className="panel-info-region__dominio-texto">
                Tu dominio: <strong>{poseeJugador} / {total}</strong> comarcas
            </p>

            {/* Barra de progreso de dominio */}
            <div className="panel-info-region__barra-fondo">
                <div
                    className="panel-info-region__barra-relleno"
                    style={{ width: `${porcentaje}%` }}
                />
            </div>

            <p className="panel-info-region__porcentaje">
                {porcentaje}%
            </p>

            <p className="panel-info-region__bonus">
                Bonus de región: +{regionData.bonus_troops} tropas
            </p>
        </div>
    );
};

export default PanelInfoRegion;
