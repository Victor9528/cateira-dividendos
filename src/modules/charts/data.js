// Histórico de preços (OHLCV) via brapi.dev, com cache local.

import { apiToken } from '../state.js';

export const RANGES = [
  { id: '1mo', label: '1M', interval: '1d' },
  { id: '3mo', label: '3M', interval: '1d' },
  { id: '6mo', label: '6M', interval: '1d' },
  { id: '1y', label: '1A', interval: '1d' },
  { id: '2y', label: '2A', interval: '1wk' },
  { id: '5y', label: '5A', interval: '1wk' },
  { id: 'max', label: 'Máx', interval: '1mo' }
];

const CACHE_PREFIX = 'carteira_ohlc_';
const CACHE_TTL = 60 * 60 * 1000; // 1h

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // localStorage cheio ou bloqueado: segue sem cache
  }
}

function toBusinessDay(unixSec) {
  // Pregão da B3 em UTC-3: usa a data local de São Paulo para não "voltar" um dia.
  const d = new Date((unixSec - 3 * 3600) * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Busca candles de um ticker.
 * @returns {Promise<{ candles: Array, name: string }>} lança Error com mensagem amigável em caso de falha.
 */
export async function fetchHistory(ticker, rangeId) {
  const range = RANGES.find(r => r.id === rangeId) || RANGES[1];
  const key = `${CACHE_PREFIX}${ticker}_${range.id}`;
  const cached = readCache(key);
  if (cached) return cached;

  let url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?range=${range.id}&interval=${range.interval}&fundamental=false`;
  if (apiToken) url += `&token=${apiToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let resp;
  try {
    resp = await fetch(url, { signal: controller.signal });
  } catch {
    throw new Error('Não foi possível conectar à brapi.dev.');
  } finally {
    clearTimeout(timeout);
  }

  let body = null;
  try { body = await resp.json(); } catch { /* corpo vazio */ }

  if (!resp.ok) {
    const msg = body?.message || `Erro ${resp.status}`;
    if (resp.status === 401 || resp.status === 403) {
      throw new Error(`A brapi recusou o período ${range.label}: ${msg}. Talvez seu plano não inclua esse histórico — tente um período menor.`);
    }
    throw new Error(msg);
  }

  const result = body?.results?.[0];
  const raw = result?.historicalDataPrice || [];
  const byTime = new Map();
  raw.forEach(p => {
    if (p == null || p.date == null || p.close == null || p.open == null) return;
    const time = toBusinessDay(p.date);
    byTime.set(time, {
      time,
      open: p.open,
      high: p.high ?? Math.max(p.open, p.close),
      low: p.low ?? Math.min(p.open, p.close),
      close: p.close,
      volume: p.volume || 0
    });
  });
  const candles = [...byTime.values()].sort((a, b) => (a.time < b.time ? -1 : 1));

  if (candles.length === 0) {
    throw new Error(`Sem histórico disponível para ${ticker} no período ${range.label}.`);
  }

  const data = { candles, name: result?.longName || result?.shortName || ticker };
  writeCache(key, data);
  return data;
}
