// Scraper de Trending Topics desde Trends24
const https = require('https');
const { JSDOM } = require('jsdom');

class TrendingScraper {
  constructor() {
    this.cache = [];
    this.lastUpdate = 0;
    this.updateInterval = 2 * 60 * 1000; // 2 minutos
  }

  /**
   * Scrapeea Trends24 para obtener trending topics
   * @param {string} country - Código de país (ej: 'ar' para Argentina, 'global')
   * @returns {Promise<Array>} Array de objetos {word, rank, count}
   */
  async getTrends(country = 'global') {
    const now = Date.now();

    // Si el cache es fresco, devolver cache
    if (this.cache.length > 0 && (now - this.lastUpdate) < this.updateInterval) {
      console.log('📦 Usando cache de trending');
      return this.cache;
    }

    console.log(`🕷️ Scrapeando trending topics (${country})...`);

    try {
      const trends = await this.scrapeFromTrends24(country);
      this.cache = trends;
      this.lastUpdate = now;
      console.log(`✓ ${trends.length} trending topics obtenidos`);
      return trends;
    } catch (error) {
      console.error('Error scrapeando:', error);
      // Si hay error, devolver cache aunque esté viejo
      if (this.cache.length > 0) {
        console.log('⚠️ Usando cache antiguo');
        return this.cache;
      }
      // Fallback: trending genérico
      return this.getFallbackTrends();
    }
  }

  async scrapeFromTrends24(country = 'global') {
    return new Promise((resolve, reject) => {
      let url = 'https://trends24.in/';

      // Agregar código de país si no es global
      if (country !== 'global') {
        url += country + '/';
      }

      const options = {
        hostname: 'trends24.in',
        path: country === 'global' ? '/' : `/${country}/`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      };

      https.get(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const trends = this.parseHTML(data);
            resolve(trends);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  parseHTML(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const trends = [];
    const elements = document.querySelectorAll('.trend-item, .list-item, [class*="trend"]');

    // Si no encuentra con selectores específicos, intenta extrae de divs
    if (elements.length === 0) {
      const links = document.querySelectorAll('a[href*="search"]');
      links.forEach((link, index) => {
        const text = link.textContent.trim();
        if (text && text.length > 2 && text.length < 100) {
          trends.push({
            word: text,
            rank: index + 1,
            count: links.length - index // Simulamos popularidad
          });
        }
      });
    } else {
      elements.forEach((el, index) => {
        const text = el.textContent.trim();
        if (text && text.length > 2) {
          trends.push({
            word: text,
            rank: index + 1,
            count: elements.length - index
          });
        }
      });
    }

    // Limpiar y retornar top 15
    return trends
      .filter(t => t.word && !t.word.includes('\n'))
      .slice(0, 15)
      .map((t, i) => ({
        ...t,
        rank: i + 1,
        popularity: (15 - i) / 15 // Normalizar 0-1
      }));
  }

  /**
   * Trending genérico de fallback (cuando scraping falla)
   */
  getFallbackTrends() {
    const fallback = [
      'IA', 'Claude', 'Anthropic', 'GPT', 'OpenAI',
      'Tecnología', 'Innovation', 'Machine Learning',
      'Digital Art', 'Transformers', 'Neural Networks'
    ];

    return fallback.map((word, index) => ({
      word,
      rank: index + 1,
      count: fallback.length - index,
      popularity: (fallback.length - index) / fallback.length
    }));
  }
}

module.exports = new TrendingScraper();
