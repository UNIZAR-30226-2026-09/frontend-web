// src/components/lobby/PanelInteligencia.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi } from '../../services/api';
import { socialApi } from '../../services/socialApi';
import PanelEstadisticas from '../social/PanelEstadisticas';
import '../../styles/Lobby.css';
import '../../styles/PanelInteligencia.css';

/**
 * Pantalla completa de perfil del jugador.
 * Los cambios de username y email se persisten en el backend vía PUT /v1/usuarios/me.
 * @param {{ onCerrar: () => void }} props
 */
const PanelInteligencia = ({ onCerrar }) => {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const usernameInicial = user?.username || user?.nombre_usuario || user?.nombre || '';
  const emailInicial = user?.email || '';

  const [username, setUsername] = useState(usernameInicial);
  const [email, setEmail] = useState(emailInicial);

  const [editandoUsername, setEditandoUsername] = useState(false);
  const [editandoEmail, setEditandoEmail] = useState(false);

  const [guardandoUsername, setGuardandoUsername] = useState(false);
  const [guardandoEmail, setGuardandoEmail] = useState(false);

  const [feedbackUsername, setFeedbackUsername] = useState(null); // { ok, msg }
  const [feedbackEmail, setFeedbackEmail] = useState(null);

  // Estados para las estadísticas reales
  const [estadisticas, setEstadisticas] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Cargar estadísticas y datos del perfil al abrir el panel
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoadingStats(true);
      try {
        const [statsData, userData] = await Promise.all([
          socialApi.obtenerEstadisticas(),
          fetchApi('/v1/usuarios/me', { method: 'GET' })
        ]);
        setEstadisticas(statsData);
        if (userData) {
          if (userData.username) setUsername(userData.username);
          if (userData.email) setEmail(userData.email);
        }
      } catch (error) {
        console.error("Error al obtener los datos del perfil:", error);
        setEstadisticas(null);
      } finally {
        setIsLoadingStats(false);
      }
    };

    cargarDatos();
  }, [user]);


  /** Llama a PUT /v1/usuarios/me con el campo actualizado y refresca el store. */
  const persistirCambio = async (payload, onOk, setGuardando, setFeedback) => {
    setGuardando(true);
    setFeedback(null);
    try {
      const actualizado = await fetchApi('/v1/usuarios/me', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      // Refresca el usuario en el store manteniendo el mismo token
      login(actualizado, token);
      setFeedback({ ok: true, msg: 'Guardado correctamente.' });
      onOk();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setFeedback({ ok: false, msg: error.message || 'Error al guardar. Inténtalo de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarUsername = () => {
    persistirCambio(
      { username },
      () => setEditandoUsername(false),
      setGuardandoUsername,
      setFeedbackUsername
    );
  };

  const handleGuardarEmail = () => {
    persistirCambio(
      { email },
      () => setEditandoEmail(false),
      setGuardandoEmail,
      setFeedbackEmail
    );
  };

  const handleCambiarPassword = () => {
    alert('Cambio de contraseña pendiente de implementar (endpoint no disponible aún).');
  };

  const inicial = usernameInicial.charAt(0).toUpperCase() || '?';



  return (
    <div className="intel-overlay">
      <div className="intel-panel">

        <button className="intel-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>

        {/* Zona scrollable: todo excepto el botón de logout */}
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>

          <div className="intel-perfil-grid">

            {/* COLUMNA IZQUIERDA: Perfil y Título */}
            <div className="intel-perfil-izq">
              <div className="intel-avatar">{inicial}</div>
              <h2 className="intel-titulo">Perfil de {username}</h2>
            </div>

            {/* COLUMNA DERECHA: Datos del perfil */}
            <div className="intel-perfil-der">

              {/* Username */}
              <div className="intel-campo">
                <span className="intel-campo__label">Nombre de usuario</span>
                {editandoUsername ? (
                  <>
                    <div className="intel-campo__fila">
                      <input
                        className="intel-campo__input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleGuardarUsername()}
                      />
                      <button
                        className="intel-campo__btn"
                        onClick={handleGuardarUsername}
                        disabled={guardandoUsername}
                      >
                        {guardandoUsername ? '…' : '✓'}
                      </button>
                      <button
                        className="intel-campo__btn-cancelar"
                        onClick={() => { setEditandoUsername(false); setUsername(usernameInicial); setFeedbackUsername(null); }}
                      >
                        ✕
                      </button>
                    </div>
                    {feedbackUsername && (
                      <p className={feedbackUsername.ok ? 'intel-campo__ok' : 'intel-campo__err'}>
                        {feedbackUsername.msg}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="intel-campo__fila">
                      <span className="intel-campo__valor">{username}</span>
                      <button className="intel-campo__btn-editar" onClick={() => { setEditandoUsername(true); setFeedbackUsername(null); }}>✎</button>
                    </div>
                    {feedbackUsername?.ok && <p className="intel-campo__ok">{feedbackUsername.msg}</p>}
                  </>
                )}
              </div>

              {/* Email */}
              <div className="intel-campo">
                <span className="intel-campo__label">Correo de Campo</span>
                {editandoEmail ? (
                  <>
                    <div className="intel-campo__fila">
                      <input
                        className="intel-campo__input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleGuardarEmail()}
                      />
                      <button
                        className="intel-campo__btn"
                        onClick={handleGuardarEmail}
                        disabled={guardandoEmail}
                      >
                        {guardandoEmail ? '…' : '✓'}
                      </button>
                      <button
                        className="intel-campo__btn-cancelar"
                        onClick={() => { setEditandoEmail(false); setEmail(emailInicial); setFeedbackEmail(null); }}
                      >
                        ✕
                      </button>
                    </div>
                    {feedbackEmail && (
                      <p className={feedbackEmail.ok ? 'intel-campo__ok' : 'intel-campo__err'}>
                        {feedbackEmail.msg}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="intel-campo__fila">
                      <span className="intel-campo__valor">{email || '—'}</span>
                      <button className="intel-campo__btn-editar" onClick={() => { setEditandoEmail(true); setFeedbackEmail(null); }}>✎</button>
                    </div>
                    {feedbackEmail?.ok && <p className="intel-campo__ok">{feedbackEmail.msg}</p>}
                  </>
                )}
              </div>

              <button className="lobby-boton-secundario intel-btn-password" onClick={handleCambiarPassword}>
                Cambiar Contraseña
              </button>

            </div>
          </div>

          <hr className="lobby-separador" style={{ width: '100%' }} />

          {/* Aquí inyectamos el componente táctico que hicimos antes */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            <PanelEstadisticas estadisticas={estadisticas} isLoading={isLoadingStats} />
          </div>
        </div>{/* fin zona scrollable */}

        <hr className="lobby-separador" style={{ width: '100%' }} />

        <button
          onClick={handleLogout}
          style={{ width: '100%', padding: '0.6rem', background: 'transparent', color: 'var(--color-state-danger)', border: '1px solid var(--color-state-danger)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '1px', transition: 'background 0.2s', flexShrink: 0 }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(211,47,47,0.15)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          Abandonar Campo
        </button>

      </div>
    </div>
  );
};

export default PanelInteligencia;
