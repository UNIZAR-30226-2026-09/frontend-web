/**
 * Obtiene el color de representación visual asociado a una región geográfica en el mapa.
 * Devuelve un color más intenso si el territorio pertenece al jugador local.
 *
 * @param {string} regionId      - Identificador constante de la región evaluada.
 * @param {boolean} esDelJugador - Si el territorio pertenece al jugador local activo.
 * @returns {string} Variable CSS con el color designado, o un color neutral de respaldo.
 */
export const obtenerColorRegion = (regionId: string, esDelJugador: boolean): string => {
  const coloresBase: Record<string, string> = {
    'frontera_pirenaica': 'var(--color-region-pirineos-base)',
    'estepas_y_condados': 'var(--color-region-estepas-base)',
    'alto_ebro':          'var(--color-region-ebro-base)',
    'campos_serrania':    'var(--color-region-campos-base)',
    'valles_matarrana':   'var(--color-region-valles-base)',
    'sierras_sur':        'var(--color-region-sierras-base)',
  };

  const coloresMedios: Record<string, string> = {
    'frontera_pirenaica': 'var(--color-region-pirineos-medio)',
    'estepas_y_condados': 'var(--color-region-estepas-medio)',
    'alto_ebro':          'var(--color-region-ebro-medio)',
    'campos_serrania':    'var(--color-region-campos-medio)',
    'valles_matarrana':   'var(--color-region-valles-medio)',
    'sierras_sur':        'var(--color-region-sierras-medio)',
  };

  if (esDelJugador) {
    const colorMedio = coloresMedios[regionId];
    if (colorMedio) return colorMedio;
  }

  const colorBase = coloresBase[regionId];
  if (colorBase) return colorBase;

  return 'var(--color-ui-bg-secondary)';
};

export const obtenerColorFuerteRegion = (regionId: string): string => {
  const coloresFuertes: Record<string, string> = {
    'frontera_pirenaica': 'var(--color-region-pirineos-fuerte)',
    'estepas_y_condados': 'var(--color-region-estepas-fuerte)',
    'alto_ebro':          'var(--color-region-ebro-fuerte)',
    'campos_serrania':    'var(--color-region-campos-fuerte)',
    'valles_matarrana':   'var(--color-region-valles-fuerte)',
    'sierras_sur':        'var(--color-region-sierras-fuerte)',
  };

  const color = coloresFuertes[regionId];
  return color ? color : 'var(--color-text-primary)';
};
