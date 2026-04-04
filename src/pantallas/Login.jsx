// src/pantallas/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { fetchApi } from '../services/api';

/**
 * Pantalla de inicio de sesión y registro de comandantes.
 * @returns {JSX.Element}
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

    if (isRegistering) {
      if (email !== confirmEmail) {
        alert("Los correos electrónicos no coinciden.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
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
        login(data.usuario || { nombre_usuario: username }, jwtToken);
        navigate('/lobby');
      } else if (isRegistering) {
        alert("Registro exitoso Ahora inicia sesión.");
        setIsRegistering(false);
      }

    } catch (error) {
      console.error("Error:", error.message);
      alert(error.message);
    }
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setConfirmEmail('');
    setConfirmPassword('');
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
      backgroundImage: 'url(/fondo-login.png)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'var(--color-ui-bg-primary)',
      backgroundPosition: 'top center',
      height: '100%',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--color-ui-panel-overlay)',
          backdropFilter: 'blur(5px)',
          padding: '1.8rem',
          borderRadius: '12px',
          border: '1px solid var(--color-border-bronze)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '350px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--color-text-primary)', textTransform: 'uppercase' }}>
          {tituloFormulario}
        </h2>

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
          <>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Confirmar Correo</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                required
                placeholder="Repite tu correo"
                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border-bronze)', background: 'var(--color-ui-bg-secondary)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Mínimo 8 caracteres"
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
          style={{
            padding: '1rem',
            marginTop: '1rem',
            background: 'var(--color-border-gold)',
            color: 'var(--color-ui-bg-primary)',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
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
    </div>
  );
};

export default Login;