// src/store/useAuthStore.js
import { create } from 'zustand';

/**
 * Gestor de estado de sesión. Controla la autenticación global
 * y almacena el perfil en memoria para uso persistente del jugador.
 */
export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    /**
     * Inicia la sesión almacenando la cuenta y el JWT devuelto por el servidor,
     * inyectándolos en el caché local para arranques futuros de la web.
     * @param {Object} userData - Perfil del usuario autenticado (nombre, id).
     * @param {string} jwtToken - Token Bearer para peticiones a la API.
     */
    login: (userData, jwtToken) => {
        localStorage.setItem('soberania_token', jwtToken);
        localStorage.setItem('soberania_user', JSON.stringify(userData));
        set({
            user: userData,
            token: jwtToken,
            isAuthenticated: true,
        });
    },

    /**
     * Destruye las cookies locales y el estado interno, devolviendo al jugador al menú de entrada.
     */
    logout: () => {
        localStorage.removeItem('soberania_token');
        localStorage.removeItem('soberania_user');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    /**
     * Recupera la cuenta del jugador de la memoria del navegador tras un recargo accidental (F5).
     * Evita tirarlo de la partida si el token todavía subsiste.
     */
    checkSession: () => {
        const savedToken = localStorage.getItem('soberania_token');
        const savedUser = localStorage.getItem('soberania_user');

        if (savedToken) {
            let parsedUser = null;
            try {
                if (savedUser) {
                    parsedUser = JSON.parse(savedUser);
                }
            } catch (e) {
                console.error('Error parseando al usuario guardado:', e);
            }
            set({ token: savedToken, user: parsedUser, isAuthenticated: true });
        }
    }
}));