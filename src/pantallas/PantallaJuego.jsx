import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CabeceraJuego from '../components/hud/CabeceraJuego';
import { PlayerList } from '../components/hud/PlayerList';
import Tablero from '../components/map/Tablero';
import { socketService } from '../services/socketService';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/useAuthStore';
import ControlAtaque from '../components/hud/ControlAtaque';
import ControlTrasladoConquista from '../components/hud/ControlTrasladoConquista';
import ControlFortificacion from '../components/hud/ControlFortificacion';
import GameOverModal from '../components/hud/GameOverModal';

/**
 * Pantalla principal del juego que junta el HUD superior y el mapa interactivo.
 * @returns {JSX.Element}
 */
const PantallaJuego = () => {
    const { id } = useParams();
    const sincronizarEstadoPartida = useGameStore((state) => state.sincronizarEstadoPartida);
    const cargarCatalogoTecnologias = useGameStore((state) => state.cargarCatalogoTecnologias);
    const salaId = useGameStore((state) => state.salaActiva?.id);
    const user = useAuthStore((state) => state.user);

    useEffect(() => {
        const username = user?.username || user?.nombre_usuario || user?.nombre;
        
        // Lógica de Re-sincronización tras F5 (Recarga de página)
        // Si no tenemos salaId en el store pero sí en la URL, forzamos la carga.
        const inicializar = async () => {
            if (!salaId && id) {
                console.log(`[PantallaJuego] Detectada recarga en partida ${id}. Recuperando estado...`);
                await sincronizarEstadoPartida(id);
            }

            // Cargar catálogo de tecnologías.
            // Pasamos el id de URL como fallback por si salaActiva.id aún no está
            // en el store en el primer render (race condition llegando desde el lobby).
            cargarCatalogoTecnologias(id ? Number(id) : undefined);

            // Una vez sincronizado (o si ya lo estaba), conectamos el WebSocket
            const currentSalaId = useGameStore.getState().salaActiva?.id;
            if (currentSalaId && username) {
                socketService.connectToPartida(currentSalaId, username);
            }
        };

        inicializar();

        return () => {
            // Se comenta la desconexión manual para permitir que el socketService maneje 
            // las reconexiones automáticamente incluso tras un desmontaje/montaje accidental (StrictMode, re-renders).
            // socketService.disconnect();
        };
    }, [id, salaId, user, sincronizarEstadoPartida, cargarCatalogoTecnologias]); 

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
