// src/store/useMapStore.js
import { create } from 'zustand';

export const useMapStore = create((set) => ({
    selectedComarcas: [],

    toggleSelection: (id) => set((state) => {
        const isSelected = state.selectedComarcas.includes(id);

        if (isSelected) { // si ya estaba pinchada...
            if (state.selectedComarcas[0] === id) { // si el origen de repente clica en sí mismo de nuevo, cancelamos la jugada
                return { selectedComarcas: [] };
            }
            else { // si hacemos click en el pobre defensor ya elegido, lo quitamos de la diana
                return { selectedComarcas: [state.selectedComarcas[0]] };
            }
        }

        if (state.selectedComarcas.length < 2) { // si tenemos hueco libre en el array la metemos para ser origen o destino
            return { selectedComarcas: [...state.selectedComarcas, id] };
        }
        return { selectedComarcas: [state.selectedComarcas[0], id] };
    }),

    clearSelection: () => set({ selectedComarcas: [] }),
}));