import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTurno } from '../../hooks/useTurno';
import '../../styles/BarraTiempoFase.css';

const DURACION_FASE_SEG = 60;

/**
 * Barra visual que muestra el tiempo restante de la fase actual.
 * Se posiciona justo debajo de la cabecera y se reinicia automáticamente
 * cuando cambia `faseActual`.
 * Al llegar a 0, fuerza el avance de fase si es el turno del jugador local.
 */
const BarraTiempoFase = () => {
    const faseActual = useGameStore((s) => s.faseActual);
    const pasarFaseBackend = useGameStore((s) => s.pasarFaseBackend);
    const { esMiTurno } = useTurno();

    const [restante, setRestante] = useState(DURACION_FASE_SEG);
    const avanzadoRef = useRef(false); // evita llamar pasarFaseBackend más de una vez

    // Reiniciar el contador cuando cambia la fase
    useEffect(() => {
        setRestante(DURACION_FASE_SEG);
        avanzadoRef.current = false;
    }, [faseActual]);

    // Countdown 1s y auto-avance al llegar a 0
    useEffect(() => {
        const id = setInterval(() => {
            setRestante((prev) => {
                const siguiente = prev > 0 ? prev - 1 : 0;

                // Forzar avance solo una vez y solo si es mi turno
                if (siguiente === 0 && !avanzadoRef.current && esMiTurno) {
                    avanzadoRef.current = true;
                    pasarFaseBackend();
                }

                return siguiente;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [faseActual, esMiTurno, pasarFaseBackend]); // se recrea con cada fase

    const porcentaje = (restante / DURACION_FASE_SEG) * 100;
    const urgente = restante <= 15;
    const advertencia = restante <= 30 && !urgente;

    return (
        <div className="barra-tiempo-contenedor" aria-label={`Tiempo restante: ${restante}s`}>
            <div
                className={`barra-tiempo-relleno${urgente ? ' urgente' : advertencia ? ' advertencia' : ''}`}
                style={{ width: `${porcentaje}%` }}
            />
            <span className={`barra-tiempo-contador${urgente ? ' urgente' : ''}`}>
                {restante}s
            </span>
        </div>
    );
};

export default BarraTiempoFase;
