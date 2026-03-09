// src/services/api.js (o src/config/api.js)

// Pillamos la URL de las variables de entorno de Vite
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Función helper para no repetir código en cada petición (fetch)
export const fetchApi = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('soberania_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Si tenemos token de sesión, lo mandamos en la cabecera
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Asegúrate de que tu back use este formato
    }

    const response = await fetch(url, { ...options, headers });

    // Si la respuesta no es OK (ej: 401, 500...), lanzamos error para cazarlo en el componente
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    return response.json();
};
