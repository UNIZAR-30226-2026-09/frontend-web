// src/store/useAuthStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    // Inicializar valores
    user: null,
    token: null,
    isAuthenticated: false,

    // Función para login
    login: (userData, jwtToken) => {
        localStorage.setItem('soberania_token', jwtToken);
        set({
            user: userData,
            token: jwtToken,
            isAuthenticated: true,
        });
    },

    // Función para logout
    logout: () => {
        localStorage.removeItem('soberania_token');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    // Función para guardar el estado de si estaba logueado el usuario o no, así si 
    // refresca la página no lo echa de la partida
    checkSession: () => {
        const savedToken = localStorage.getItem('soberania_token');
        if (savedToken) {
            set({ token: savedToken, isAuthenticated: true });
        }
    }
}));