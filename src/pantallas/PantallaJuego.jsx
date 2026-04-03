import React, { useEffect } from 'react';
import CabeceraJuego from '../components/hud/CabeceraJuego';
import { PlayerList } from '../components/hud/PlayerList';
import Tablero from '../components/map/Tablero';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import ControlAtaque from '../components/hud/ControlAtaque';
import ControlTrasladoConquista from '../components/hud/ControlTrasladoConquista';
import ControlFortificacion from '../components/hud/ControlFortificacion';

/**
 * Pantalla principal del juego que junta el HUD superior y el mapa interactivo.
 * @returns {JSX.Element}
 */
const PantallaJuego = () => {
    useEffect(() => {
        const salaId = useGameStore.getState().salaActiva?.id;
        const username = useGameStore.getState().jugadorLocal;

        if (salaId && username) {
            // Usar la función específica que arma la URL con /api/v1/ws/ID/USER
            socketService.connectToPartida(salaId, username);
        }

        // Opcional: limpiar al desmontar
        return () => {
            socketService.disconnect();
        }
    }, []); 

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <CabeceraJuego />
            <Tablero />
            <PlayerList />
            
            <ControlAtaque />
            <ControlTrasladoConquista />
            <ControlFortificacion />
        </div>
    );
};

export default PantallaJuego;
