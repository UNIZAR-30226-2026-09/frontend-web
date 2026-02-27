// src/store/useMapStore.js
import { create } from 'zustand';

export const useMapStore = create((set) => ({
    // Guardará los IDs: [0] = Origen (Atacante, azul), [1] = Destino (Defensor, rojo)
    selectedComarcas: [],

    toggleSelection: (id) => set((state) => {
        const isSelected = state.selectedComarcas.includes(id);

        // Si la comarca ya estaba seleccionada
        if (isSelected) {
            // Si haces clic en el atacante, cancelamos todo el ataque
            if (state.selectedComarcas[0] === id) {
                return { selectedComarcas: [] };
            }
            // Si haces clic en el defensor, solo quitamos el defensor
            else {
                return { selectedComarcas: [state.selectedComarcas[0]] };
            }
        }

        // Si no estaba seleccionada y tenemos menos de 2, la añadimos.
        if (state.selectedComarcas.length < 2) {
            return { selectedComarcas: [...state.selectedComarcas, id] };
        }

        // Si ya hay 2 seleccionadas y pinchas una nueva, cambiamos el destino (el 2º elemento)
        return { selectedComarcas: [state.selectedComarcas[0], id] };
    }),

    // Función para limpiar todo (botón de "Cancelar" o al terminar un ataque)
    clearSelection: () => set({ selectedComarcas: [] }),
}));