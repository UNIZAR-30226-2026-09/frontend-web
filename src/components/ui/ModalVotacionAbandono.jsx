import React from 'react';
import { useGameStore } from '../../store/gameStore';

const ModalVotacionAbandono = () => {
    const fase = useGameStore(s => s.faseVotacionAbandono);
    const jugadorSolicitante = useGameStore(s => s.jugadorSolicitanteAbandono);
    const setFase = useGameStore(s => s.setFaseVotacion);
    const iniciarSolicitud = useGameStore(s => s.iniciarSolicitudAbandono);
    const enviarVoto = useGameStore(s => s.enviarVotoAbandono);

    if (fase === 'ninguna') return null;

    return (
        <div className="modal-overlay-abandono">
            <div className="modal-content-abandono">

                {/* ESTADO 1: El jugador pulsa Salir y le pedimos confirmación local */}
                {fase === 'confirmando_local' && (
                    <>
                        <h2>¿Proponer Rendición?</h2>
                        <p>Si aceptas, se iniciará una votación con el resto de comandantes de la sala.</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={iniciarSolicitud}>SÍ, PROPONER RENDICIÓN</button>
                            <button className="btn-no" onClick={() => setFase('ninguna')}>CANCELAR</button>
                        </div>
                    </>
                )}

                {/* ESTADO 2: Alguien ha iniciado votación y nos toca votar */}
                {fase === 'votando' && (
                    <>
                        <h2>Votación de Rendición</h2>
                        <p>El comandante <strong>{jugadorSolicitante}</strong> ha propuesto la rendición incondicional.</p>
                        <p>¿Aceptas abandonar el campo de batalla?</p>
                        <div className="modal-botones-columna">
                            <button className="btn-si" onClick={() => enviarVoto(true)}>SÍ, RENDIRSE</button>
                            <button className="btn-no" onClick={() => enviarVoto(false)}>NO, LUCHAR HASTA EL FINAL</button>
                        </div>
                    </>
                )}

                {/* ESTADO 3: Hemos votado (o iniciado) y estamos esperando al resto */}
                {fase === 'esperando' && (
                    <>
                        <h2>Votación en Curso</h2>
                        <p>Esperando la decisión del Alto Mando...</p>
                        <div className="spinner-espera">⏳</div>
                    </>
                )}

            </div>

            <style>{`
                .modal-overlay-abandono {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }

                .modal-content-abandono {
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

                .modal-content-abandono h2 {
                    color: var(--color-border-gold, #D4AF37);
                    margin-top: 0;
                    margin-bottom: 12px;
                    font-size: 1.5rem;
                }

                .modal-content-abandono p {
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

export default ModalVotacionAbandono;