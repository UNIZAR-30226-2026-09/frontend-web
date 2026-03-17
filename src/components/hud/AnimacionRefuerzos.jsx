import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import '../../styles/AnimacionRefuerzos.css';

/**
 * Pop-up que le salta al jugador en pantalla cuando le toca desplegar.
 * @returns {JSX.Element} El pop-up animado con los refuerzos.
 */
const AnimacionRefuerzos = () => {
    const mostrarAnimacionRefuerzos = useGameStore((state) => state.mostrarAnimacionRefuerzos);
    const refuerzosRecibidos = useGameStore((state) => state.refuerzosRecibidos);
    const cerrarAnimacionRefuerzos = useGameStore((state) => state.cerrarAnimacionRefuerzos);

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (mostrarAnimacionRefuerzos) {
            setVisible(true);

            const timer = setTimeout(() => {
                setVisible(false);
                // Esperamos medio segundo extra para que la animación CSS de desaparición
                // termine suavemente antes de cargarnos el componente del DOM virtual.
                setTimeout(cerrarAnimacionRefuerzos, 500);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [mostrarAnimacionRefuerzos, cerrarAnimacionRefuerzos]);

    if (!mostrarAnimacionRefuerzos) {
        return null;
    }

    let overlayClassName = 'animacion-refuerzos-overlay';
    if (visible) {
        overlayClassName += ' visible';
    }

    return (
        <div className={overlayClassName}>
            <div className="animacion-refuerzos-modal">
                <h2>FASE DE DESPLIEGUE</h2>

                <div className="refuerzos-numero">
                    +{refuerzosRecibidos}
                </div>

                <p>Tropas de refuerzo recibidas</p>

                <div className="refuerzos-instrucciones">
                    Selecciona tus territorios para desplegarlas
                </div>
            </div>
        </div>
    );
};

export default AnimacionRefuerzos;