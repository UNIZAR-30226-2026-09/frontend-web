// src/pantallas/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { fetchApi } from '../services/api';
import '../styles/Lobby.css';

/**
 * Pantalla de inicio de sesión y registro de comandantes.
 * @returns {JSX.Element}
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
    }
  }, [isAuthenticated, navigate]);

  /**
   * Procesa el envío del formulario para login o registro.
   * @param {React.FormEvent} e
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (isRegistering) {
      if (username.length < 6) {
        setError("El nombre de usuario debe tener al menos 6 caracteres.");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      let endpoint = '/v1/usuarios/login';
      let contentType = 'application/x-www-form-urlencoded';
      let body = new URLSearchParams({
        username: username,
        password: password
      }).toString();

      let tipoAccion = 'login';

      if (isRegistering) {
        endpoint = '/v1/usuarios/registro';
        contentType = 'application/json';
        body = JSON.stringify({
          username: username,
          email: email,
          password: password
        });
        tipoAccion = 'registro';
      }

      const data = await fetchApi(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: body
      });

      console.log(`¡Respuesta del back para ${tipoAccion}!`, data);

      const jwtToken = data.access_token || data.token;
      if (jwtToken) {
        // Pedimos los datos completos del perfil (incluyendo el avatar) antes de guardarlos en local
        const userProfile = await fetchApi('/v1/usuarios/me', {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        
        login(userProfile || data.usuario || { nombre_usuario: username }, jwtToken);
        navigate('/lobby');
      } else if (isRegistering) {
        setExito("Registro exitoso. Ahora inicia sesión.");
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      }

    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    }
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setConfirmPassword('');
    setError(null);
    setExito(null);
  };

  const abrirFormulario = (modoRegistro) => {
    setIsRegistering(modoRegistro);
    setMostrarFormulario(true);
    setEmail('');
    setConfirmPassword('');
    setError(null);
    setExito(null);
  };

  const estiloPanelAcceso = {
    background: 'var(--color-ui-panel-overlay)',
    backdropFilter: 'blur(5px)',
    padding: '1.8rem',
    borderRadius: '12px',
    border: '2px solid var(--color-border-gold)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    transform: 'translateY(2.5vh)',
    width: '100%',
    maxWidth: '350px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box'
  };

  let tituloFormulario = 'INICIAR SESIÓN';
  let textoBotonSubmit = 'Entrar al Campo';
  let textoToggleModo = '¿No tienes cuenta? Regístrate aquí';

  if (isRegistering) {
    tituloFormulario = 'NUEVO RECLUTA';
    textoBotonSubmit = 'Alistarse';
    textoToggleModo = '¿Ya eres veterano? Entra aquí';
  }

  return (
    <div style={{
      backgroundImage: 'url(/fondoInicioSvg.png)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'var(--color-ui-bg-primary)',
      backgroundPosition: 'bottom center',
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      {mostrarFormulario ? (
        <form
          onSubmit={handleSubmit}
          style={estiloPanelAcceso}
        >
          <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
            {tituloFormulario}
          </h2>

          {error && <p className="lobby-error">⚠ {error}</p>}
          {exito && <p style={{ color: 'var(--color-state-success)', fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>✓ {exito}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Nombre de guerra..."
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border-bronze)', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {isRegistering && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border-bronze)', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border-bronze)', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {isRegistering && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Confirmar Contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite la contraseña"
                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border-bronze)', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="lobby-boton-primario"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {textoBotonSubmit}
          </button>

          <p
            style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)', cursor: 'pointer', margin: 0, textDecoration: 'underline' }}
            onClick={toggleAuthMode}
          >
            {textoToggleModo}
          </p>
        </form>
      ) : (
        <div style={{ ...estiloPanelAcceso, alignItems: 'stretch' }}>
          <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--color-border-gold)', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Acceso al Cuartel
          </h2>
          <p style={{ textAlign: 'center', margin: 0, color: 'var(--color-text-secondary)' }}>
            Elige cómo quieres entrar en la campaña.
          </p>
          <button
            type="button"
            className="lobby-boton-primario"
            style={{ width: '100%' }}
            onClick={() => abrirFormulario(false)}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className="lobby-boton-secundario"
            style={{ width: '100%' }}
            onClick={() => abrirFormulario(true)}
          >
            Registrarse
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;