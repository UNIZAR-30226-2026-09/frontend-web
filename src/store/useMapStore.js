// src/store/useMapStore.js
import { create } from 'zustand';

/**
 * Gestor de estado específico para las selecciones temporales en el mapa.
 * Controla qué comarcas están clicadas para actuar como origen/destino
 * en acciones como ataques o envío de tropas.
 */
export const useMapStore = create((set) => ({
  selectedComarcas: [],

  /**
   * Alterna la selección de una comarca, gestionando internamente si es origen o destino
   * y controlando las deselecciones accidentales sobre la propia comarca.
   * @param {string} id - Identificador de la comarca sobre la que se hizo click.
   */
  toggleSelection: (id) => set((state) => {
    const isSelected = state.selectedComarcas.includes(id);

    // Si ya estaba seleccionada...
    if (isSelected) {
      // Diferenciamos si el jugador hizo clic sobre el origen (para cancelar todo)
      if (state.selectedComarcas[0] === id) {
        return { selectedComarcas: [] };
      }

      // O si hizo click sobre un objetivo de ataque para descartar a ese defensor
      return { selectedComarcas: [state.selectedComarcas[0]] };
    }

    // Si hay espacio libre (no hay origen Y destino seleccionados simultáneamente)
    if (state.selectedComarcas.length < 2) {
      return { selectedComarcas: [...state.selectedComarcas, id] };
    }

    // Si está lleno, el nuevo click sustituye al destino actual, manteniendo el origen
    return { selectedComarcas: [state.selectedComarcas[0], id] };
  }),

  /**
   * Vacia el array de comarcas seleccionadas.
   */
  clearSelection: () => set({ selectedComarcas: [] }),
}));