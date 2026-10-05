# Atractor — Editor de Efectos Visuales v2

Editor de efectos visuales en tiempo real para proyectar en una pared.
La cámara detecta la mano y **todos los efectos convergen hacia ella**. Cada vez
que la mano toca, **aparece una palabra** de los trending topics de X (vía trends24.in).

Basado en [AppEfectos](https://github.com/Mo5exe/AppEfectos) (v1).

## Cómo usarlo (Windows)

1. Instalá [Node.js](https://nodejs.org) (versión LTS), si no lo tenés.
2. Hacé **doble clic en `run.bat`**.
   - La primera vez instala lo necesario y baja el modelo de detección de manos.
   - Inicia `node server.js` y abre el panel en una pestaña nueva de Google Chrome.
3. En el panel apretá **"Abrir salida visual ↗"** y llevá esa ventana al proyector
   (doble clic en la salida = pantalla completa).
4. Apretá **"Activar cámara"** y permití el uso de la cámara.

Para bajar una versión nueva: doble clic en **`actualizar.bat`** (no borra tus presets).

## Qué tiene

**Efectos (capas)**: Partículas · Árbol Fractal · Flow Field (campo de vectores) ·
Fuego · Agua · **Palabras Trending**.

- Cada capa tiene sus propios sliders, punto de origen (arrastrable), rotación de 45°,
  activar/desactivar, subir/bajar y eliminar.
- Cada capa tiene **"Atracción a la mano"** (0 = la ignora, 1 = máximo).

**Atractor (mano)**
- Partículas y fuego viajan hacia la mano · las líneas del flow field se curvan hacia
  ella · las ramas del árbol se doblan hacia la mano · el agua sube hacia la mano.
- Fuerza y radio de acción globales. Hasta 2 manos.
- Punto de la mano: palma o punta del índice. Opción de espejar la cámara.

**Palabras Trending**
- Al tocar aparece una palabra en ese lugar; si la mano se queda, aparece otra cada
  N segundos. Las más populares salen más grandes y más seguido, y crecen si la mano
  está cerca.
- País: Mundial, Argentina, España, México, Chile, Colombia, EE.UU.
  Se actualiza cada 3 minutos. Sin internet usa palabras de respaldo.

**Presets**: guardá la escena completa (capas y ajustes) con un nombre, y cargala con
un clic desde la barra lateral. Se guardan en `data/presets.json`.

## Probar sin cámara

En la ventana de salida, **mantené el clic y mové el mouse**: funciona como la mano.

## Una sola pantalla

El navegador pausa la cámara si la ventana del panel queda tapada. Si usás una sola
pantalla, abrí la salida con cámara propia: `http://localhost:3000/output.html?camara=1`

## Estructura

```
server.js              servidor (Express + Socket.IO): estado, presets, trends
trending-scraper.js    lee trends24.in
run.bat                inicia todo (doble clic)
actualizar.bat         baja la última versión de GitHub
public/
  index.html           panel de control
  output.html          salida visual (sólo la imagen)
  style.css
  js/schemas.js        parámetros de cada efecto (compartido con el servidor)
  js/effects.js        los 6 efectos + atractor
  js/output.js         dibuja las capas en la salida
  js/control.js        panel de control
  js/hands.js          detección de manos (MediaPipe)
  js/control-camera.js cámara en el panel
  js/output-camera.js  cámara en la salida (?camara=1)
```

Pensado para cambiar después la cámara por un sensor LIDAR: sólo hay que mandar
`socket.emit("hands", { hands: [{ x, y }] })` con posiciones de 0 a 1.
