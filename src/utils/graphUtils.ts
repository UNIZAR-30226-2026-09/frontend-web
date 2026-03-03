import { ComarcaDTO, GrafoSoberania, NodoComarca } from '../types/mapa.types';

/**
 * Ingresa un array de DTOs, construye el grafo y audita su integridad.
 * @param rawData Datos base JSON o API.
 * @returns Instancia GraphMap validada.
 */
export function construirGrafoComarcas(rawData: ComarcaDTO[]): GrafoSoberania {
    const grafo: GrafoSoberania = new Map();

    for (const dto of rawData) {
        if (grafo.has(dto.id)) { // comprueba que no hay comarcas con el mismo ID
            throw new Error(`Integridad fallida: ID de comarca duplicado (${dto.id}).`);
        }

        const nodo: NodoComarca = {
            id: dto.id,
            nombre: dto.nombre,
            adyacentes: [...dto.adyacentes], // copia del array
        };

        grafo.set(dto.id, nodo);
    }

    // Validación de Integridad Estructural
    for (const [id, nodo] of grafo) {
        for (const adyacenteId of nodo.adyacentes) {
            if (!grafo.has(adyacenteId)) { // comprueba que existe
                throw new Error(
                    `Grafo inválido: [${nodo.nombre}] apunta a [${adyacenteId}] inexistente.`
                );
            }

            const vecino = grafo.get(adyacenteId)!;
            if (!vecino.adyacentes.includes(id)) { // comprueba que existe la relación en ambas direcciones
                throw new Error(
                    `Grafo asimetrico entre [${nodo.nombre}] y [${vecino.nombre}].`
                );
            }

            if (id === adyacenteId) { // comprueba que no hay auto-referencia
                throw new Error(
                    `Auto-referencia no valida: [${nodo.nombre}].`
                );
            }
        }
    }

    return grafo;
}

/**
 * Calcula todas las comarcas accesibles desde un origen hasta un rango máximo de distancia,
 * utilizando el algoritmo BFS (Búsqueda en Anchura).
 * 
 * @param grafo El GrafoSoberania ya validado.
 * @param origenId El ID de la comarca inicial.
 * @param rangoMaximo El número máximo de saltos.
 * @returns Un Set con los IDs de las comarcas alcanzables.
 */
export function calcularComarcasEnRango(
    grafo: GrafoSoberania,
    origenId: string,
    rangoMaximo: number
): Set<string> {
    if (!grafo.has(origenId)) {
        throw new Error(`El origen (${origenId}) no existe en el grafo.`);
    }

    const visitados = new Set<string>();
    visitados.add(origenId);

    if (rangoMaximo === 0) {
        return visitados;
    }

    const cola: [string, number][] = [[origenId, 0]];

    while (cola.length > 0) {
        const [idActual, distanciaAcumulada] = cola.shift()!;
        const nodoActual = grafo.get(idActual)!;

        for (const vecinoId of nodoActual.adyacentes) {
            if (!visitados.has(vecinoId)) {
                visitados.add(vecinoId);
                const nuevaDistancia = distanciaAcumulada + 1;

                if (nuevaDistancia < rangoMaximo) {
                    cola.push([vecinoId, nuevaDistancia]);
                }
            }
        }
    }

    visitados.delete(origenId); // No se puede atacar a uno mismo

    return visitados;
}
