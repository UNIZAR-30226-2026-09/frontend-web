# Guía de Diseño y Estilo: Soberanía

Este documento define las reglas visuales y de código para estandarizar el desarrollo del frontend de Soberanía. 
Es una referencia para todo el equipo, garantizando consistencia visual y un código limpio

## Filosofía de Diseño
El juego sigue la estética "Grand Strategy". Buscamos una interfaz sobria, oscura y elegante:
- Menos es más: Evitar interfaces sobrecargadas. Se prioriza la legibilidad de los datos estratégicos.
- Tonos bélicos e históricos: Usamos colores apagados y materiales nobles (metales oscuros, dorados, bronces) en lugar de colores chillones o "cartoon".
- Inmersión: La UI no debe distraer del mapa; actúa como un marco de mando militar o gubernamental.

---

## Convenciones de Nombrado (Código)
Para mantener la uniformidad en el desarrollo frontend, aplicaremos estrictamente estas reglas de capitalización:

* PascalCase para Componentes: Todo componente de React (o archivo JSX) debe empezar con mayúscula.
  * Ejemplo: `PanelTropas.jsx`, `BotonAtaque.js`
* camelCase para Variables y Lógica: Variables, constantes, funciones y hooks deben empezar en minúscula.
  * Ejemplo: `turnoActual`, `calcularPoderAtaque()`, `jugadorLocal`
* kebab-case para CSS: Clases CSS, selectores y variables de estilos irán en minúsculas separadas por guiones.
  * Ejemplo: `.panel-lateral`, `.boton-primario`, `--color-ui-bg`

---

## Paleta de Colores

Todos los colores están diseñados para tener un alto contraste visual y cumplir con los estándares de accesibilidad, manteniendo la estética Grand Strategy.

### UI Base
* Fondo Principal: `#1A1A24` (Azul/Gris muy oscuro, evita el negro puro para reducir la fatiga visual).
* Fondo Secundario (Paneles): `#252530` (Ligeramente más claro para crear profundidad).
* Borde Principal (Dorado suave): `#C5A059`
* Borde Secundario (Bronce): `#8C6D3F`
* Texto Principal: `#F0F0F5` (Blanco roto para alto contraste).
* Texto Secundario: `#A0A0B0` (Gris pálido para información menos relevante).

### Estados de UI
* Éxito / Confirmación: `#388E3C` (Verde hoja/musgo, sobrio pero claro).
* Peligro / Ataque / Error: `#D32F2F` (Rojo sangre oscuro).
* Deshabilitado / Inactivo: `#616161` (Gris medio, bajo contraste para indicar inactividad).

### Colores de Facción / Jugadores
Se prohíben los colores primarios saturados. Usaremos tonos "desgastados" y bélicos:
* Jugador 1 (Azul Naval): `#2B5B84`
* Jugador 2 (Rojo Carmesí): `#8B2525`
* Jugador 3 (Verde Oliva): `#3A6B35`
* Jugador 4 (Amarillo Ocre): `#B89947`

### Mapa Interactivo
* Tierra Neutral: `#D4C4A8` (Tono pergamino/arena apagado).
* Océano / Fondo Vacío: `#111118` (Más oscuro que la UI para que el mapa resalte las facciones).
* Selección Origen (Desde dónde atacas): `#E6B800` (Resalte dorado brillante).
* Selección Destino (A dónde atacas): `#E63946` (Resalte rojo brillante).

### Uso Estricto de Variables CSS (Single Source of Truth)

Para garantizar que cambiar un color no rompa el diseño ni nos obligue a buscar en 50 archivos distintos, queda **estrictamente prohibido** usar colores hexadecimales en crudo (`#XXXXXX`), RGB o nombres genéricos (como `red` o `blue`) directamente en el código de los componentes o en archivos CSS secundarios.

Todo color utilizado en el proyecto debe referenciar siempre a las variables globales definidas en nuestro archivo CSS principal. 

**Reglas de aplicación:**

1. **En componentes de React (JSX / SVG / Estilos en línea):**
   Se debe usar la sintaxis `var(--nombre-variable)`.
   *  MAL: `<path fill="#2B5B84" />` 
   *  MAL: `<div style={{ backgroundColor: '#1A1A24' }}>`
   *  BIEN: `<path fill="var(--color-jugador-1)" />` (Lee automáticamente de la hoja de estilos).
   *  BIEN: `<div style={{ backgroundColor: 'var(--color-ui-bg)' }}>`

2. **En archivos CSS:**
   *  MAL: `.panel-lateral { background-color: #252530; }`
   *  BIEN: `.panel-lateral { background-color: var(--color-fondo-secundario); }`
