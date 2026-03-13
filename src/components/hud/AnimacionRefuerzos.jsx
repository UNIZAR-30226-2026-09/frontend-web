import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './AnimacionRefuerzos.css';

/**
 * @component AnimacionRefuerzos
 * @description pop-up a pantalla completa que salta justo al principio del despliegue.
 * bloquea la interacción 3 segundos y se desaparece solo metiendo unas clases css
 * para el difuminado. da feedback visual 
 */
const AnimacionRefuerzos = () => {
    const mostrarAnimacionRefuerzos = useGameStore((state) => state.mostrarAnimacionRefuerzos);
    const refuerzosRecibidos = useGameStore((state) => state.refuerzosRecibidos);
    const cerrarAnimacionRefuerzos = useGameStore((state) => state.cerrarAnimacionRefuerzos);

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (mostrarAnimacionRefuerzos) {
            setVisible(true);
            // quitamos el cartelico a los 3 segundos para que no moleste
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(cerrarAnimacionRefuerzos, 500); // nos esperamos medio segundo a que acabe el difuminado del css
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [mostrarAnimacionRefuerzos, cerrarAnimacionRefuerzos]);

    if (!mostrarAnimacionRefuerzos) return null;

    return (
        <div className={`animacion-refuerzos-overlay ${visible ? 'visible' : ''}`}>
            <div className="animacion-refuerzos-modal">
                <h2>¡Fase de Despliegue!</h2>
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