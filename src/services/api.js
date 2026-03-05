// src/store/useAuthStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    user: null,       // Datos del usuario (nombre, email...)
    token: null,      // JWT
    isAuthenticated: false,

    // Función para cuando el login es correcto
    login: (userData, jwtToken) => {
        // Guardamos el token 
        localStorage.setItem('soberania_token', jwtToken);

        set({
            user: userData,
            token: jwtToken,
            isAuthenticated: true,
        });
    },

    // Función para cerrar sesión
    logout: () => {
        localStorage.removeItem('soberania_token');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    // Función para guardar el estado de si estaba logueado el usuario, así
    // si cierra pestaña o F5, no lo expulsa de la partida porque se pondría
    // isAuthenticated: false otra vez
    checkSession: () => {
        const savedToken = localStorage.getItem('soberania_token'); // Lee el token
        if (savedToken) {
            // Aquí más adelante haremos un fetch al backend para validar si el token no ha caducado
            set({ token: savedToken, isAuthenticated: true });
        }
    }
}));