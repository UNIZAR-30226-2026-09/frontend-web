// src/services/gameApi.ts
import { fetchApi } from './api';

export const gameApi = {
    atacarTerritorio: async (partidaId: number | string, origenId: string, destinoId: string, tropas: number) => {
        return fetchApi(`/v1/partidas/${partidaId}/ataque`, {
            method: 'POST',
            body: JSON.stringify({
                territorio_origen_id: origenId,
                territorio_destino_id: destinoId,
                tropas_a_mover: tropas
            })
        });
    },

    colocarTropas: async (partidaId: number | string, territorioId: string, tropas: number) => {
        return fetchApi(`/v1/partidas/${partidaId}/colocar_tropas`, {
            method: 'POST',
            body: JSON.stringify({
                territorio_id: territorioId,
                tropas: tropas
            })
        });
    },

    pasarFase: async (partidaId: number | string) => {
        return fetchApi(`/v1/partidas/${partidaId}/pasar_fase`, {
            method: 'POST'
        });
    },

    moverConquista: async (partidaId: number | string, tropas: number) => {
        return fetchApi(`/v1/partidas/${partidaId}/mover_conquista`, {
            method: 'POST',
            body: JSON.stringify({
                tropas: tropas
            })
        });
    },

    abandonarPartida: async (partidaId: number | string) => {
        return fetchApi(`/v1/partidas/${partidaId}/abandonar`, {
            method: 'POST'
        });
    },

    fortificar: async (partidaId: number | string, origenId: string, destinoId: string, tropas: number) => {
        return fetchApi(`/v1/partidas/${partidaId}/fortificar`, {
            method: 'POST',
            body: JSON.stringify({
                origen: origenId,
                destino: destinoId,
                tropas: tropas
            })
        });
    }
};
