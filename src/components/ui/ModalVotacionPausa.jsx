import React from 'react';
import { useGameStore } from '../../store/gameStore';

const ModalVotacionPausa = () => {
    const fase = useGameStore(s => s.faseVotacionPausa);
    const jugadorSolicitante = useGameStore(s => s.jugadorSolicitantePausa);
    const setFase = useGameStore(s => s.setFaseVotacionPausa);
    const iniciarSolicitud = useGameStore(s => s.iniciarSolicitudPausa);
    const enviarVoto = useGameStore(s => s.enviarVotoPausa);

    if (fase === 'ninguna') return null;

    return (
        <div className="modal-overlay-pausa">
            <div className="modal-content-pausa">

                {/* ESTADO 1: El jugador pulsa Pausar y le pedimos confirmación local */}
                {fase === 'confirmando_local' && (
                    <>
                        <h2>¿Proponer Pausa?</h2>
                        <p>Si aceptas, se iniciará una votación. Todos los comandantes deben aceptar para pausar la partida.</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={iniciarSolicitud}>SÍ, PROPONER PAUSA</button>
                            <button className="btn-no" onClick={() => setFase('ninguna')}>CANCELAR</button>
                        </div>
                    </>
                )}

                {/* ESTADO 2: Alguien ha iniciado votación y nos toca votar */}
                {fase === 'votando' && (
                    <>
                        <h2>Votación de Pausa</h2>
                        <p>El comandante <strong>{jugadorSolicitante}</strong> ha propuesto pausar la partida.</p>
                        <p>¿Estás de acuerdo en detener el combate por ahora?</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={() => enviarVoto(true)}>SÍ, PAUSAR</button>
                            <button className="btn-no" onClick={() => enviarVoto(false)}>NO, CONTINUAR JUGANDO</button>
                        </div>
                    </>
                )}

                {/* ESTADO 3: Hemos votado (o iniciado) y estamos esperando al resto */}
                {fase === 'esperando' && (
                    <>
                        <h2>Votación en Curso</h2>
                        <p>Esperando el voto unánime del Alto Mando...</p>
                        <div className="spinner-espera">⏳</div>
                    </>
                )}

                {/* ESTADO 4: Partida pausada */}
                {fase === 'pausada' && (
                    <>
                        <h2>Partida Pausada</h2>
                        <p>La partida ha sido pausada correctamente. Podréis reanudarla más tarde.</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={() => window.location.href = '/lobby'}>ENTENDIDO</button>
                        </div>
                    </>
                )}

                {/* ESTADO 5: Pausa rechazada */}
                {fase === 'rechazada' && (
                    <>
                        <h2>Votación Rechazada</h2>
                        <p>El Alto Mando no ha llegado a un acuerdo unánime. La guerra continúa.</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={() => setFase('ninguna')}>ENTENDIDO</button>
                        </div>
                    </>
                )}

                {/* ESTADO 6: Espectador quiere abandonar */}
                {fase === 'confirmar_abandono_espectador' && (
                    <>
                        <h2>¿Dejar de espectar?</h2>
                        <p>Saldrás de la partida y volverás al cuartel general. Esta acción es inmediata.</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={() => window.location.href = '/lobby'}>SÍ, SALIR</button>
                            <button className="btn-no" onClick={() => setFase('ninguna')}>CANCELAR</button>
                        </div>
                    </>
                )}

            </div>

            {/* Puedes mantener los mismos estilos, solo he cambiado los nombres de las clases principales de 'abandono' a 'pausa' */}
            <style>{`
                .modal-overlay-pausa {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }

                .modal-content-pausa {
                    background-color: var(--color-ui-bg-secondary, #1E1E1E);
                    border: 2px solid var(--color-border-gold, #D4AF37);
                    border-radius: 16px;
                    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.8);
                    width: 90%;
                    max-width: 400px;
                    padding: 24px;
                    text-align: center;
                    color: var(--color-text-primary, #FFFFFF);
                    font-family: var(--font-family-base, sans-serif);
                }

                .modal-content-pausa h2 {
                    color: var(--color-border-gold, #D4AF37);
                    margin-top: 0;
                    margin-bottom: 12px;
                    font-size: 1.5rem;
                }

                .modal-content-pausa p {
                    font-size: 0.95rem;
                    line-height: 1.4;
                    margin-bottom: 24px;
                    color: var(--color-text-secondary, #B0B0B0);
                }

                .modal-botones-columna {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .btn-si, .btn-no {
                    width: 100%;
                    padding: 14px;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 800;
                }

                .btn-si {
                    background-color: var(--color-border-gold, #D4AF37);
                    color: var(--color-ui-bg-secondary, #1E1E1E);
                    border: none;
                }

                .btn-no {
                    background-color: var(--color-ui-bg-secondary, #1E1E1E);
                    color: var(--color-border-gold, #D4AF37);
                    border: 1px solid var(--color-border-gold, #D4AF37);
                }

                .btn-si:hover { 
                    filter: brightness(1.1);
                    transform: translateY(-1px); 
                    box-shadow: 0 4px 8px rgba(197, 160, 89, 0.4);
                }

                .btn-no:hover { 
                    background-color: rgba(197, 160, 89, 0.2); 
                    transform: translateY(-1px); 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }

                .spinner-espera {
                    font-size: 2rem;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(0.9); opacity: 0.7; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.9); opacity: 0.7; }
                }
            `}</style>
        </div>
    );
};

export default ModalVotacionPausa;