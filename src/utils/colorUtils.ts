export const obtenerColorRegion = (regionId: string): string => {
    const coloresRegiones: Record<string, string> = {
        'frontera_pirenaica': '#4ade80',
        'estepas_y_condados': '#facc15',
        'alto_ebro': '#60a5fa',
        'campos_serrania': '#c084fc',
        'valles_matarrana': '#f87171',
        'sierras_sur': '#fb923c',
    };

    return coloresRegiones[regionId] || '#cbd5e1';
};
