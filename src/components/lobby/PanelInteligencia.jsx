// src/components/lobby/PanelInteligencia.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi, BASE_URL } from '../../services/api';
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

  // Estados para el avatar
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '/static/perfiles/default.png');
  const [seleccionandoAvatar, setSeleccionandoAvatar] = useState(false);
  const [avataresDisponibles, setAvataresDisponibles] = useState([]);
  const [guardandoAvatar, setGuardandoAvatar] = useState(false);

  // Estados para las estadísticas reales
  const [estadisticas, setEstadisticas] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Cargar estadísticas y datos del perfil al abrir el panel
  useEffect(() => {
    const cargarDatos = async () => {
      setIsLoadingStats(true);
      try {
        const [statsData, userData, opcionesData] = await Promise.all([
          socialApi.obtenerEstadisticas(),
          fetchApi('/v1/usuarios/me', { method: 'GET' }),
          fetchApi('/v1/usuarios/opciones', { method: 'GET' }).catch(() => ({ avatares: [] }))
        ]);
        setEstadisticas(statsData);
        if (userData) {
          if (userData.username) setUsername(userData.username);
          if (userData.email) setEmail(userData.email);
          if (userData.avatar) setAvatarUrl(userData.avatar);
        }
        if (opcionesData && opcionesData.avatares) {
          setAvataresDisponibles(opcionesData.avatares);
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

  const handleSeleccionarAvatar = async (nombreArchivo) => {
    setGuardandoAvatar(true);
    try {
      const actualizado = await fetchApi('/v1/usuarios/me/avatar', {
        method: 'PUT',
        body: JSON.stringify({ avatar_name: nombreArchivo })
      });
      login(actualizado, token);
      setAvatarUrl(actualizado.avatar);
      setSeleccionandoAvatar(false);
    } catch (error) {
      console.error('Error al cambiar avatar:', error);
      alert('Error al actualizar el avatar');
    } finally {
      setGuardandoAvatar(false);
    }
  };

  const nombresAvatares = [
    'José Antonio Labordeta',
    'Alberto Zapater',
    'Amaral',
    'Kase.O',
    'Francisco de Goya',
    'Jesús Vallejo'
  ];

  return (
    <div className="intel-overlay">
      {/* Modal de selección de Avatar */}
      {seleccionandoAvatar && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--color-ui-bg-secondary)', border: '2px solid var(--color-border-bronze)',
            padding: '2rem', borderRadius: '12px', textAlign: 'center', maxWidth: '700px', width: '90%',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ color: 'var(--color-primary-light)', marginTop: 0, marginBottom: '2rem', fontSize: '1.5rem' }}>Seleccionar Foto de Perfil</h3>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '30px 15px', maxHeight: '60vh', overflowY: 'auto', marginBottom: '30px',
              padding: '10px'
            }}>
              {avataresDisponibles.map((avatarName, index) => (
                <div
                  key={avatarName}
                  onClick={() => !guardandoAvatar && handleSeleccionarAvatar(avatarName)}
                  style={{
                    cursor: guardandoAvatar ? 'wait' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    opacity: guardandoAvatar ? 0.5 : 1
                  }}
                >
                  <div style={{
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '4px solid transparent',
                    transition: 'transform 0.2s, border-color 0.2s',
                    aspectRatio: '1/1',
                    width: '100%',
                    maxWidth: '140px'
                  }}
                    onMouseOver={(e) => { if (!guardandoAvatar) e.currentTarget.style.borderColor = 'var(--color-border-gold-vivo)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseOut={(e) => { if (!guardandoAvatar) e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img
                      src={`${BASE_URL}/static/perfiles/${avatarName}`}
                      alt={nombresAvatares[index] || avatarName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '1rem', fontWeight: 'bold' }}>
                    {nombresAvatares[index] || 'Personaje Desconocido'}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSeleccionandoAvatar(false)}
              className="lobby-boton-secundario"
              style={{ padding: '0.6rem 2rem' }}
              disabled={guardandoAvatar}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="intel-panel" style={seleccionandoAvatar ? { filter: 'blur(4px)' } : {}}>

        <button className="intel-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>

        {/* Zona scrollable: todo excepto el botón de logout */}
        <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)' }}>

          <div className="intel-perfil-grid">

            {/* COLUMNA IZQUIERDA: Perfil y Título */}
            <div className="intel-perfil-izq">
              <div
                className="intel-avatar-container"
                style={{ position: 'relative', cursor: 'pointer', borderRadius: '50%', overflow: 'hidden', width: '160px', height: '160px', marginBottom: '10px', border: '3px solid var(--color-border-bronze)' }}
                onClick={() => setSeleccionandoAvatar(true)}
                title="Cambiar Foto"
              >
                <img
                  src={`${BASE_URL}${avatarUrl}`}
                  alt={username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'var(--color-ui-bg-primary)' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.9rem', padding: '6px 0', textAlign: 'center', fontWeight: 'bold' }}>EDITAR</div>
              </div>
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
