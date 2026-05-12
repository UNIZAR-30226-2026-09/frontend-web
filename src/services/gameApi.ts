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
    },

    getPartida: async (partidaId: number | string) => {
        return fetchApi(`/v1/partidas/${partidaId}/estado`);
    },

    /**
     * Obtiene el catálogo de tecnologías de una partida activa.
     * Endpoint real del backend: GET /v1/partidas/{partida_id}/tecnologias
     * Devuelve { ramas: { biologica: [...], logistica: [...], artilleria: [...] } }
     */
    getTecnologias: async (partidaId: number | string) => {
        return fetchApi(`/v1/partidas/${partidaId}/tecnologias`);
    },

    /**
     * @deprecated Usar getTecnologias(partidaId) — este endpoint (/tecnologias sin ID) no existe en el backend.
     * Se conserva por compatibilidad hasta que no haya referencias activas.
     */
    getCatalogoTecnologias: async () => {
        console.warn('[getCatalogoTecnologias] DEPRECATED: usar getTecnologias(partidaId).');
        return fetchApi('/v1/partidas/tecnologias');
    },

    /**
     * Compra una tecnología ya desbloqueada para poder usarla como ataque especial.
     * @param partidaId - ID de la partida activa.
     * @param tecnologiaId - ID de la tecnología a comprar.
     * @returns { mensaje, monedas_restantes }
     */
    comprarTecnologia: async (partidaId: number | string, tecnologiaId: string) => {
        return fetchApi(`/v1/partidas/${partidaId}/comprar_tecnologia`, {
            method: 'POST',
            body: JSON.stringify({ tecnologia_id: tecnologiaId })
        });
    },

    /**
     * Ejecuta un ataque especial usando una tecnología comprada.
     * @param partidaId - ID de la partida activa.
     * @param tipoAtaque - ID de la tecnología/habilidad a usar.
     * @param destino - ID del territorio objetivo.
     * @param origen - ID del territorio de origen (opcional).
     */
    ejecutarAtaqueEspecial: async (
        partidaId: number | string,
        tipoAtaque: string,
        destino: string,
        origen?: string | null
    ) => {
        return fetchApi(`/v1/partidas/${partidaId}/ataque_especial`, {
            method: 'POST',
            body: JSON.stringify({ tipo_ataque: tipoAtaque, destino, origen: origen ?? null })
        });
    },

    trabajarTerritorio: async (partidaId: number | string, territorioId: string) => {
        const url = `/v1/partidas/${partidaId}/trabajar`;
        console.log(`🚀 [DEBUG API TRABAJAR] Partida: ${partidaId}, Territorio: ${territorioId}`);
        console.log(`🔗 [DEBUG API TRABAJAR] URL generada: ${url}`);
        
        if (!territorioId) {
            console.error('❌ [DEBUG API TRABAJAR] El territorioId es undefined o nulo.');
            throw new Error("No hay territorio seleccionado para trabajar.");
        }

        return fetchApi(url, {
            method: 'POST',
            body: JSON.stringify({ territorio_id: territorioId })
        });
    },

    /**
     * Asigna un territorio para investigar una habilidad tecnológica.
     * El backend (POST /investigar) espera exactamente el campo `habilidad_id`.
     * La inconsistencia de naming con otros endpoints se absorbe aquí.
     * @param partidaId - ID de la partida.
     * @param territorioId - ID del territorio investigador.
     * @param habilidadId - ID genérico de la habilidad (mismo que usa el catálogo).
     */
    investigarTecnologia: async (partidaId: number | string, territorioId: string, habilidadId: string) => {
        const url = `/v1/partidas/${partidaId}/investigar`;
        console.log(`🚀 [API INVESTIGAR] Partida: ${partidaId}, Territorio: ${territorioId}, Habilidad: ${habilidadId}`);

        if (!territorioId) {
            console.error('❌ [API INVESTIGAR] El territorioId es undefined o nulo.');
            throw new Error("No hay territorio seleccionado para investigar.");
        }
        if (!habilidadId) {
            console.error('❌ [API INVESTIGAR] El habilidadId es undefined o nulo.');
            throw new Error("No hay habilidad seleccionada para investigar.");
        }

        // El backend exige `habilidad_id` para este endpoint específico.
        return fetchApi(url, {
            method: 'POST',
            body: JSON.stringify({
                territorio_id: territorioId,
                habilidad_id: habilidadId,  // campo exacto que pide el backend según OpenAPI
            })
        });
    }
};
