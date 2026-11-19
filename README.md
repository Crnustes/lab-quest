# QUEST[LAB] — Landing de lanzamiento 2026

Landing page del lanzamiento QUEST[LAB] / PROJECT James Rodríguez.
Esta versión prioriza la **estructura y diagramación**: el producto es el protagonista
y cada dato aparece una sola vez.

> Estado: **esquema / prototipo navegable**. Hay contenidos pendientes (ver abajo).

---

## Cómo verla

No necesita instalación ni servidor. Abre `index.html` en el navegador.

```
index.html   → estructura y contenido
styles.css   → estilos (paleta y tipografía del manual)
script.js    → interacciones y animaciones (JavaScript sin librerías)
assets/      → logo, tipografías, fotos y videos optimizados para web
```

---

## Estructura de la página

| # | Sección | Qué cuenta | Contenido |
|---|---|---|---|
| 01 | **Hero** | La promesa | "Designed to adapt" + índice de los 5 productos |
| 02 | **Colección** | El producto como protagonista | Un capítulo por prenda: HELIX, AXIOM, DRIFT, NIMBUS |
| 03 | **Quanta Trail** | El calzado, en su propio capítulo | Escáner de rayos X + radiografía oficial |
| 04 | **Campaña** | El cierre de marca | James Rodríguez con efecto vidrio esmerilado |
| — | Footer | | Logo, origen y coordenadas |

**Recorrido:** promesa → producto → tecnología dentro del producto → calzado aparte → marca.

### Por qué este orden

1. **Hero.** En pocos segundos se entiende qué es la marca y qué se lanza. El índice lleva directo a cada producto.
2. **Colección.** Cada prenda tiene su capítulo con una jerarquía fija:
   1. nombre del producto (lo primero que se lee),
   2. su **tecnología** (Feel, Motion, Protection) con una frase que la explica,
   3. sus atributos concretos.

   La tecnología vive **junto a su prenda** y no en una sección aparte. Así se lee como un beneficio real del producto y no se repite información.
3. **Quanta Trail.** Es otra categoría y se cuenta distinto ("lo que no se ve"). Además, el manual prohíbe asociar el nombre o la imagen de James con calzado, por eso va separado y firmado solo con QUEST[LAB].
4. **Campaña.** Primero la razón (producto y tecnología) y al final la emoción (James / "Nothing to prove"). La campaña le da sentido a toda la colección.

---

## Productos y tecnologías

Fuente: videos de campaña y manual de marca.

| Producto | Categoría | Tecnología | Atributos |
|---|---|---|---|
| HELIX | Camiseta | FEEL (equilibrio) | Ultra fresh touch · Suavidad + frescura · Caída natural · Construcción ligera |
| AXIOM | Camiseta | MOTION (precisión) | Elasticidad + recuperación · 12% elastano · Ultra motion |
| DRIFT | Camiseta | *Por confirmar* | *Por confirmar* |
| NIMBUS | Chaqueta | PROTECTION + FEEL | Waterproof · 100% impermeable · Soft shell · Diseñada para adaptarse |
| QUANTA TRAIL | Calzado | RENDIMIENTO | Estabilidad · Tracción · Adaptación natural al pie · Frescura prolongada · Control de temperatura |

---

## Reglas del manual aplicadas

- **Paleta:** Black 40% · White 30% · Jet Black 12% · Cloud Dancer 8% · Gargoyle 8% · **Lime Green 2%**.
- **Lime Green** solo en acentos mínimos: datos clave (12%, 100%), códigos (SCAN 063%, coordenadas), puntos indicadores y la barra de progreso. Nunca en fondos, bloques, logo, eslogan ni titulares.
- **Tipografía:** JetBrains Mono (Light, Medium, SemiBold, ExtraBold), incluida en `assets/fonts`.
- **Logo:** siempre plano, sin efectos. En fondos oscuros se invierte a blanco.
- **PROVE YOURSELF** se usa siempre desde el archivo oficial, nunca como texto en vivo. Hay un espacio reservado en la sección Campaña.
- **PROJECT James Rodríguez:** solo en piezas con fotografía de James, a dos líneas (PRO en bold, JECT en regular).
- **Calzado:** sin nombre ni imagen de James. La sección Quanta Trail se firma solo con QUEST[LAB].
- **Fotografía:** tratada en blanco y negro, con blur y alto contraste.

---

## Efectos y animaciones

| Efecto | Dónde | Referente |
|---|---|---|
| Aparición suave al hacer scroll | Toda la página | — |
| Título que sube al cargar + haz de luz | Hero | Landing DeFi / Joel Volkmer |
| Navegación fija que marca la prenda en pantalla | Colección | Video Moonwalkers |
| Videos en blanco y negro que solo se reproducen en pantalla | Colección | Lovy-tech |
| Escáner de rayos X que sigue el cursor | Quanta Trail | Radiografía del cliente |
| Fondo topográfico animado (curvas de nivel) | Quanta Trail | IMG_3052 |
| Vidrio esmerilado con ventana nítida que sigue el cursor | Campaña | Tutorial "Frosted glass" |

Todas las animaciones respetan la preferencia de **movimiento reducido** del sistema.

---

## Assets

```
assets/
├── brand/      logo QUEST[LAB]
├── fonts/      JetBrains Mono
├── fotos/      fotografías de campaña (James y modelo)
├── producto/   fotos de Quanta Trail + capa de escaneo + radiografía
└── video/      clips cortos (sin audio) con su imagen de portada .jpg
```

- Los videos se cortaron de los originales (CAMISETA, CHAQUETA, TENIS) usando tramos **sin texto incrustado**, para no repetir los datos que ya muestra la página.
- `producto/quanta-03-scan.jpg` se generó a partir de `quanta-03.jpg` y está alineada pixel a pixel con ella para el efecto de escáner.
- El material fuente pesado (TIF, MOV, originales) **no está en el repositorio**; ver `.gitignore`.

---

## Pendientes

- [ ] DRIFT: imagen o video, tecnología y atributos.
- [ ] Archivo oficial del eslogan **PROVE YOURSELF** (SVG o PNG).
- [ ] Fotos DSC **sin marca de agua** del fotógrafo (las recibidas son pruebas).
- [ ] Confirmar textos de definición de cada tecnología.
- [ ] Versión vertical de la foto de campaña para móvil (opcional).

---

## Cómo editar contenido

- **Datos de una prenda:** en `index.html`, dentro de `<article class="chapter" id="...">`.
- **Reemplazar un video:** cambia `src` (mp4) y `poster` (jpg) del `<video>` del capítulo.
- **DRIFT:** reemplaza el `<div class="chapter-media slot">` por un `<video>` o `<img>` y completa la tecnología y los atributos.
- **Eslogan oficial:** reemplaza `<div class="slot slot-dark">` en la sección Campaña por `<img src="assets/brand/prove-yourself.svg" alt="PROVE YOURSELF">`.
