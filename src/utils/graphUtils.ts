import { ComarcaDTO, GrafoSoberania, NodoComarca } from '../types/mapa.types';

/**
 * Procesa el conjunto de datos cartográficos crudos y construye un grafo bidireccional,
 * validando la integridad referencial y las simetrías entre entidades a nivel estructural.
 *
 * @param {ComarcaDTO[]} rawData - Colección de nodos obtenidos de las transferencias de red o JSON embebidos.
 * @returns {GrafoSoberania} Estructura de mapa transitable en memoria para los algoritmos.
 * @throws {Error} Si detecta dependencias circulares, identificadores duplicados o asimetría en las aristas.
 */
export function construirGrafoComarcas(rawData: ComarcaDTO[]): GrafoSoberania {
  const grafo: GrafoSoberania = new Map();

  for (const dto of rawData) {
    if (grafo.has(dto.id)) {
      throw new Error(`Integridad fallida: ID de comarca duplicado (${dto.id}).`);
    }

    const nodo: NodoComarca = {
      id: dto.id,
      nombre: dto.nombre,
      adyacentes: [...dto.adyacentes],
    };

    grafo.set(dto.id, nodo);
  }

  // Validación de calidad cruzando datos para evitar grafos corruptos
  for (const [id, nodo] of grafo) {
    for (const adyacenteId of nodo.adyacentes) {
      if (!grafo.has(adyacenteId)) {
        throw new Error(
          `Grafo inválido: [${nodo.nombre}] apunta a [${adyacenteId}] inexistente.`
        );
      }

      const vecino = grafo.get(adyacenteId)!;
      if (!vecino.adyacentes.includes(id)) {
        throw new Error(
          `Grafo asimétrico entre [${nodo.nombre}] y [${vecino.nombre}].`
        );
      }

      if (id === adyacenteId) {
        throw new Error(
          `Auto-referencia no válida: [${nodo.nombre}].`
        );
      }
    }
  }

  return grafo;
}

/**
 * Implementación de Búsqueda en Anchura (BFS) para determinar la topología
 * de alcance permisible partiendo de un origen, según el límite de movilidad del estado del juego.
 * 
 * @param {GrafoSoberania} grafo - Mapa estructurado de nodos y aristas validadas.
 * @param {string} origenId - Identificador del nodo raíz de exploración.
 * @param {number} rangoMaximo - Nivel máximo de profundidad permitido (Infinity para sin límite).
 * @param {(id: string) => boolean} [filtroAdyacente] - Predicado opcional para restringir el paso por ciertos nodos.
 * @returns {Set<string>} Conjunto único conteniendo los identificadores de todos los nodos alcanzables.
 * @throws {Error} Si el origen proporcionado no existe en el grafo actual.
 */
export function calcularComarcasEnRango(
  grafo: GrafoSoberania,
  origenId: string,
  rangoMaximo: number,
  filtroAdyacente?: (id: string) => boolean
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
        // Si hay un filtro, solo visitamos el vecino si el filtro lo permite.
        // Importante: El filtro controla si podemos PASAR por ese nodo.
        if (filtroAdyacente && !filtroAdyacente(vecinoId)) {
          continue;
        }

        visitados.add(vecinoId);
        const nuevaDistancia = distanciaAcumulada + 1;

        if (nuevaDistancia < rangoMaximo) {
          cola.push([vecinoId, nuevaDistancia]);
        }
      }
    }
  }

  // Se excluye el nodo de origen del conjunto resultante
  visitados.delete(origenId);

  return visitados;
}