---

## Tipografía y Espaciados

### Tipos de Letra (Fuentes)
* UI General: Usar fuentes sans-serif modernas y altamente legibles, para asegurar que los números y textos pequeños sean nítidos. (Ej: *Inter*, *Roboto* o *Segoe UI*).
* Títulos Principales: Se puede usar una fuente serif elegante (ej: *Cinzel* o *Playfair Display*) exclusivamente para títulos grandes e inmersión, nunca para datos cambiantes.

### Tallas y Espaciados (Uso de `rem`)
En CSS no usaremos `px` para fuentes ni espaciados principales internos. Usaremos `rem` para favorecer la accesibilidad (permitiendo que el diseño escale según la configuración visual del sistema del usuario). 
* `1rem` equivale típicamente a `16px`.
* Usar la escala: `0.25rem` (4px), `0.5rem` (8px), `1rem` (16px), `1.5rem` (24px), `2rem` (32px).


## Estándares de Codificación y Clean Code

Para asegurar la mantenibilidad y calidad del código base , todo el equipo debe adherirse a los siguientes estándares de codificación:

### 1. Formato y Estilo General
* **Comillas:** 
  * Uso de **comillas simples (`'`)** para strings dentro de la lógica de JavaScript / TypeScript (variables, imports, etc.).
  * Uso de **comillas dobles (`"`)** exclusivamente para los valores de los atributos y propiedades en JSX/HTML.

### 2. Estructuras de Control y Renderizado Condicional
* **Prohibido el "Ternary Hell":** Queda estrictamente prohibido anidar operadores ternarios (`condicion ? a : (cond2 ? b : c)`). Dificulta la lectura y la depuración del árbol de componentes.
* **Operadores Lógicos Simples (`&&`, `? :`):** Se restringirán únicamente a evaluaciones simples de una sola línea donde el resultado sea trivial.
* **Lógica Compleja y Máquinas de Estado:** Para interfaces dinámicas complejas (como la Máquina de Estados del HUD), se utilizarán bloques `if/else` o sentencias `switch` *antes* de la directiva `return`. El JSX resultante debe ser volcado en variables descriptivas para mantener el bloque de renderizado final lo más limpio posible.

*Ejemplo de Renderizado Condicional Limpio:*
```jsx
const MiComponente = ({ faseJuego }) => {
  let contenidoFase = null;

  if (faseJuego === 'DESPLIEGUE') {
    contenidoFase = <PanelDespliegue />;
  } else if (faseJuego === 'ATAQUE') {
    contenidoFase = <PanelAtaque />;
  } else {
    contenidoFase = <PanelBase />;
  }

  return (
    <div className="contenedor-hud">
      {/* El return permanece limpio, claro y fácil de auditar */}
      {contenidoFase}
    </div>
  );
};
```

### 3. Comentarios y Documentación (JSDoc)
Para mantener el código limpio y profesional, los comentarios deben ser estrictamente prácticos, breves y directos:

* **Concisión y Claridad:** Los comentarios (tanto inline como JSDoc) deben ir directo al grano. Explica qué hace el bloque o función en una o dos líneas como máximo, sin narrativas largas. (Ejemplo: `// Bloqueamos el paso de turno si todavía tiene tropas sin colocar`).
**Explicación de concisas** Partes de codigo con dificultad de lectura por su complejidad o longitud deben explicarse de forma clara y concisa para que cualquier programador pueda entenderlo.
* **Lenguaje Directo:** Usa un lenguaje claro y funcional, completamente exento de florituras. Evita alargarse sobre el código; sé descriptivo e imperativo o indicativo (ej. `// Leer el jugador en turno actual real para sacar su color`).
* **Cero Decoraciones:** Nada de guiones, cuadros de asteriscos ni adornos visuales (prohibido `// --- Fase 1: ---` o `// *** INICIO ***`). Los comentarios son texto plano.
* **Naturalidad:** Comentarios sin etiquetas como "POR QUÉ" o "MOTIVO".
* **Documentación Oficial (JSDoc):** Es obligatorio el formato **JSDoc** (`/** ... */`) en las cabeceras de:
  * Las funciones principales de la lógica pesada.
  * Todas las acciones de manipulación de estado (`actions`) dentro del Store (`zustand`).
* El bloque JSDoc debe ser extremadamente breve. Incluirá: una descripción condensada en 1 o 2 líneas, los parámetros recibidos (`@param`) y la respuesta devuelta (`@returns`). No se exigen largas explicaciones tácticas redundantes.
