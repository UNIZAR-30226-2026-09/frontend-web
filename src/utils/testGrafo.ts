// Archivo de tests generados con la IA para su rapida comprobacion
// Promt: Genera un archivo de test para comprobar la validez del json del mapa y su algoritmo BFS
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { construirGrafoComarcas, calcularComarcasEnRango } from './graphUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer JSON
const jsonPath = path.join(__dirname, '../data/map_aragon.json');
const rawFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// El JSON local tiene un objeto 'comarcas' donde la clave es el ID, 
// y las propiedades son 'name' y 'adjacent_to'. Lo adaptamos a ComarcaDTO[]
const rawData = Object.entries(rawFile.comarcas).map(([key, value]: [string, any]) => ({
    id: key,
    nombre: value.name,
    adyacentes: value.adjacent_to,
}));

try {
    console.log('⏳ Iniciando prueba de ingesta de datos...');
    const grafo = construirGrafoComarcas(rawData);

    console.log(`✅ ¡Éxito! Grafo construido correctamente.`);
    console.log(`🗺️  Total de comarcas cargadas: ${grafo.size}`);

    const unaComarca = Array.from(grafo.keys())[0];
    console.log(`\n🔍 Inspeccionando la primera comarca cargada ("${unaComarca}"):`);
    console.log(grafo.get(unaComarca));

    console.log('\n🛡️ El código defensivo ha validado perfectamente todo el JSON (No hay asimetrías ni fantasmas).');

    // ---------------------------------------------------------
    // PRUEBA DEL ALGORITMO BFS
    // ---------------------------------------------------------
    console.log('\n⚔️  Iniciando simulación de alcance BFS...');
    const origen = 'zaragoza'; // Usamos Zaragoza como ejemplo central

    console.log(`\nTropas estacionadas en: [${grafo.get(origen)?.nombre}]`);

    // Probamos diferentes rangos tácticos
    for (let rango = 0; rango <= 3; rango++) {
        const alcanzables = calcularComarcasEnRango(grafo, origen, rango);
        // Mapeamos los IDs a nombres legibles para la consola
        const nombresAlcanzables = Array.from(alcanzables).map(id => grafo.get(id)?.nombre);

        console.log(`\n▶ Rango ${rango} salto(s):`);
        console.log(`   └ Alcanza ${alcanzables.size} comarcas:`, nombresAlcanzables.join(', '));
    }
    console.log('\n✅ Búsqueda BFS ejecutada con éxito.');

} catch (error: unknown) {
    console.error('\n❌ Error detectado:');
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }
}