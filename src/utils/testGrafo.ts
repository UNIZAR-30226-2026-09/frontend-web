// archivo rápido para comprobar que no la hemos liado con el json
// lo montamos deprisa y corriendo para ver si el bfs tiraba bien
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { construirGrafoComarcas, calcularComarcasEnRango } from './graphUtils.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// pillamos el mapa gordo
const jsonPath = path.join(__dirname, '../data/map_aragon.json');
const rawFile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// acá apañamos el formato viejo en inglés del json a los dtos que entiende el zustand
// (típicamente cambiar nombres y dejarlo listo)
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
    // DANDOLE CAÑA AL ALGORITMO BFS
    // ---------------------------------------------------------
    console.log('\n⚔️  Iniciando simulación de alcance BFS...');
    const origen = 'zaragoza'; // pillamos zaragoza porque pilla por el medio y prueba bien

    console.log(`\nTropas estacionadas en: [${grafo.get(origen)?.nombre}]`);

    // vamos metiendo rango a ver hasta donde engancha
    for (let rango = 0; rango <= 3; rango++) {
        const alcanzables = calcularComarcasEnRango(grafo, origen, rango);
        // esto es solo pa que por consola salgan nombres legibles en vez del string id raro
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