import React from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/ControlDespliegue.css';
import mapData from '../../data/map_aragon.json';

/**
 * Panel para asignar tropas de refuerzo a un territorio.
 * @returns {JSX.Element|null} El control de despliegue.
 */
const ControlDespliegue = () => {
    const comarcaDespliegue = useGameStore((state) => state.comarcaDespliegue);
    const tropasAAsignar = useGameStore((state) => state.tropasAAsignar);
    const setTropasAAsignar = useGameStore((state) => state.setTropasAAsignar);
    const tropasDisponibles = useGameStore((state) => state.tropasDisponibles);
    const confirmarDespliegue = useGameStore((state) => state.confirmarDespliegue);
    const faseActual = useGameStore((state) => state.faseActual);

    if (faseActual !== 'DESPLIEGUE') {
        // Ocultar si no es fase de despliegue
        return null;
    }

    // Obtener nombre de la comarca
    let nombreComarca = '';
    if (comarcaDespliegue) {
        nombreComarca = mapData.comarcas[comarcaDespliegue]?.name || comarcaDespliegue;
    }

    const handleValidChange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > tropasDisponibles) val = tropasDisponibles;
        setTropasAAsignar(val);
    };

    const incrementar = () => {
        if (tropasAAsignar < tropasDisponibles) {
            setTropasAAsignar(tropasAAsignar + 1);
        }
    };

    const decrementar = () => {
        if (tropasAAsignar > 0) {
            setTropasAAsignar(tropasAAsignar - 1);
        }
    };

    let clasesPendientes = 'refuerzos-pendientes-num';
    if (tropasDisponibles === 0) {
        clasesPendientes += ' agotados';
    }

    let hintUI = null;
    if (!comarcaDespliegue && tropasDisponibles > 0) {
        hintUI = <div className="despliegue-hint">Selecciona un territorio azul para desplegar</div>;
    }

    let controlesUI = null;
    if (comarcaDespliegue) {
        controlesUI = (
            <div className="despliegue-box-activa">
                <h3 className="control-despliegue-header">Desplegar en {nombreComarca}</h3>

                <div className="control-despliegue-body">
                    <div className="despliegue-input-group">
                        <button
                            className="despliegue-btn-math"
                            onClick={decrementar}
                            disabled={tropasAAsignar <= 0}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            className="despliegue-input"
                            value={tropasAAsignar}
                            onChange={handleValidChange}
                            min="0"
                            max={tropasDisponibles}
                        />
                        <button
                            className="despliegue-btn-math"
                            onClick={incrementar}
                            disabled={tropasAAsignar >= tropasDisponibles}
                        >
                            +
                        </button>
                    </div>

                    <button
                        className="despliegue-btn-confirmar"
                        onClick={confirmarDespliegue}
                        disabled={tropasAAsignar === 0}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="control-despliegue-container">
            <div className="despliegue-global-info">
                <span>Refuerzos Pendientes:</span>
                <span className={clasesPendientes}>
                    {tropasDisponibles}
                </span>
            </div>

            {hintUI}
            {controlesUI}
        </div>
    );
};

export default ControlDespliegue;
