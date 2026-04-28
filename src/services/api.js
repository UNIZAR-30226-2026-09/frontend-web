// src/services/api.js

export const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000/api`;
export const BASE_URL = API_URL.replace(/\/api$/, '');

/**
 * Envoltorio base para realizar peticiones HTTP al servidor.
 * Centraliza la inyección del token de autorización (JWT) y el manejo unificado de errores,
 * evitando así tener que repetir la misma lógica fetch en cada componente o capa de datos.
 *
 * @param {string} endpoint - La ruta a consultar (ej. '/v1/usuarios/login').
 * @param {RequestInit} [options={}] - Objeto de configuración nativo de fetch (method, body, etc.).
 * @returns {Promise<any>} Promesa que resuelve con la respuesta parseada de JSON.
 * @throws {Error} Lanza error con el mensaje del backend si la respuesta HTTP no es OK (ej. 401, 500).
 */
export const fetchApi = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('soberania_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token && !endpoint.includes('/login') && !endpoint.includes('/registro')) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        if (response.status === 401) {
            // El token es inválido o ha caducado
            localStorage.removeItem('soberania_token');
            localStorage.removeItem('soberania_user');
            window.location.href = '/';
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Error HTTP: ${response.status}`);
    }

    return response.json();
};
