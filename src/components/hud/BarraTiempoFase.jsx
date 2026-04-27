import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTurno } from '../../hooks/useTurno';
import '../../styles/BarraTiempoFase.css';

const DURACION_FASE_SEG = 60; // duración total de referencia para el porcentaje

/**
 * Calcula los segundos restantes hasta `finFaseUtc`.
 * Devuelve 0 si ya ha expirado o si el valor es nulo.
 */
const calcularSegundosRestantes = (finFaseUtc) => {
    if (!finFaseUtc) return DURACION_FASE_SEG;
    const ms = new Date(finFaseUtc).getTime() - Date.now();
    return Math.max(0, Math.round(ms / 1000));
};

/**
 * Barra visual que muestra el tiempo restante de la fase actual.
 * Usa `finFaseUtc` del gameStore (ISO 8601 enviado por el backend) para
 * que el timer sea correcto incluso tras recargar la página.
 * Al llegar a 0, fuerza el avance de fase si es el turno del jugador local.
 */
const BarraTiempoFase = () => {
    const finFaseUtc    = useGameStore((s) => s.finFaseUtc);
    const faseActual    = useGameStore((s) => s.faseActual);
    const pasarFaseBackend = useGameStore((s) => s.pasarFaseBackend);
    const { esMiTurno } = useTurno();

    const [restante, setRestante] = useState(() => calcularSegundosRestantes(finFaseUtc));
    const avanzadoRef = useRef(false);

    // Cuando llega un nuevo finFaseUtc (nueva fase o recarga), recalcular
    useEffect(() => {
        setRestante(calcularSegundosRestantes(finFaseUtc));
        avanzadoRef.current = false;
    }, [finFaseUtc, faseActual]);

    // Tick cada segundo
    useEffect(() => {
        const id = setInterval(() => {
            setRestante(() => {
                const seg = calcularSegundosRestantes(finFaseUtc);

                if (seg === 0 && !avanzadoRef.current && esMiTurno) {
                    avanzadoRef.current = true;
                    pasarFaseBackend();
                }

                return seg;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [finFaseUtc, esMiTurno, pasarFaseBackend]);

    const porcentaje  = Math.min(100, (restante / DURACION_FASE_SEG) * 100);
    const urgente     = restante <= 15;
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
