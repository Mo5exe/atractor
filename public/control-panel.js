const socket = io();

let appState = {
  layers: [],
  presets: [],
  attractorStrength: 0.8,
  currentPresetId: null
};

// === INICIALIZACIÓN ===
socket.on('init', (state) => {
  appState = { ...appState, ...state };
  renderPresets();
  renderLayers();
});

// === ESCUCHAR CAMBIOS ===
socket.on('updateLayers', (layers) => {
  appState.layers = layers;
  renderLayers();
});

socket.on('presetsUpdated', (presets) => {
  appState.presets = presets;
  renderPresets();
});

socket.on('attractorStrength', (strength) => {
  appState.attractorStrength = strength;
  document.getElementById('attractorStrength').value = strength;
  document.getElementById('strengthValue').textContent = strength.toFixed(1);
});

// === PRESETS ===
document.getElementById('savePresetBtn').addEventListener('click', () => {
  const name = prompt('Nombre del preset:');
  if (name && name.trim()) {
    socket.emit('savePreset', {
      name: name.trim(),
      config: {
        layers: appState.layers,
        attractorStrength: appState.attractorStrength
      }
    });
  }
});

function renderPresets() {
  const container = document.getElementById('presetsList');
  container.innerHTML = '';

  appState.presets.forEach(preset => {
    const div = document.createElement('div');
    div.className = 'preset-item' + (appState.currentPresetId === preset.id ? ' active' : '');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = preset.name;
    nameSpan.style.cursor = 'pointer';
    nameSpan.style.flex = '1';
    nameSpan.addEventListener('click', () => {
      loadPreset(preset.id);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'preset-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`¿Eliminar "${preset.name}"?`)) {
        socket.emit('deletePreset', preset.id);
      }
    });

    div.appendChild(nameSpan);
    div.appendChild(deleteBtn);
    container.appendChild(div);
  });
}

function loadPreset(presetId) {
  appState.currentPresetId = presetId;
  socket.emit('loadPreset', presetId);

  socket.once('presetLoaded', (data) => {
    appState.layers = data.layers;
    appState.attractorStrength = data.attractorStrength;
    renderLayers();
    renderPresets();
  });
}

// === CAPAS ===
const EFFECT_TYPES = [
  { id: 'particles', name: 'Partículas' },
  { id: 'fractal', name: 'Árbol Fractal' },
  { id: 'flowfield', name: 'Flow Field' },
  { id: 'fire', name: 'Fuego' },
  { id: 'water', name: 'Agua' }
];

document.getElementById('addLayerBtn').addEventListener('click', () => {
  const newLayer = {
    id: Date.now().toString(),
    type: 'particles',
    name: 'Nueva Capa',
    enabled: true,
    params: getDefaultParams('particles')
  };
  appState.layers.push(newLayer);
  socket.emit('updateLayers', appState.layers);
});

function getDefaultParams(type) {
  const defaults = {
    particles: {
      quantity: 100,
      speed: 2,
      size: 3,
      color: '#00d9ff',
      gravity: 0.1
    },
    fractal: {
      depth: 8,
      angle: 25,
      length: 50,
      swing: 0.2
    },
    flowfield: {
      scale: 50,
      speed: 1,
      particleCount: 200
    },
    fire: {
      intensity: 0.8,
      speed: 1.5,
      width: 100
    },
    water: {
      wavelength: 80,
      amplitude: 20,
      speed: 0.5
    }
  };
  return defaults[type] || {};
}

