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
                    background-color: #2A1F0F;
                    border: 1.4px solid var(--color-border-gold, #D4AF37);
                    border-radius: 16px;
                    box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.6);
                    width: 90%;
                    max-width: 400px;
                    padding: 24px;
                    text-align: center;
                    color: white;
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
                    color: #E0D6C8;
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
                }

                .btn-si {
                    background-color: var(--color-border-gold, #D4AF37);
                    color: #1A1200;
                    font-weight: 800;
                    border: none;
                }
                .btn-si:hover { filter: brightness(1.1); transform: translateY(-1px); }

                .btn-no {
                    background-color: #3A2E1A;
                    color: #FFFFFF;
                    border: 1px solid var(--color-border-gold, #D4AF37);
                    font-weight: 600;
                }
                .btn-no:hover { background-color: #4A3A22; }

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