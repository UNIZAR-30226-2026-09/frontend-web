import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTurno } from '../../hooks/useTurno';
import '../../styles/ControlRefuerzo.css';

/**
 * Panel para asignar tropas de refuerzo a un territorio.
 * @returns {JSX.Element|null} El control de refuerzo.
 */
const ControlRefuerzo = () => {
    const comarcaRefuerzo = useGameStore((state) => state.comarcaRefuerzo);
    const tropasAAsignar = useGameStore((state) => state.tropasAAsignar);
    const setTropasAAsignar = useGameStore((state) => state.setTropasAAsignar);
    const tropasDisponibles = useGameStore((state) => state.tropasDisponibles);
    const confirmarRefuerzo = useGameStore((state) => state.confirmarRefuerzo);
    const faseActual = useGameStore((state) => state.faseActual);
    const mapaEstatico = useGameStore((state) => state.mapaEstatico);
    const { esMiTurno } = useTurno();

    if (faseActual !== 'REFUERZO') {
        // Ocultar si no es fase de refuerzo
        return null;
    }

    console.log("🪖 [RESERVA CORREGIDA]:", tropasDisponibles, "Local Store Match:", esMiTurno);

    // Obtener nombre de la comarca
    let nombreComarca = '';
    if (comarcaRefuerzo && mapaEstatico?.comarcas) {
        nombreComarca = mapaEstatico.comarcas[comarcaRefuerzo]?.name || comarcaRefuerzo;
    }

    const handleValidChange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 0;
        if (val < 0) val = 0;
        if (val > (tropasDisponibles ?? 0)) val = (tropasDisponibles ?? 0);
        setTropasAAsignar(val);
    };

    const incrementar = () => {
        if (tropasAAsignar < (tropasDisponibles ?? 0)) {
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
    if (!comarcaRefuerzo && (tropasDisponibles ?? 0) > 0) {
        hintUI = <div className="refuerzo-hint">Selecciona un territorio azul para reforzar</div>;
    }

    let controlesUI = null;
    if (comarcaRefuerzo) {
        controlesUI = (
            <div className="refuerzo-box-activa">
                <h3 className="control-refuerzo-header">Reforzar en {nombreComarca}</h3>

                <div className="control-refuerzo-body">
                    <div className="refuerzo-input-group">
                        <button
                            className="refuerzo-btn-math"
                            onClick={decrementar}
                            disabled={tropasAAsignar <= 0}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            className="refuerzo-input"
                            value={tropasAAsignar}
                            onChange={handleValidChange}
                            min="0"
                            max={tropasDisponibles ?? 0}
                        />
                        <button
                            className="refuerzo-btn-math"
                            onClick={incrementar}
                            disabled={tropasAAsignar >= (tropasDisponibles ?? 0)}
                        >
                            +
                        </button>
                    </div>

                    <button
                        className="refuerzo-btn-confirmar"
                        onClick={confirmarRefuerzo}
                        disabled={tropasAAsignar === 0 || !esMiTurno}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="control-refuerzo-container">
            <div className="refuerzo-global-info">
                <span>Refuerzos Pendientes:</span>
                <span className={clasesPendientes}>
                    {tropasDisponibles ?? '...'}
                </span>
            </div>

            {hintUI}
            {controlesUI}
        </div>
    );
};

export default ControlRefuerzo;
