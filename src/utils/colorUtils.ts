/**
 * Obtiene el color de representación visual asociado a una región geográfica específica en el mapa.
 *
 * @param {string} regionId - Identificador constante de la región evaluada.
 * @returns {string} Variable CSS con el color designado, o un color neutral de respaldo si no existe.
 */
export const obtenerColorRegion = (regionId: string): string => {
  const coloresRegiones: Record<string, string> = {
    'frontera_pirenaica': 'var(--color-region-1)',
    'estepas_y_condados': 'var(--color-region-2)',
    'alto_ebro': 'var(--color-region-3)',
    'campos_serrania': 'var(--color-region-4)',
    'valles_matarrana': 'var(--color-region-5)',
    'sierras_sur': 'var(--color-region-6)',
  };

  const colorEncontrado = coloresRegiones[regionId];

  if (colorEncontrado) {
    return colorEncontrado;
  }

  return 'var(--color-ui-bg-secondary)';
};
