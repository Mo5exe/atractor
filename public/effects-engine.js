// Motor de Efectos Visuales
class EffectsEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width = window.innerWidth;
    this.height = canvas.height = window.innerHeight;
    this.particles = [];
    this.attractorPos = { x: this.width / 2, y: this.height / 2 };
    this.attractorStrength = 0.8;
    this.layers = [];
    this.time = 0;

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setLayers(layers) {
    this.layers = layers;
    this.reinitialize();
  }

  setAttractorPos(pos) {
    this.attractorPos = pos;
  }

  setAttractorStrength(strength) {
    this.attractorStrength = strength;
  }

  reinitialize() {
    this.particles = [];
    this.layers.forEach((layer, idx) => {
      if (!layer.enabled) return;

      switch (layer.type) {
        case 'particles':
          this.createParticleLayer(layer, idx);
          break;
        case 'fractal':
          this.createFractalLayer(layer, idx);
          break;
        case 'flowfield':
          this.createFlowFieldLayer(layer, idx);
          break;
        case 'fire':
          this.createFireLayer(layer, idx);
          break;
        case 'water':
          this.createWaterLayer(layer, idx);
          break;
        case 'trending':
          this.createTrendingLayer(layer, idx);
          break;
      }
    });
  }

  createParticleLayer(layer, layerIdx) {
    const count = layer.params.quantity || 100;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        layerIdx,
        type: 'particle',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * (layer.params.speed || 2),
        vy: (Math.random() - 0.5) * (layer.params.speed || 2),
        size: layer.params.size || 3,
        color: layer.params.color || '#00d9ff',
        gravity: layer.params.gravity || 0.1,
        life: Math.random() * 1,
        maxLife: 1
      });
    }
  }

  createFractalLayer(layer, layerIdx) {
    this.particles.push({
      layerIdx,
      type: 'fractal',
      x: this.width / 2,
      y: this.height,
      depth: layer.params.depth || 8,
      angle: layer.params.angle || 25,
      length: layer.params.length || 50,
      swing: layer.params.swing || 0.2,
      time: 0
    });
  }

  createFlowFieldLayer(layer, layerIdx) {
    const count = layer.params.particleCount || 200;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        layerIdx,
        type: 'flowfield',
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        scale: layer.params.scale || 50,
        speed: layer.params.speed || 1,
        size: 2,
        color: '#ff006e'
      });
    }
  }

  createFireLayer(layer, layerIdx) {
    const width = layer.params.width || 100;
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        layerIdx,
        type: 'fire',
        x: this.width / 2 + (Math.random() - 0.5) * width,
        y: this.height,
        vy: -(Math.random() * (layer.params.speed || 1.5) + 0.5),
        size: Math.random() * 15 + 5,
        intensity: layer.params.intensity || 0.8,
        life: Math.random() * 0.5
      });
    }
  }

  createWaterLayer(layer, layerIdx) {
    this.particles.push({
      layerIdx,
      type: 'water',
      wavelength: layer.params.wavelength || 80,
      amplitude: layer.params.amplitude || 20,
      speed: layer.params.speed || 0.5,
      offset: 0
    });
  }

  createTrendingLayer(layer, layerIdx) {
    this.particles.push({
      layerIdx,
      type: 'trending',
      availableWords: [],
      baseSize: layer.params.baseSize || 24,
      maxSize: layer.params.maxSize || 80,
      color: layer.params.color || '#ff006e',
      fontFamily: layer.params.fontFamily || 'Arial, sans-serif',
      spawnRate: layer.params.spawnRate || 0.3, // probabilidad de generar palabra por frame
      lastHandDetected: false,
      wordIndex: 0
    });
  }

  setTrendingWords(words) {
    this.particles.forEach(p => {
      if (p.type === 'trending') {
        p.availableWords = words || [];
        p.wordIndex = 0;
      }
    });
  }

  spawnTrendingWord(trendingLayer) {
    if (trendingLayer.availableWords.length === 0) return;

    const word = trendingLayer.availableWords[trendingLayer.wordIndex % trendingLayer.availableWords.length];
    trendingLayer.wordIndex++;

    // Generar palabra en posición aleatoria en los bordes
    let x, y;
    const edge = Math.random();
    if (edge < 0.25) {
      // top
      x = Math.random() * this.width;
      y = -20;
    } else if (edge < 0.5) {
      // bottom
      x = Math.random() * this.width;
      y = this.height + 20;
    } else if (edge < 0.75) {
      // left
      x = -50;
      y = Math.random() * this.height;
    } else {
      // right
      x = this.width + 50;
      y = Math.random() * this.height;
    }

    this.particles.push({
      layerIdx: trendingLayer.layerIdx,
      type: 'trending-word',
      text: word.word,
      popularity: word.popularity || 0.5,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      baseSize: trendingLayer.baseSize * (0.5 + word.popularity * 0.5),
      life: 1,
      maxLife: 1,
      parentLayer: trendingLayer
    });
  }

  // Ruido Perlin simple para Flow Field
  perlin(x, y) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    const n00 = Math.sin((xi + yi * 73) * 0.987 * 0.001) * 2 - 1;
    const n10 = Math.sin((xi + 1 + yi * 73) * 0.987 * 0.001) * 2 - 1;
    const n01 = Math.sin((xi + (yi + 1) * 73) * 0.987 * 0.001) * 2 - 1;
    const n11 = Math.sin((xi + 1 + (yi + 1) * 73) * 0.987 * 0.001) * 2 - 1;

    const nx0 = n00 * (1 - u) + n10 * u;
    const nx1 = n01 * (1 - u) + n11 * u;
    return nx0 * (1 - v) + nx1 * v;
  }

  update() {
    this.time++;

    // Aplicar atracción a todas las partículas
    this.particles.forEach(p => {
      if (p.type === 'particle' || p.type === 'fire' || p.type === 'flowfield') {
        const dx = this.attractorPos.x - p.x;
        const dy = this.attractorPos.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const force = (this.attractorStrength * 0.05) / (distance * 0.01 + 1);
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
        }
      }
    });

    // Actualizar partículas específicas
    this.particles.forEach((p, idx) => {
      if (p.type === 'particle') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 0.005;

        if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.life < 0) {
          this.particles.splice(idx, 1);
        }
      } else if (p.type === 'fractal') {
        p.time += 0.01;
      } else if (p.type === 'flowfield') {
        const angle = this.perlin(p.x / p.scale, p.y / p.scale) * Math.PI * 2;
        p.vx = Math.cos(angle) * p.speed;
        p.vy = Math.sin(angle) * p.speed;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
          p.x = Math.random() * this.width;
          p.y = Math.random() * this.height;
        }
      } else if (p.type === 'fire') {
        p.y += p.vy;
        p.life -= 0.01;

        if (p.life < 0) {
          this.particles.splice(idx, 1);
        }
      } else if (p.type === 'water') {
        p.offset += p.speed * 0.05;
      } else if (p.type === 'trending') {
        // Procesar capas de trending para generar palabras
        if (this.attractorPos && Math.random() < p.spawnRate) {
          this.spawnTrendingWord(p);
        }
      } else if (p.type === 'trending-word') {
        // Las palabras convergen hacia el atractor
        const dx = this.attractorPos.x - p.x;
        const dy = this.attractorPos.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 1) {
          const force = (this.attractorStrength * 0.08) / (distance * 0.01 + 1);
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
        }

        // Aplicar fricción
        p.vx *= 0.95;
        p.vy *= 0.95;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.008;

        // Remover si está fuera o sin vida
        if (p.life < 0 || p.x < -100 || p.x > this.width + 100 || p.y < -100 || p.y > this.height + 100) {
          this.particles.splice(idx, 1);
        }
      }
    });
  }

  draw() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.particles.forEach(p => {
      if (p.type === 'particle') {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.life;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'fractal') {
        this.drawFractal(p);
      } else if (p.type === 'flowfield') {
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'fire') {
        const hue = 0 + (1 - p.life) * 60;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.globalAlpha = p.life * p.intensity;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'water') {
        this.drawWater(p);
      } else if (p.type === 'trending-word') {
        this.drawTrendingWord(p);
      }
    });

    this.ctx.globalAlpha = 1;
  }

  drawFractal(p) {
    const swing = Math.sin(p.time * 0.05) * p.swing;
    this.ctx.strokeStyle = '#00d9ff';
    this.ctx.lineWidth = 1;

    const drawBranch = (x, y, angle, length, depth) => {
      if (depth === 0) return;

      const x2 = x + Math.cos(angle) * length;
      const y2 = y + Math.sin(angle) * length;

      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();

      drawBranch(x2, y2, angle - p.angle * 0.01745 + swing, length * 0.7, depth - 1);
      drawBranch(x2, y2, angle + p.angle * 0.01745 - swing, length * 0.7, depth - 1);
    };

    drawBranch(p.x, p.y, -Math.PI / 2, p.length, p.depth);
  }

  drawWater(p) {
    const centerY = this.height / 2;
    this.ctx.strokeStyle = '#00d9ff';
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.4;

    this.ctx.beginPath();
    for (let x = 0; x < this.width; x += 5) {
      const y = centerY + Math.sin((x + p.offset) / p.wavelength) * p.amplitude;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }

  drawTrendingWord(p) {
    const dx = this.attractorPos.x - p.x;
    const dy = this.attractorPos.y - p.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Tamaño aumenta cuando la mano se acerca
    const proximityFactor = Math.max(0.5, 1 - (distance / 500));
    const fontSize = p.baseSize * (1 + proximityFactor * 2);

    this.ctx.font = `bold ${Math.round(fontSize)}px ${p.parentLayer.fontFamily}`;
    this.ctx.fillStyle = p.parentLayer.color;
    this.ctx.globalAlpha = p.life * 0.8;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Aplicar sombra para mejor legibilidad
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    this.ctx.fillText(p.text, p.x, p.y);

    // Limpiar sombra
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  render() {
    this.update();
    this.draw();
  }
}
