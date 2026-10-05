# 🎨 ATRACTOR v2.0

Editor de efectos visuales en tiempo real con detección de mano y sistema atractor.

## Características

### ✨ Nueva v2.0
- **Detección de Mano con Webcam** — Usando MediaPipe para detectar la posición de tu mano en tiempo real
- **Efecto Atractor** — Todas las partículas y líneas se atraen hacia donde esté tu mano
- **Sistema de Presets** — Guarda y carga configuraciones completas de efectos
- **UI Mejorada** — Panel lateral con presets, panel central con controles
- **Arquitectura lista para LIDAR** — Fácil de cambiar detección de webcam a sensor LIDAR

### 🎬 Efectos Visuales
- **Partículas** — Sistema configurable con velocidad, tamaño, gravedad, color
- **Árbol Fractal** — Árbol generado recursivamente con balanceo tipo viento
- **Flow Field** — Partículas guiadas por ruido Perlin
- **Fuego** — Simulación de partículas ascendentes con gradé de color
- **Agua** — Olas animadas con múltiples capas

## Instalación y Uso

### Requisitos
- Node.js (versión 14+)
- Navegador moderno con soporte WebRTC

### Instalación

```bash
# Clonar o descargar el repo
cd atractor

# Instalar dependencias (una sola vez)
npm install

# Iniciar el servidor
npm start
```

En Windows, también podés hacer doble clic en `run.bat` (si existe).

### Acceso

Con el servidor corriendo:

- **Panel de Control**: http://localhost:3000/index.html
- **Salida Visual**: http://localhost:3000/output.html

Abrí ambas en diferentes pantallas/ventanas:
- Control en tu monitor principal
- Output en una segunda pantalla o proyector

## Flujo de Trabajo

### 1. Configurar Efectos

En el **Panel de Control**:

1. Haz clic en **"+ Agregar Capa"** para crear un nuevo efecto
2. Selecciona el tipo de efecto (Partículas, Árbol Fractal, etc.)
3. Haz clic en **⚙️** para ajustar parámetros
4. Los cambios se sincronizan en vivo en la **Salida Visual**

### 2. Controlar con la Mano

1. **Habilita la cámara** — Aparecerá un preview en el panel de control
2. **Coloca tu mano frente a la cámara** — Verás un círculo pulsante en la salida
3. **Mueve tu mano** — Las partículas se atraen hacia donde está tu mano
4. **Ajusta la Fuerza del Atractor** — Usa el slider para cambiar la intensidad

### 3. Guardar Presets

1. Crea una configuración de efectos que te guste
2. Haz clic en **"+ Guardar Preset"**
3. Dale un nombre descriptivo (ej: "Flujo Oscuro", "Fuego Caótico")
4. Los presets se guardan automáticamente en `data/presets.json`

Para cargar un preset, simplemente haz clic en su nombre en el panel lateral.

## Arquitectura

```
atractor/
├── server.js               # Servidor Express + Socket.IO
├── public/
│   ├── index.html         # Panel de Control
│   ├── output.html        # Salida Visual
│   ├── hand-detection.js  # Detección de mano (MediaPipe)
│   ├── control-panel.js   # Lógica del panel de control
│   ├── effects-engine.js  # Motor de efectos visuales
│   └── output.js          # Lógica de salida
└── data/
    └── presets.json       # Presets guardados
```

### Flujo de Datos (WebSockets)

```
Control Panel <--> Socket.IO Server <--> Output
     ↓                                        ↓
Hand Detection (Webcam)              Effects Engine
     ↓                                        ↓
Position Updates                    Visual Rendering
```

## Próximas Mejoras (Roadmap)

- [ ] Integración con sensor LIDAR
- [ ] Soporte para OSC (Open Sound Control)
- [ ] Exportar videos de salida
- [ ] Más tipos de efectos (lluvia, nubes, fractales 3D)
- [ ] Interfaz MIDI para controles externos
- [ ] Visualización de espectro de audio

## Cambiar de Webcam a LIDAR

Para migrar a un sensor LIDAR (en el futuro):

1. En `public/hand-detection.js`, reemplaza `setupFallbackHandDetection()` con tu código LIDAR
2. El resto del sistema sigue igual — solo cambia la fuente de posición
3. Socket.io seguirá enviando `handPosition` events normalmente

Ejemplo:

```javascript
// En hand-detection.js
async function initializeHandDetection() {
  // Cambiar: setupFallbackHandDetection() →
  initializeLIDARSensor();
}

function initializeLIDARSensor() {
  // Tu código de LIDAR aquí
  // Sigue emitiendo: socket.emit('handPosition', { x, y, detected })
}
```

## Notas Técnicas

### Performance

- La detección de mano corre en tiempo real (~30 FPS)
- Los efectos están optimizados para resoluciones 4K
- WebGL podría agregarse en el futuro para mejor performance

### Persistencia

- Los presets se guardan en `data/presets.json`
- Se cargan automáticamente al iniciar el servidor
- Se pueden editar manualmente o vía API en el futuro

### Detección de Mano

Por defecto usa **MediaPipe**, con fallback a detección de movimiento simple si no está disponible.

- MediaPipe: Más preciso, requiere conexión a CDN
- Fallback: Detecta el centro de masa de movimiento en cámara

## Troubleshooting

### La cámara no se abre
- Verifica permisos en tu navegador (Settings → Privacy)
- Asegúrate de que la cámara no está en uso en otra app

### Los efectos no se ven
- Verifica que las capas estén **habilitadas** (👁️ ON)
- Abre la consola del navegador (F12) y revisa errores
- Intenta refrescar la página (F5)

### Baja performance
- Reduce la cantidad de partículas en los parámetros de las capas
- Cierra otras apps pesadas
- Prueba con resolución menor

## Créditos

- **MediaPipe** para detección de mano
- **Socket.IO** para comunicación en tiempo real
- **Express.js** para el servidor

## Licencia

MIT - Libre para usar, modificar y distribuir

---

💡 **Idea**: Combina esto con TouchDesigner o LIDAR para instalaciones interactivas aún más sofisticadas.

🎨 Creado para explorar visualidades poshumanistas y post-naturales.
