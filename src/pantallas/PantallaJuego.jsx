import CabeceraJuego from '../components/hud/CabeceraJuego';
import Tablero from '../components/map/Tablero';

/**
 * Pantalla principal del juego que junta el HUD superior y el mapa interactivo.
 * @returns {JSX.Element}
 */
const PantallaJuego = () => {
    return (
        <>
            <CabeceraJuego />
            <Tablero />
        </>
    );
};

export default PantallaJuego;
