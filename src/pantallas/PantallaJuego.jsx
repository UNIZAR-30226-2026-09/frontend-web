import React, { useEffect } from 'react';
import CabeceraJuego from '../components/hud/CabeceraJuego';
import { PlayerList } from '../components/hud/PlayerList';
import Tablero from '../components/map/Tablero';
import { socketService } from '../services/socketService';

/**
 * Pantalla principal del juego que junta el HUD superior y el mapa interactivo.
 * @returns {JSX.Element}
 */
const PantallaJuego = () => {
    useEffect(() => {
        // Conectamos al WebSocket cuando el componente se monta
        socketService.connect();

        // Desconectamos cuando el componente se desmonta (limpieza)
        return () => {
            socketService.disconnect();
        };
    }, []); // El array vacío asegura que solo se ejecute al montar y desmontar

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <CabeceraJuego />
            <Tablero />
            <PlayerList />
        </div>
    );
};

export default PantallaJuego;
