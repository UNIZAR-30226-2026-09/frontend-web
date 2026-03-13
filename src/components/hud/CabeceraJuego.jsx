import React from 'react';
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
        propietarios
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

    return (
        <header className="cabecera-juego">
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
                <div className="fase-actual-texto">
                    {formatearFase(faseActual)}
                </div>
                <button
                    className={`btn-siguiente-fase ${isUltimaFase ? 'btn-finalizar-turno' : ''} ${isSiguienteBloqueado ? 'btn-bloqueado' : ''}`}
                    onClick={avanzarFase}
                    disabled={isSiguienteBloqueado}
                    title={isSiguienteBloqueado ? "Despliega todas tus tropas antes de avanzar" : ""}
                >
                    {isUltimaFase ? "Finalizar Turno" : "Siguiente Fase"}
                </button>
            </div>

            <div className="zona-derecha">
                <button
                    className="btn-ajustes"
                    onClick={() => console.log("Volver al lobby")}
                    title="Ajustes / Salir"
                >
                    <img src="/public/ajustes.png" alt="Ajustes" />
                </button>
            </div>
        </header>
    );
};

export default CabeceraJuego;
