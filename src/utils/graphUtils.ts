import { ComarcaDTO, GrafoSoberania, NodoComarca } from '../types/mapa.types';

/**
 * coge el json en bruto y monta el mapa validando que las conexiones cuadren.
 * es una pieza super obligatoria del diseño del software para hacer check-sanity y
 * comprobar que el grafo es bidireccional y robusto.
 * @param {Array} rawData los datos que vienen del backend o del json local
 * @returns {Map} el diccionario del grafo ya montado listo para usar con los algoritmos
 */
export function construirGrafoComarcas(rawData: ComarcaDTO[]): GrafoSoberania {
    const grafo: GrafoSoberania = new Map();

    for (const dto of rawData) {
        if (grafo.has(dto.id)) { // aseguramos que no se cuelen dos comarcas con la misma id
            throw new Error(`Integridad fallida: ID de comarca duplicado (${dto.id}).`);
        }

        const nodo: NodoComarca = {
            id: dto.id,
            nombre: dto.nombre,
            adyacentes: [...dto.adyacentes], // hacemos copia honda para no pisar el original sin querer
        };

        grafo.set(dto.id, nodo);
    }

    // pasamos el control de calidad cruzando datos
    for (const [id, nodo] of grafo) {
        for (const adyacenteId of nodo.adyacentes) {
            if (!grafo.has(adyacenteId)) { // comprobamos que la comarca vecina existe de verdad
                throw new Error(
                    `Grafo inválido: [${nodo.nombre}] apunta a [${adyacenteId}] inexistente.`
                );
            }

            const vecino = grafo.get(adyacenteId)!;
            if (!vecino.adyacentes.includes(id)) { // revisamos que las carreteras entre comarcas sean de doble sentido
                throw new Error(
                    `Grafo asimetrico entre [${nodo.nombre}] y [${vecino.nombre}].`
                );
            }

            if (id === adyacenteId) { // evitamos que una comarca haga frontera consigo misma
                throw new Error(
                    `Auto-referencia no valida: [${nodo.nombre}].`
                );
            }
        }
    }

    return grafo;
}

/**
 * algoritmo típico de bfs para ver hasta dónde llegamos desde una comarca inicial.
 * básicamente implementa teoría de grafos pura con una cola de tipo LIFO para explorar
 * el array de vecinos hasta llegar al nivel máximo de profundidad pautado (rango).
 * super útil para calcular alcances, o pathfinding simplote más adelante.
 * 
 * @param {Map} grafo el mapa bidireccional que inicializamos antes en el backend
 * @param {string} origenId desde dónde empezamos (id de la comarca, string feo en lowercase)
 * @param {number} rangoMaximo la cantidad de saltos por arista que permitimos antes de parar
 * @returns {Set} un set de javascript plano (sin orden) de todas las IDs accesibles
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

    visitados.delete(origenId); // borramos el origen porque no nos podemos atacar a nosotros mismos

    return visitados;
}
