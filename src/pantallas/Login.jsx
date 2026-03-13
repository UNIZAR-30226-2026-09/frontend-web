// src/pantallas/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { fetchApi } from '../services/api';

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

    // Si ya estamos logueados, al lobby directamente
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/lobby');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validaciones previas solo para registro
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
            const endpoint = isRegistering ? '/v1/usuarios/registro' : '/v1/usuarios/login';

            let body;
            let contentType;

            if (isRegistering) {
                // El registro suele ser un JSON con todos los datos
                contentType = 'application/json';
                body = JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                });
            } else {
                // El login de FastAPI suele pedir form-data (OAuth2)
                contentType = 'application/x-www-form-urlencoded';
                body = new URLSearchParams({
                    username: username,
                    password: password
                }).toString();
            }

            const data = await fetchApi(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': contentType },
                body: body
            });

            console.log(`¡Respuesta del back para ${isRegistering ? 'registro' : 'login'}!`, data);

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


    return (
        <div style={{
            backgroundImage: 'url(/fondo-login.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#0a0a0a',
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
                    background: 'rgba(20, 20, 20, 0.85)',
                    backdropFilter: 'blur(5px)',
                    padding: '1.8rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%',
                    maxWidth: '350px', // Un poco más ancho por los campos extra
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
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
                        placeholder="Nombre de guerra..."
                        style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                    />
                </div>

                {isRegistering && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="tu@correo.com"
                                style={{ padding: '0.8rem', borderRadius: '4px', border: '1px solid #444', background: '#222', color: 'white' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', color: '#ccc' }}>Confirmar Correo</label>
                            <input
                                type="email"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                required
                                placeholder="Repite tu correo"
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
                        placeholder="Mínimo 8 caracteres"
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
                            placeholder="Repite la contraseña"
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
                    onClick={() => {
                        setIsRegistering(!isRegistering);
                        // Limpiar campos extra al cambiar de modo
                        setEmail('');
                        setConfirmEmail('');
                        setConfirmPassword('');
                    }}
                >
                    {isRegistering ? '¿Ya eres veterano? Entra aquí' : '¿No tienes cuenta? Regístrate aquí'}
                </p>
            </form>
        </div>
    );
};

export default Login;