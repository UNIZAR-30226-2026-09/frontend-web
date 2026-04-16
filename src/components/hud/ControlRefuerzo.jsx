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
    const popupCoords = useGameStore((state) => state.popupCoords);
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
        if (isNaN(val)) val = 1;
        if (val < 1) val = 1;
        if (val > (tropasDisponibles ?? 0)) val = (tropasDisponibles ?? 0);
        setTropasAAsignar(val);
    };

    const incrementar = () => {
        if (tropasAAsignar < (tropasDisponibles ?? 0)) {
            setTropasAAsignar(tropasAAsignar + 1);
        }
    };

    const decrementar = () => {
        if (tropasAAsignar > 1) {
            setTropasAAsignar(tropasAAsignar - 1);
        }
    };

    let clasesPendientes = 'refuerzos-pendientes-num';
    if (tropasDisponibles === 0) {
        clasesPendientes += ' agotados';
    }

    let controlesUI = null;
    if (comarcaRefuerzo && (tropasDisponibles ?? 0) > 0) {
        // Si por alguna razón perdemos las coordenadas, no renderizamos el popup en el medio de la nada
        if (!popupCoords) return null;

        const top = popupCoords.y;
        const left = popupCoords.x;
        const transformY = popupCoords.orientacionArriba ? '-100%' : '15px';

        controlesUI = (
            <div className="refuerzo-box-activa" style={{
                position: 'fixed', top: top, left: left, transform: `translate(-50%, ${transformY})`, zIndex: 1000,
                backgroundColor: 'var(--color-ui-bg-secondary)', border: '2px solid var(--color-border-bronze)',
                borderRadius: 'var(--radius-md)', padding: '15px 20px', boxShadow: '0 8px 12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)', minWidth: '220px'
            }}>
                <h3 className="control-refuerzo-header">Reforzar en {nombreComarca}</h3>

                <div className="control-refuerzo-body">
                    {(tropasDisponibles ?? 0) > 1 ? (
                        <div className="refuerzo-input-group">
                            <button
                                className="refuerzo-btn-math"
                                onClick={decrementar}
                                disabled={tropasAAsignar <= 1}
                            >
                                -
                            </button>
                            <input
                                type="range"
                                className="refuerzo-slider"
                                min="1"
                                max={tropasDisponibles ?? 0}
                                value={tropasAAsignar}
                                onChange={handleValidChange}
                            />
                            <input
                                type="number"
                                className="refuerzo-input"
                                value={tropasAAsignar}
                                onChange={handleValidChange}
                                min="1"
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
                    ) : (
                        <div className="refuerzo-simple-group">
                            <span className="refuerzo-simple-text">" Colocar 1 tropa "</span>
                        </div>
                    )}

                    <button
                        className="refuerzo-btn-confirmar"
                        onClick={confirmarRefuerzo}
                        disabled={tropasAAsignar < 1 || !esMiTurno}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="control-refuerzo-container">
                <div className="refuerzo-global-info">
                    <span>Refuerzos Pendientes:</span>
                    <span className={clasesPendientes}>
                        {tropasDisponibles ?? '...'}
                    </span>
                </div>
            </div>

            {controlesUI}
        </>
    );
};

export default ControlRefuerzo;
