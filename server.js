const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));
app.use(express.json());

// Almacenar estado global de la aplicación
let appState = {
  layers: [],
  presets: [],
  handPosition: { x: 0, y: 0, detected: false },
  attractorStrength: 0.8
};

// Cargar presets guardados desde archivo (en producción usar DB)
const fs = require('fs');
const PRESETS_FILE = path.join(__dirname, 'data', 'presets.json');

function loadPresets() {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      appState.presets = JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading presets:', err);
    appState.presets = [];
  }
}

function savePresets() {
  try {
    const dir = path.dirname(PRESETS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(appState.presets, null, 2));
  } catch (err) {
    console.error('Error saving presets:', err);
  }
}

loadPresets();

// WebSocket eventos
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar estado inicial
  socket.emit('init', {
    layers: appState.layers,
    presets: appState.presets,
    handPosition: appState.handPosition,
    attractorStrength: appState.attractorStrength
  });

  // Recibir actualizaciones de capas
  socket.on('updateLayers', (layers) => {
    appState.layers = layers;
    socket.broadcast.emit('updateLayers', layers);
  });

  // Recibir posición de la mano (desde hand detection)
  socket.on('handPosition', (position) => {
    appState.handPosition = position;
    socket.broadcast.emit('handPosition', position);
  });

  // Actualizar fuerza del atractor
  socket.on('attractorStrength', (strength) => {
    appState.attractorStrength = strength;
    socket.broadcast.emit('attractorStrength', strength);
  });

  // Guardar preset
  socket.on('savePreset', ({ name, config }) => {
    const preset = {
      id: Date.now().toString(),
      name: name,
      timestamp: new Date().toISOString(),
      config: config
    };
    appState.presets.push(preset);
    savePresets();
    io.emit('presetsUpdated', appState.presets);
  });

  // Cargar preset
  socket.on('loadPreset', (presetId) => {
    const preset = appState.presets.find(p => p.id === presetId);
    if (preset) {
      appState.layers = preset.config.layers;
      appState.attractorStrength = preset.config.attractorStrength || 0.8;
      io.emit('presetLoaded', {
        layers: appState.layers,
        attractorStrength: appState.attractorStrength
      });
    }
  });

  // Eliminar preset
  socket.on('deletePreset', (presetId) => {
    appState.presets = appState.presets.filter(p => p.id !== presetId);
    savePresets();
    io.emit('presetsUpdated', appState.presets);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎨 AppEfectos v2 corriendo en http://localhost:${PORT}`);
  console.log(`   Panel de control: http://localhost:${PORT}/index.html`);
  console.log(`   Salida visual: http://localhost:${PORT}/output.html`);
});
