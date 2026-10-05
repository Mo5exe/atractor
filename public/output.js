// Output - Página de Salida Visual
const socket = io();
const canvas = document.getElementById('canvas');
const handIndicator = document.getElementById('handIndicator');

const engine = new EffectsEngine(canvas);

let appState = {
  layers: [],
  handPosition: { x: 0, y: 0, detected: false },
  attractorStrength: 0.8
};

// === INICIALIZACIÓN ===
socket.on('init', (state) => {
  appState = { ...appState, ...state };
  engine.setLayers(appState.layers);
  engine.setAttractorStrength(appState.attractorStrength);
});

// === ESCUCHAR CAMBIOS ===
socket.on('updateLayers', (layers) => {
  appState.layers = layers;
  engine.setLayers(layers);
});

socket.on('handPosition', (position) => {
  appState.handPosition = position;

  if (position.detected) {
    // Escalar posición de cámara a canvas (la cámara es ~320x240, canvas es fullscreen)
    const scaleX = canvas.width / 320;
    const scaleY = canvas.height / 240;

    const x = Math.max(0, Math.min(position.x * scaleX, canvas.width));
    const y = Math.max(0, Math.min(position.y * scaleY, canvas.height));

    engine.setAttractorPos({ x, y });

    // Mostrar indicador
    handIndicator.classList.add('active');
    handIndicator.style.left = (x - 15) + 'px';
    handIndicator.style.top = (y - 15) + 'px';
  } else {
    handIndicator.classList.remove('active');
  }
});

socket.on('attractorStrength', (strength) => {
  appState.attractorStrength = strength;
  engine.setAttractorStrength(strength);
});

socket.on('presetLoaded', (data) => {
  appState.layers = data.layers;
  appState.attractorStrength = data.attractorStrength;
  engine.setLayers(appState.layers);
  engine.setAttractorStrength(appState.attractorStrength);
});

// === LOOP DE ANIMACIÓN ===
function animate() {
  engine.render();
  requestAnimationFrame(animate);
}

animate();
