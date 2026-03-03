/**
 * DTO (Data Transfer Object): Formato crudo esperado del backend.
 */
export interface ComarcaDTO {
    id: string;
    nombre: string;
    adyacentes: string[];
}
/**
 * Nodo interno del juego. 
 * Separarlo del DTO nos permite en el futuro añadir propiedades
 * exclusivas del frontend (ej: tropas, propietario local) sin tocar la red.
 */
export interface NodoComarca {
    id: string;
    nombre: string;
    adyacentes: string[];
}
/**
 * Un Map que relaciona un ID con su NodoComarca en tiempo O(1).
 */
export type GrafoSoberania = Map<string, NodoComarca>;