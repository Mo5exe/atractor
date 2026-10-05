/*
 * Scraper de trending topics de X/Twitter desde trends24.in
 *
 * getTrends(country) -> Promise<[{ word, rank, count, popularity }]>
 *   country: "" (mundial), "argentina", "spain", "mexico", ...
 *
 * - Toma sólo la tarjeta más reciente (la primera hora que muestra la página).
 * - popularity va de 0 a 1 (1 = el más popular). Si la página trae la
 *   cantidad de posts se usa eso; si no, se calcula por el puesto.
 * - Cachea 3 minutos por país. Si falla, devuelve lo último que funcionó o
 *   una lista de respaldo, así la instalación nunca se queda sin palabras.
 */
"use strict";

const CACHE_MS = 3 * 60 * 1000;
const MAX_TRENDS = 30;

const FALLBACK_WORDS = [
  "Inteligencia Artificial", "Posthumano", "Ecología", "Algoritmo", "Datos",
  "Futuro", "Clima", "Redes", "Cuerpo", "Máquina", "Memoria", "Territorio",
  "Imagen", "Pantalla", "Código", "Naturaleza", "Archivo", "Ruido"
];

const cache = new Map(); // country -> { at, trends }

function decodeEntities(str) {
  return String(str)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripTags(str) {
  return String(str).replace(/<[^>]*>/g, "");
}

function parseCount(text) {
  if (!text) return 0;
  const m = String(text).replace(/,/g, "").match(/([\d.]+)\s*([KkMm])?/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (m[2] && /k/i.test(m[2])) n *= 1000;
  if (m[2] && /m/i.test(m[2])) n *= 1000000;
  return Math.round(n);
}

/**
 * Extrae los trends del HTML de trends24. Exportada para poder probarla.
 */
function parseTrends24(html) {
  // Quedarse con la primera lista (la hora más reciente).
  let section = html;
  const firstList = html.search(/<ol[^>]*class="[^"]*trend-card__list[^"]*"/i);
  if (firstList !== -1) {
    const end = html.indexOf("</ol>", firstList);
    section = html.slice(firstList, end === -1 ? undefined : end);
  }

  const trends = [];
  const seen = new Set();
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let li;
  while ((li = liRe.exec(section)) && trends.length < MAX_TRENDS) {
    const block = li[1];
    const link = block.match(/<a[^>]*class="[^"]*trend-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                 block.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const word = decodeEntities(stripTags(link[1])).trim();
    if (!word || word.length > 60) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    let count = 0;
    const dataCount = block.match(/data-count="(\d+)"/i);
    if (dataCount) count = Number(dataCount[1]);
    else {
      const countSpan = block.match(/class="[^"]*tweet-count[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      if (countSpan) count = parseCount(stripTags(countSpan[1]));
    }
    trends.push({ word, rank: trends.length + 1, count });
  }

  return withPopularity(trends);
}

function withPopularity(trends) {
  const maxCount = Math.max(0, ...trends.map((t) => t.count || 0));
  const n = trends.length || 1;
  return trends.map((t, i) => {
    const byRank = 1 - i / n;
    const byCount = maxCount > 0 && t.count > 0 ? t.count / maxCount : byRank;
    // Mezcla: el puesto siempre pesa algo para que no queden todos iguales.
    const popularity = Math.max(0.05, Math.min(1, 0.5 * byRank + 0.5 * byCount));
    return { word: t.word, rank: i + 1, count: t.count || 0, popularity };
  });
}

function fallbackTrends() {
  return withPopularity(FALLBACK_WORDS.map((word) => ({ word, count: 0 })));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "text/html",
      "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.text();
}

/**
 * Devuelve { trends, source } donde source es "trends24", "cache" o "respaldo".
 */
async function getTrends(country = "") {
  const slug = String(country || "").replace(/[^a-z-]/gi, "").toLowerCase();
  const cached = cache.get(slug);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return { trends: cached.trends, source: "trends24", fetchedAt: cached.at };
  }

  const url = "https://trends24.in/" + (slug ? slug + "/" : "");
  try {
    const html = await fetchHtml(url);
    const trends = parseTrends24(html);
    if (trends.length === 0) throw new Error("no se encontraron trends en la página");
    cache.set(slug, { at: Date.now(), trends });
    console.log("[trends] " + trends.length + " palabras de " + url);
    return { trends, source: "trends24", fetchedAt: Date.now() };
  } catch (err) {
    console.warn("[trends] No se pudo leer " + url + ": " + err.message);
    if (cached) return { trends: cached.trends, source: "cache", fetchedAt: cached.at };
    return { trends: fallbackTrends(), source: "respaldo", fetchedAt: Date.now() };
  }
}

module.exports = { getTrends, parseTrends24, fallbackTrends };
