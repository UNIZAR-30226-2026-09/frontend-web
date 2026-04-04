import React, { useEffect } from 'react';
import CabeceraJuego from '../components/hud/CabeceraJuego';
import { PlayerList } from '../components/hud/PlayerList';
import Tablero from '../components/map/Tablero';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import ControlAtaque from '../components/hud/ControlAtaque';
import ControlTrasladoConquista from '../components/hud/ControlTrasladoConquista';
import ControlFortificacion from '../components/hud/ControlFortificacion';
import GameOverModal from '../components/hud/GameOverModal';

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
            // Se comenta la desconexión manual para permitir que el socketService maneje 
            // las reconexiones automáticamente incluso tras un desmontaje/montaje accidental (StrictMode, re-renders).
            // socketService.disconnect();
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
            <GameOverModal />
        </div>
    );
};

export default PantallaJuego;
