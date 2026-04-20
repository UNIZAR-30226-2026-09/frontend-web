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

    getTecnologias: async (partidaId: number | string) => {
        return fetchApi(`/v1/partidas/${partidaId}/tecnologia`);
    },

    /**
     * Obtiene el catálogo global de tecnologías (estructura, descripciones y precios).
     * No requiere partida_id. Devuelve Record<string, { nombre, descripcion, requisitos, precio }>.
     */
    getCatalogoTecnologias: async () => {
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

    investigarTecnologia: async (partidaId: number | string, territorioId: string, tecnologiaId: string) => {
        // En frontend tenemos el tecnología ID "BIOLOGICA_1", pero el backend pide la "rama" ("biologica", "logistica", "artilleria")
        let rama = "biologica"; // fallback seguro
        const idLower = tecnologiaId.toLowerCase();
        
        if (idLower.includes('biologica')) rama = 'biologica';
        if (idLower.includes('operaciones') || idLower.includes('logistica')) rama = 'logistica';
        if (idLower.includes('artilleria')) rama = 'artilleria';

        const url = `/v1/partidas/${partidaId}/investigar`;
        console.log(`🚀 [DEBUG API INVESTIGAR] Partida: ${partidaId}, Territorio: ${territorioId}, Rama: ${rama}`);
        console.log(`🔗 [DEBUG API INVESTIGAR] URL generada: ${url}`);

        if (!territorioId) {
            console.error('❌ [DEBUG API INVESTIGAR] El territorioId es undefined o nulo.');
            throw new Error("No hay territorio seleccionado para investigar.");
        }

        return fetchApi(url, {
            method: 'POST',
            body: JSON.stringify({
                territorio_id: territorioId,
                rama: rama
            })
        });
    }
};
