// Indicadores técnicos (funções puras).
// Fórmulas equivalentes aos estudos embutidos do OpenChart (sma, ema, bollinger-bands, rsi, macd).
// Entrada: array de candles { time, open, high, low, close, volume }.
// Saída: arrays de { time, value } prontos para séries de linha.

export function sma(candles, length, src = c => c.close) {
  const out = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += src(candles[i]);
    if (i >= length) sum -= src(candles[i - length]);
    if (i >= length - 1) out.push({ time: candles[i].time, value: sum / length });
  }
  return out;
}

// EMA semeada com a SMA dos primeiros `length` valores (convenção do TradingView/Pine).
export function emaValues(values, length) {
  const out = new Array(values.length).fill(null);
  if (values.length < length) return out;
  const k = 2 / (length + 1);
  let prev = 0;
  for (let i = 0; i < length; i++) prev += values[i];
  prev /= length;
  out[length - 1] = prev;
  for (let i = length; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

export function ema(candles, length, src = c => c.close) {
  const vals = emaValues(candles.map(src), length);
  const out = [];
  vals.forEach((v, i) => { if (v !== null) out.push({ time: candles[i].time, value: v }); });
  return out;
}

export function bollinger(candles, length = 20, mult = 2) {
  const basis = [], upper = [], lower = [];
  for (let i = length - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - length + 1; j <= i; j++) sum += candles[j].close;
    const mean = sum / length;
    let variance = 0;
    for (let j = i - length + 1; j <= i; j++) variance += (candles[j].close - mean) ** 2;
    const dev = Math.sqrt(variance / length) * mult;
    const time = candles[i].time;
    basis.push({ time, value: mean });
    upper.push({ time, value: mean + dev });
    lower.push({ time, value: mean - dev });
  }
  return { basis, upper, lower };
}

// RSI com suavização de Wilder (RMA).
export function rsi(candles, length = 14) {
  const out = [];
  if (candles.length <= length) return out;
  let gain = 0, loss = 0;
  for (let i = 1; i <= length; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    if (ch > 0) gain += ch; else loss -= ch;
  }
  gain /= length;
  loss /= length;
  const val = () => (loss === 0 ? 100 : gain === 0 ? 0 : 100 - 100 / (1 + gain / loss));
  out.push({ time: candles[length].time, value: val() });
  for (let i = length + 1; i < candles.length; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    gain = (gain * (length - 1) + Math.max(ch, 0)) / length;
    loss = (loss * (length - 1) + Math.max(-ch, 0)) / length;
    out.push({ time: candles[i].time, value: val() });
  }
  return out;
}

export function macd(candles, fast = 12, slow = 26, signal = 9) {
  const closes = candles.map(c => c.close);
  const f = emaValues(closes, fast);
  const s = emaValues(closes, slow);
  const macdIdx = [];
  const macdVals = [];
  for (let i = 0; i < candles.length; i++) {
    if (f[i] !== null && s[i] !== null) {
      macdIdx.push(i);
      macdVals.push(f[i] - s[i]);
    }
  }
  const sig = emaValues(macdVals, signal);
  const line = [], sigLine = [], hist = [];
  macdIdx.forEach((ci, k) => {
    const time = candles[ci].time;
    line.push({ time, value: macdVals[k] });
    if (sig[k] !== null) {
      sigLine.push({ time, value: sig[k] });
      hist.push({ time, value: macdVals[k] - sig[k] });
    }
  });
  return { macd: line, signal: sigLine, hist };
}

// Catálogo usado pela UI (id → rótulo).
export const INDICATORS = [
  { id: 'volume', label: 'Volume' },
  { id: 'sma20', label: 'MM 20' },
  { id: 'sma50', label: 'MM 50' },
  { id: 'ema9', label: 'MME 9' },
  { id: 'ema21', label: 'MME 21' },
  { id: 'bb', label: 'Bollinger (20, 2)' },
  { id: 'rsi', label: 'IFR / RSI (14)' },
  { id: 'macd', label: 'MACD (12, 26, 9)' }
];
