import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './CabeceraJuego.css';

const formatearFase = (fase) => {
    const fasesMap = {
        'DESPLIEGUE': 'Fase de Despliegue',
        'INVESTIGACION': 'Fase de Investigación',
        'ATAQUE_NORMAL': 'Fase de Ataque',
        'MOVER_TROPAS': 'Movimiento de Tropas',
        'ATAQUE_ESPECIAL': 'Ataque Especial',
        'FORTIFICACION': 'Fase de Fortificación'
    };
    return fasesMap[fase] || fase;
};

const CabeceraJuego = () => {
    const {
        dinero,
        tropasDisponibles,
        faseActual,
        avanzarFase,
        tropas,
        propietarios,
        coloresJugadores
    } = useGameStore();

    // sumamos las tropas que guardamos de sobra con las que ya están repartidas por ahí
    const totalTropasJugador = React.useMemo(() => {
        let total = tropasDisponibles;
        Object.entries(propietarios).forEach(([id, owner]) => {
            if (owner === 'jugador1') {
                total += (tropas[id] || 0);
            }
        });
        return total;
    }, [tropasDisponibles, propietarios, tropas]);

    const isFaseDespliegue = faseActual === 'DESPLIEGUE';
    const isUltimaFase = faseActual === 'FORTIFICACION';

    // no dejamos que pase el turno si todavía tiene tropas sin colocar en la mochila
    const isSiguienteBloqueado = isFaseDespliegue && tropasDisponibles > 0;
    const turnPlayerColor = coloresJugadores && coloresJugadores['jugador1'] ? coloresJugadores['jugador1'] : '#b8860b'; // TODO: leer el jugador en turno actual real

    const [menuAbierto, setMenuAbierto] = useState(false);

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto);
    };

    const handleRendirse = () => {
        console.log("Rendirse");
        setMenuAbierto(false);
    };

    const handleVolverSala = () => {
        console.log("Volver a la Sala");
        setMenuAbierto(false);
    };

    return (
        <header
            className="cabecera-juego"
        >
            <div className="zona-izquierda">
                <div className="indicador" title="Dinero">
                    <img src="/public/moneda.png" alt="Moneda" className="icono-recurso" />
                    <span className="valor-recurso">{dinero}</span>
                </div>
                <div className="indicador" title="Tropas Totales (Disponibles + Tablero)">
                    <img src="/public/espadas.png" alt="Casco" className="icono-recurso" />
                    <span className="valor-recurso">{totalTropasJugador}</span>
                </div>
            </div>

            <div className="zona-centro">
                <div
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)',
                        background: turnPlayerColor,
                        padding: '0px 3px 3px 3px', /* grosor del borde */
                        display: 'inline-block',
                    }}
                >
                    <div className="fase-poligono">
                        <span className="fase-texto" style={{ color: turnPlayerColor }}>{formatearFase(faseActual)}</span>
                        <button
                            className={`btn-siguiente-fase ${isUltimaFase ? 'btn-finalizar-turno' : ''} ${isSiguienteBloqueado ? 'btn-bloqueado' : ''}`}
                            onClick={avanzarFase}
                            disabled={isSiguienteBloqueado}
                            title={isSiguienteBloqueado ? "Despliega todas tus tropas antes de avanzar" : ""}
                        >
                            {isUltimaFase ? "NUEVO TURNO" : "AVANZAR"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="zona-derecha">
                <button className="btn-menu" onClick={toggleMenu}>
                    ≡
                </button>

                {menuAbierto && (
                    <div className="menu-desplegable">
                        <button className="btn-menu-item btn-rendirse" onClick={handleRendirse}>
                            Rendirse
                        </button>
                        <button className="btn-menu-item" onClick={handleVolverSala}>
                            Volver a la Sala
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default CabeceraJuego;
