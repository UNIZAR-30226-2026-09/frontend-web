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
    'frontera_pirenaica': 'var(--color-region-pirineos)',
    'estepas_y_condados': 'var(--color-region-estepas)',
    'alto_ebro':          'var(--color-region-ebro)',
    'campos_serrania':    'var(--color-region-campos)',
    'valles_matarrana':   'var(--color-region-valles)',
    'sierras_sur':        'var(--color-region-sierras)',
  };

  const coloresFuertes: Record<string, string> = {
    'frontera_pirenaica': 'var(--color-region-pirineos-fuerte)',
    'estepas_y_condados': 'var(--color-region-estepas-fuerte)',
    'alto_ebro':          'var(--color-region-ebro-fuerte)',
    'campos_serrania':    'var(--color-region-campos-fuerte)',
    'valles_matarrana':   'var(--color-region-valles-fuerte)',
    'sierras_sur':        'var(--color-region-sierras-fuerte)',
  };

  if (esDelJugador) {
    const colorFuerte = coloresFuertes[regionId];
    if (colorFuerte) return colorFuerte;
  }

  const colorBase = coloresBase[regionId];
  if (colorBase) return colorBase;

  return 'var(--color-ui-bg-secondary)';
};
