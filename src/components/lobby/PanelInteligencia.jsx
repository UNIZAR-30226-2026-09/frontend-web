// src/components/lobby/PanelInteligencia.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchApi, BASE_URL, API_URL } from '../../services/api';
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

  const [editandoEmail, setEditandoEmail] = useState(false);
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState(null);

  // Estados para contraseña
  const [editandoPassword, setEditandoPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [feedbackPassword, setFeedbackPassword] = useState(null);

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



  const handleGuardarEmail = () => {
    persistirCambio(
      { email },
      () => setEditandoEmail(false),
      setGuardandoEmail,
      setFeedbackEmail
    );
  };

  const handleCambiarPassword = async () => {
    if (!editandoPassword) {
      setEditandoPassword(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedbackPassword({ ok: false, msg: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
      setFeedbackPassword({ ok: false, msg: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    setGuardandoPassword(true);
    setFeedbackPassword(null);

    try {
      // 1. Verificar contraseña actual usando fetch nativo para evitar el logout global en 401
      const body = new URLSearchParams({
        username: user?.username || user?.nombre_usuario || usernameInicial,
        password: currentPassword
      }).toString();

      const responseLogin = await fetch(`${API_URL}/v1/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      });

      if (!responseLogin.ok) {
        setFeedbackPassword({ ok: false, msg: 'La contraseña actual es incorrecta.' });
        setGuardandoPassword(false);
        return;
      }

      // 2. Si el login funciona, actualizamos la contraseña
      await fetchApi('/v1/usuarios/me', {
        method: 'PUT',
        body: JSON.stringify({ password: newPassword })
      });

      setFeedbackPassword({ ok: true, msg: 'Contraseña cambiada correctamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setEditandoPassword(false); // Cerramos automáticamente el panel de cambio

      // Limpiamos el mensaje de éxito después de un rato
      setTimeout(() => {
        setFeedbackPassword(null);
      }, 4000);

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setFeedbackPassword({ ok: false, msg: error.message || 'Error al cambiar contraseña.' });
    } finally {
      setGuardandoPassword(false);
    }
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

            <div className="intel-scroll-area" style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '30px 15px', maxHeight: '60vh', overflowY: 'auto', marginBottom: '30px',
              padding: '10px 15px 10px 10px'
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
        <div className="intel-scroll-area" style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-sm)', paddingBottom: 'var(--spacing-sm)', paddingRight: '15px' }}>

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
                <div className="intel-campo__fila">
                  <span className="intel-campo__valor" style={{ color: 'var(--color-primary-light)', fontWeight: 'bold' }}>
                    {username}
                  </span>
                </div>
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

              {editandoPassword ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border-bronze)' }}>
                  <span className="intel-campo__label">Contraseña Actual</span>
                  <input
                    type="password"
                    className="intel-campo__input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    style={{ fontSize: '1rem', padding: '0.6rem' }}
                  />
                  <span className="intel-campo__label" style={{ marginTop: '0.5rem' }}>Nueva Contraseña</span>
                  <input
                    type="password"
                    className="intel-campo__input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ fontSize: '1rem', padding: '0.6rem' }}
                  />
                  <span className="intel-campo__label" style={{ marginTop: '0.5rem' }}>Confirmar Nueva Contraseña</span>
                  <input
                    type="password"
                    className="intel-campo__input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCambiarPassword()}
                    placeholder="Repite la nueva contraseña"
                    style={{ fontSize: '1rem', padding: '0.6rem' }}
                  />
                  
                  {feedbackPassword && !feedbackPassword.ok && (
                    <p className="intel-campo__err" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                      {feedbackPassword.msg}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      className="lobby-boton-secundario" 
                      style={{ flex: 1, padding: '0.6rem' }}
                      onClick={() => {
                        setEditandoPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setFeedbackPassword(null);
                      }}
                      disabled={guardandoPassword}
                    >
                      Cancelar
                    </button>
                    <button 
                      className="lobby-boton-primario" 
                      style={{ flex: 1, padding: '0.6rem' }}
                      onClick={handleCambiarPassword}
                      disabled={guardandoPassword}
                    >
                      {guardandoPassword ? 'Guardando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button className="lobby-boton-secundario intel-btn-password" onClick={() => setEditandoPassword(true)}>
                    Cambiar Contraseña
                  </button>
                  {feedbackPassword?.ok && (
                    <p className="intel-campo__ok" style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      ✓ {feedbackPassword.msg}
                    </p>
                  )}
                </>
              )}

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
