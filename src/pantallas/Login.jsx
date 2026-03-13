// src/pantallas/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { fetchApi } from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

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
            // Dependiendo de si estamos registrando o logueando, usamos una ruta u otra
            const endpoint = isRegistering ? '/v1/usuarios/registro' : '/v1/usuarios/login';

            let payload;
            let headers;

            if (isRegistering) {
                payload = JSON.stringify({
                    username: username,
                    nombre_usuario: username,
                    email: email,
                    password: password
                });
                headers = { 'Content-Type': 'application/json' };
            } else {
                payload = new URLSearchParams({
                    username: username,
                    password: password
                }).toString();
                headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            }

            const data = await fetchApi(endpoint, {
                method: 'POST',
                headers: headers,
                body: payload
            });

            console.log(`¡Respuesta del back para ${isRegistering ? 'registro' : 'login'}!`, data);

            // Si el backend devuelve un token tras loguear (o tras registrar)
            const jwtToken = data.access_token || data.token;
            if (jwtToken) {
                // Guardamos en Zustand
                login(data.usuario || { nombre_usuario: username }, jwtToken);
                // Vamos al lobby
                navigate('/lobby');
            } else if (isRegistering) {
                // Si el registro no te loguea automáticamente, cambiamos el formulario a login
                alert("¡Reclutamiento exitoso! Ahora entra al campo (inicia sesión).");
                setIsRegistering(false);
            }

        } catch (error) {
            console.error("Uf, algo falló:", error.message);
            alert(error.message); // Mostramos el error del backend
        }
    };


    return (
        <div style={{
            // 1. EL FONDO DE PANTALLA
            backgroundImage: 'url(/fondo-login.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#0a0a0a',
            backgroundPosition: 'top center',
            // Esto hace que ocupe todo el espacio que le deja el Layout
            height: '100%',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            // Sombra interior para oscurecer un poco los bordes de la imagen
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
        }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    background: 'rgba(20, 20, 20, 0.85)',
                    backdropFilter: 'blur(5px)', // Desenfoca lo que hay justo detrás de la caja
                    padding: '1.8rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)', // Borde 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%',
                    maxWidth: '300px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' // Sombra para que flote
                }}
            >
                <h2 style={{ textAlign: 'center', margin: 0, color: 'var(--primary-neon, #fff)', textTransform: 'uppercase' }}>
                    {isRegistering ? 'NUEVO RECLUTA' : 'INICIAR SESIÓN'}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Usuario</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                    />
                </div>

                {isRegistering && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Confirmar Email</label>
                            <input
                                type="email"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                required
                                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                        </div>
                    </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                    />
                </div>

                {isRegistering && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                        />
                    </div>
                )}

                <button
                    type="submit"
                    style={{
                        padding: '1rem',
                        marginTop: '1rem',
                        background: 'var(--primary-neon, #4db29a)',
                        color: 'black',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                >
                    {isRegistering ? 'Alistarse' : 'Entrar al Campo'}
                </button>

                <p
                    style={{ textAlign: 'center', fontSize: '0.85rem', color: '#aaa', cursor: 'pointer', margin: 0, textDecoration: 'underline' }}
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering ? '¿Ya eres veterano? Entra aquí' : '¿No tienes cuenta? Regístrate aquí'}
                </p>
            </form>
        </div>
    );
};

export default Login;