function renderLayers() {
  const container = document.getElementById('layersContainer');
  container.innerHTML = '';

  appState.layers.forEach((layer, index) => {
    const div = document.createElement('div');
    div.className = 'layer-item';

    const info = document.createElement('div');
    info.style.flex = '1';
    info.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 5px;">${layer.name}</div>
      <div style="font-size: 11px; color: #aaa;">${EFFECT_TYPES.find(t => t.id === layer.type)?.name || 'Desconocido'}</div>
    `;

    const controls = document.createElement('div');
    controls.className = 'layer-controls';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'layer-btn';
    toggleBtn.textContent = layer.enabled ? '👁️ ON' : '👁️ OFF';
    toggleBtn.addEventListener('click', () => {
      layer.enabled = !layer.enabled;
      socket.emit('updateLayers', appState.layers);
    });

    const configBtn = document.createElement('button');
    configBtn.className = 'layer-btn';
    configBtn.textContent = '⚙️';
    configBtn.addEventListener('click', () => {
      openLayerConfig(layer);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'layer-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.style.background = 'rgba(255, 100, 100, 0.2)';
    deleteBtn.style.borderColor = 'rgba(255, 100, 100, 0.4)';
    deleteBtn.addEventListener('click', () => {
      appState.layers.splice(index, 1);
      socket.emit('updateLayers', appState.layers);
    });

    controls.appendChild(toggleBtn);
    controls.appendChild(configBtn);
    controls.appendChild(deleteBtn);

    div.appendChild(info);
    div.appendChild(controls);
    container.appendChild(div);
  });
}

function openLayerConfig(layer) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background: #1a1a2e;
    border: 1px solid rgba(0, 217, 255, 0.3);
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
    color: #fff;
  `;

  let html = `<h2 style="margin-bottom: 15px; color: #00d9ff;">Configurar: ${layer.name}</h2>`;
  html += `<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #aaa;">Nombre:</label>
    <input type="text" id="layerName" value="${layer.name}" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,217,255,0.2); border-radius: 4px; color: #fff;">
  </div>`;

  html += `<div style="margin-bottom: 15px;">
    <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #aaa;">Tipo de Efecto:</label>
    <select id="layerType" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,217,255,0.2); border-radius: 4px; color: #fff;">
      ${EFFECT_TYPES.map(t => `<option value="${t.id}" ${t.id === layer.type ? 'selected' : ''}>${t.name}</option>`).join('')}
    </select>
  </div>`;

  // Parámetros del efecto
  html += `<div style="margin-bottom: 15px;">
    <h4 style="margin-bottom: 10px; color: #00d9ff; font-size: 12px;">Parámetros:</h4>
  </div>`;

  Object.keys(layer.params).forEach(key => {
    const value = layer.params[key];
    const isColor = key.includes('color') && typeof value === 'string';
    const isNumber = typeof value === 'number';

    if (isColor) {
      html += `<div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 3px; font-size: 12px;">${key}:</label>
        <input type="color" id="param_${key}" value="${value}" style="width: 100%; height: 30px; cursor: pointer;">
      </div>`;
    } else if (isNumber) {
      html += `<div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 3px; font-size: 12px;">${key}:</label>
        <input type="number" id="param_${key}" value="${value}" step="0.1" style="width: 100%; padding: 6px; background: rgba(0,0,0,0.3); border: 1px solid rgba(0,217,255,0.2); border-radius: 4px; color: #fff;">
      </div>`;
    }
  });

  html += `<div style="display: flex; gap: 10px; margin-top: 20px;">
    <button id="saveCfg" style="flex: 1; padding: 10px; background: #00d9ff; color: #000; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Guardar</button>
    <button id="closeCfg" style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; cursor: pointer;">Cancelar</button>
  </div>`;

  content.innerHTML = html;

  document.getElementById('saveCfg').addEventListener('click', () => {
    layer.name = document.getElementById('layerName').value;
    const newType = document.getElementById('layerType').value;

    if (newType !== layer.type) {
      layer.type = newType;
      layer.params = getDefaultParams(newType);
    }

    Object.keys(layer.params).forEach(key => {
      const input = document.getElementById(`param_${key}`);
      if (input) {
        const isColor = layer.params[key] && typeof layer.params[key] === 'string' && layer.params[key].startsWith('#');
        layer.params[key] = isColor ? input.value : parseFloat(input.value);
      }
    });

    socket.emit('updateLayers', appState.layers);
    modal.remove();
    renderLayers();
  });

  document.getElementById('closeCfg').addEventListener('click', () => {
    modal.remove();
  });

  modal.appendChild(content);
  document.body.appendChild(modal);
}

// === CONTROL DEL ATRACTOR ===
document.getElementById('attractorStrength').addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  appState.attractorStrength = value;
  document.getElementById('strengthValue').textContent = value.toFixed(1);
  socket.emit('attractorStrength', value);
});
