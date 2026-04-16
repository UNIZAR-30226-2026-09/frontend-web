import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useTurno } from '../../hooks/useTurno';
import { useNavigate } from 'react-router-dom';
import '../../styles/CabeceraJuego.css';

/**
 * Transforma el string interno del estado de la fase en un texto legible 
 * que podamos pintar arriba en la cabecera para que el jugador se entere.
 * 
 * @param {string} fase 
 * @returns {string} El texto formateado para la UI.
 */
const formatearFase = (fase) => {
  const fasesMap = {
    'REFUERZO': 'Fase de Refuerzo',
    'ATAQUE_CONVENCIONAL': 'Fase de Ataque',
    'FORTIFICACION': 'Fase de Fortificación'
  };
  return fasesMap[fase] || fase;
};

/**
 * Renderiza el HUD o cabecera superior de la pantalla principal del juego.
 * Muestra métricas vitales (dinero, cantidad de tropas del jugador) y
 * controla el polígono central que dicta en qué fase estamos y nos permite pasar turno.
 * 
 * @returns {JSX.Element} La etiqueta header con toda la maqueta.
 */
const CabeceraJuego = () => {
  const {
    dinero,
    tropasDisponibles,
    faseActual,
    pasarFaseBackend,
    tropas,
    propietarios,
    coloresJugadores,
    turnoActual,
    jugadorLocal,
    abandonarSoberania
  } = useGameStore();

  const navigate = useNavigate();

  // Sumamos las tropas que guardamos de sobra con las que ya están repartidas por ahí
  const totalTropasJugador = React.useMemo(() => {
    let total = tropasDisponibles ?? 0;
    Object.entries(propietarios).forEach(([id, owner]) => {
      if (owner === jugadorLocal && jugadorLocal !== null) {
        total += (tropas[id] || 0);
      }
    });
    return total;
  }, [tropasDisponibles, propietarios, tropas, jugadorLocal]);

  const { esMiTurno } = useTurno();
  const isFaseRefuerzo = faseActual === 'REFUERZO';
  const isUltimaFase = faseActual === 'FORTIFICACION';

  // Bloqueamos el paso de turno si todavía tiene tropas sin colocar o si no es su turno
  const isSiguienteBloqueado = !esMiTurno || (isFaseRefuerzo && (tropasDisponibles ?? 0) > 0);

  const movimientoRealizadoEnTurno = useGameStore((state) => state.movimientoRealizadoEnTurno);

  let debeBrillar = false;
  if (!isSiguienteBloqueado && esMiTurno) {
    if (isFaseRefuerzo && (tropasDisponibles ?? 0) === 0) debeBrillar = true;
    if (isUltimaFase && movimientoRealizadoEnTurno) debeBrillar = true;
  }

  // Leer el jugador en turno actual real para sacar su color
  const turnPlayerColor = coloresJugadores && turnoActual && coloresJugadores[turnoActual]
    ? coloresJugadores[turnoActual]
    : 'var(--color-border-gold)';

  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const handleRendirse = async () => {
    const confirmar = window.confirm('¿Estás seguro de que deseas rendirte? Perderás todos tus territorios y tropas.');
    if (confirmar) {
      await abandonarSoberania();
      setMenuAbierto(false);
      navigate('/lobby');
    }
  };

  const handleVolverSala = async () => {
    const confirmar = window.confirm('¿Deseas salir al Centro de Mando? Se considerará un abandono de la partida actual.');
    if (confirmar) {
      await abandonarSoberania();
      setMenuAbierto(false);
      navigate('/lobby');
    }
  };

  // Construir renderizado condicional del botón central
  let clasesBotonSiguiente = 'btn-siguiente-fase';

  if (isUltimaFase) {
    clasesBotonSiguiente += ' btn-finalizar-turno';
  }

  if (isSiguienteBloqueado) {
    clasesBotonSiguiente += ' btn-bloqueado';
  }

  let titleSiguiente = '';
  if (!esMiTurno) {
    titleSiguiente = 'Espera tu turno para jugar';
  } else if (isSiguienteBloqueado) {
    titleSiguiente = 'Refuerza todas tus comarcas antes de avanzar';
  }

  let textoSiguiente = 'AVANZAR';
  if (!esMiTurno) {
    textoSiguiente = 'ESPERANDO...';
  } else if (isUltimaFase) {
    textoSiguiente = 'NUEVO TURNO';
  }

  return (
    <header className="cabecera-juego">
      <div className="zona-izquierda">
      </div>

      <div className="zona-centro">
        <div
          style={{
            clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)',
            background: turnPlayerColor,
            padding: '0px 3px 3px 3px',
            display: 'inline-block',
          }}
        >
          <div className="fase-poligono">
            <span className="fase-texto" style={{ color: turnPlayerColor }}>{formatearFase(faseActual || 'CARGANDO...')}</span>
            {esMiTurno ? (
              <button
                className={clasesBotonSiguiente}
                onClick={pasarFaseBackend}
                disabled={isSiguienteBloqueado}
                title={titleSiguiente}
                style={{
                  backgroundColor: debeBrillar ? turnPlayerColor : undefined,
                  border: debeBrillar ? `2px solid ${turnPlayerColor}` : undefined,
                  animation: debeBrillar ? 'pulse 1.5s infinite alternate' : 'none'
                }}
              >
                {textoSiguiente}
              </button>
            ) : (
              <span style={{color: 'var(--color-ui-bg-primary)', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', textShadow: 'none', backgroundColor: turnPlayerColor, padding: '4px 12px', borderRadius: '4px'}}>
                Turno de: {turnoActual}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="zona-derecha">
        <button
          className="btn-menu"
          onClick={toggleMenu}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            backgroundColor: 'var(--color-ui-panel-overlay)',
            border: '2px solid var(--color-border-gold)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            padding: '10px',
            marginRight: '3rem'
          }}
        >
          ≡
        </button>

        {menuAbierto && (
          <div className="menu-desplegable">
            <button className="btn-menu-item btn-rendirse" onClick={handleRendirse}>
              Rendirse
            </button>
            <button className="btn-menu-item" onClick={handleVolverSala}>
              Volver a la Sala
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default CabeceraJuego;
