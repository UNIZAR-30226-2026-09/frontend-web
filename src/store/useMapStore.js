// src/store/useMapStore.js
import { create } from 'zustand';

export const useMapStore = create((set) => ({
    selectedComarcas: [],

    toggleSelection: (id) => set((state) => {
        const isSelected = state.selectedComarcas.includes(id);

        if (isSelected) { // Si la comarca ya estaba seleccionada
            if (state.selectedComarcas[0] === id) { // Si hacemos clic en el atacante (índice 0), deseleccionamos todo
                return { selectedComarcas: [] };
            }
            else { // Si hacemos clic en el defensor (índice 1), lo quitamos
                return { selectedComarcas: [state.selectedComarcas[0]] };
            }
        }

        if (state.selectedComarcas.length < 2) { // Si NO estaba seleccionada y hay menos de 2, la añadimos ("Atacante" o "Defensor")
            return { selectedComarcas: [...state.selectedComarcas, id] };
        }
        return { selectedComarcas: [state.selectedComarcas[0], id] };
    }),

    clearSelection: () => set({ selectedComarcas: [] }),
}));