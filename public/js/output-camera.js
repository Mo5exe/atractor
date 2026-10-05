/*
 * Opcional: detectar la mano directamente en la ventana de salida.
 * Se activa abriendo  /output.html?camara=1
 * Sirve cuando hay una sola pantalla y el panel de control queda tapado
 * (el navegador pausa la cámara en ventanas ocultas).
 */
import { HandTracker } from "./hands.js";

const params = new URLSearchParams(location.search);
if (params.get("camara") === "1" || params.get("camera") === "1") {
  const badge = document.createElement("div");
  badge.style.cssText = "position:fixed;left:12px;bottom:10px;color:#8b93a7;font:12px 'Segoe UI',sans-serif;pointer-events:none;transition:opacity 1s";
  document.body.appendChild(badge);
  let hideTimer = null;

  window.localCameraHands = { hands: [], at: 0 };
  const tracker = new HandTracker({
    getMirror: () => !window.appSettings || window.appSettings.mirror !== false,
    getPoint: () => params.get("punto") === "indice" ? "index" : "palm",
    onStatus: (text) => {
      badge.textContent = "Cámara: " + text;
      badge.style.opacity = "1";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { badge.style.opacity = "0"; }, 5000);
    },
    onHands: (hands) => {
      window.localCameraHands = { hands, at: performance.now() };
    }
  });
  tracker.start(params.get("deviceId") || undefined);
}
