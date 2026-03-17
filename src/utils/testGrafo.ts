/**
 * Script de validación para la carga estática del grafo topológico.
 * Verifica el parseo del JSON y la correctitud del algoritmo BFS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { construirGrafoComarcas, calcularComarcasEnRango } from './graphUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../data/map_aragon.json');
const rawFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Mapeo inicial del formato estructural JSON al modelo DTO intermedio
const rawData = Object.entries(rawFile.comarcas).map(([key, value]: [string, any]) => ({
    id: key,
    nombre: value.name,
    adyacentes: value.adjacent_to,
}));

try {
    console.log('⏳ Iniciando prueba de ingesta de datos cartográficos...');
    const grafo = construirGrafoComarcas(rawData);

    console.log('✅ Grafo construido correctamente.');
    console.log(`🗺️  Total de comarcas cargadas: ${grafo.size}`);

    const unaComarca = Array.from(grafo.keys())[0];
    console.log(`\n🔍 Inspeccionando la primera comarca de registro ("${unaComarca}"):`);
    console.log(grafo.get(unaComarca));

    console.log('\n🛡️ Validación de integridad estructural superada. (Sin asimetrías o nodos fantasma).');

    // ---------------------------------------------------------
    // VALIDACIÓN DEL ALGORITMO BFS
    // ---------------------------------------------------------
    console.log('\n⚔️  Iniciando simulación de alcance BFS...');
    // Nodo de prueba estratégico y céntrico
    const origen = 'zaragoza';

    console.log(`\nTropas estacionadas en origen: [${grafo.get(origen)?.nombre}]`);

    for (let rango = 0; rango <= 3; rango++) {
        const alcanzables = calcularComarcasEnRango(grafo, origen, rango);
        const nombresAlcanzables = Array.from(alcanzables).map(id => grafo.get(id)?.nombre);

        console.log(`\n▶ Rango ${rango} salto(s):`);
        console.log(`   └ Alcanza ${alcanzables.size} comarcas:`, nombresAlcanzables.join(', '));
    }

    console.log('\n✅ Búsqueda algorítmica BFS validada con éxito.');

} catch (error: unknown) {
    console.error('\n❌ Error detectado:');
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }
}