// Hand Detection con MediaPipe
const socket = io();

let handDetector = null;
let camera = null;
let canvasElement = document.getElementById('webcamCanvas');
let statusElement = document.getElementById('handStatus');
let animationId = null;

const vision = window;

async function initializeHandDetection() {
  try {
    const HandLandmarker = window.Handlandmarker;

    if (!HandLandmarker) {
      statusElement.textContent = '⚠️ MediaPipe no disponible. Usando fallback.';
      return;
    }

    const handLandmarkerOptions = {
      baseOptions: {
        modelAssetPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm`
      },
      runningMode: 'VIDEO',
      numHands: 1
    };

    handDetector = await HandLandmarker.create(handLandmarkerOptions);
    statusElement.textContent = '✓ Hand detection listo';

    // Iniciar cámara
    startCamera();
  } catch (error) {
    console.error('Error inicializando MediaPipe:', error);
    statusElement.textContent = '❌ Error en detección de mano';
    // Fallback: usar fallback simple
    setupFallbackHandDetection();
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 320 }, height: { ideal: 240 } }
    });

    canvasElement.srcObject = stream;

    canvasElement.onloadedmetadata = () => {
      canvasElement.play();
      detectHands();
    };
  } catch (error) {
    console.error('Error accediendo a la cámara:', error);
    statusElement.textContent = '❌ Permiso de cámara denegado';
    setupFallbackHandDetection();
  }
}

function detectHands() {
  if (!canvasElement || !handDetector) {
    animationId = requestAnimationFrame(detectHands);
    return;
  }

  try {
    const results = handDetector.detectForVideo(canvasElement, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0];
      const palmPosition = hand[9]; // Palm center

      // Normalizar coordenadas al tamaño del canvas
      const handPos = {
        x: palmPosition.x * canvasElement.videoWidth,
        y: palmPosition.y * canvasElement.videoHeight,
        detected: true,
        confidence: palmPosition.z || 1
      };

      socket.emit('handPosition', handPos);
      statusElement.textContent = `✓ Mano detectada (${Math.round(handPos.x)}, ${Math.round(handPos.y)})`;
    } else {
      socket.emit('handPosition', { x: 0, y: 0, detected: false });
      statusElement.textContent = '👋 Mano no detectada';
    }
  } catch (error) {
    console.error('Error en detección:', error);
  }

  animationId = requestAnimationFrame(detectHands);
}

// FALLBACK: Detección simple sin MediaPipe
function setupFallbackHandDetection() {
  console.log('Usando fallback de detección de movimiento');

  const canvas = canvasElement;
  const ctx = canvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
    .then(stream => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Detectar movimiento simple (centro de masa)
        let sumX = 0, sumY = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Detectar piel (valores R altos)
          if (r > 95 && g > 40 && b > 20 && r > b && r > g) {
            const pixelIndex = i / 4;
            sumX += pixelIndex % canvas.width;
            sumY += Math.floor(pixelIndex / canvas.width);
            count++;
          }
        }

        if (count > 100) {
          const handPos = {
            x: Math.round(sumX / count),
            y: Math.round(sumY / count),
            detected: true
          };
          socket.emit('handPosition', handPos);
          statusElement.textContent = `✓ Movimiento detectado (${handPos.x}, ${handPos.y})`;
        } else {
          socket.emit('handPosition', { x: 0, y: 0, detected: false });
          statusElement.textContent = '👋 Sin detección';
        }
      }, 100);
    })
    .catch(error => {
      statusElement.textContent = '❌ No se pudo acceder a la cámara';
      console.error(error);
    });
}

// Esperar a que MediaPipe cargue
setTimeout(() => {
  initializeHandDetection();
}, 500);
