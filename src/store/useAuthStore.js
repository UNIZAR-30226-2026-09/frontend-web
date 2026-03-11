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
        localStorage.setItem('soberania_user', JSON.stringify(userData));
        set({
            user: userData,
            token: jwtToken,
            isAuthenticated: true,
        });
    },

    // Función para logout
    logout: () => {
        localStorage.removeItem('soberania_token');
        localStorage.removeItem('soberania_user');
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
        const savedUser = localStorage.getItem('soberania_user');
        if (savedToken) {
            let parsedUser = null;
            try {
                if (savedUser) parsedUser = JSON.parse(savedUser);
            } catch (e) {
                console.error("Error parsing saved user:", e);
            }
            set({ token: savedToken, user: parsedUser, isAuthenticated: true });
        }
    }
}));