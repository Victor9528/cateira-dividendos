// Aba "Gráficos": workspace de gráficos inspirado no OpenChart (github.com/longsurf-ai/openchart).
// Grade 1/2/4 gráficos, candles + volume, indicadores, desenhos (linha horizontal, tendência),
// borracha e alertas de preço desenhados no gráfico.

import {
  createChart, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries,
  CrosshairMode, LineStyle
} from 'lightweight-charts';
import { ATIVOS, prices } from '../state.js';
import { RANGES, fetchHistory } from './data.js';
import { INDICATORS, sma, ema, bollinger, rsi, macd } from './indicators.js';
import { loadAlerts, addAlert, removeAlert, removeAlertsForTicker, checkAlerts, onAlertsChange, showToast } from './alerts.js';

const STATE_KEY = 'carteira_charts_ws';
const DRAW_KEY = 'carteira_chart_drawings';

const TOOLS = [
  { id: 'cursor', icon: '↖', label: 'Cursor' },
  { id: 'hline', icon: '―', label: 'Linha horizontal' },
  { id: 'trend', icon: '╱', label: 'Linha de tendência (2 cliques)' },
  { id: 'alert', icon: '🔔', label: 'Alerta de preço (clique no nível)' },
  { id: 'erase', icon: '⌫', label: 'Borracha (clique na linha)' }
];

const LAYOUTS = [
  { n: 1, icon: '▢', label: '1 gráfico' },
  { n: 2, icon: '◫', label: '2 gráficos' },
  { n: 4, icon: '⊞', label: '4 gráficos' }
];

let ws = null;          // estado persistido
let cells = [];         // estado de execução por célula
let tool = 'cursor';
let root = null;
let initialized = false;

// ---------- Persistência ----------

function defaultState() {
  const tickers = ATIVOS.map(a => a.ticker);
  const pick = i => tickers[i] || ['ITUB4', 'PETR4', 'VALE3', 'BBAS3'][i];
  return {
    layout: 1,
    range: '6mo',
    chartType: 'candles',
    indicators: ['volume', 'sma20', 'sma50'],
    tickers: [pick(0), pick(1), pick(2), pick(3)],
    active: 0
  };
}

function loadWs() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (saved && Array.isArray(saved.tickers)) return { ...defaultState(), ...saved };
  } catch { /* ignora */ }
  return defaultState();
}

function saveWs() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(ws)); } catch { /* ignora */ }
}

function loadDrawings() {
  try { return JSON.parse(localStorage.getItem(DRAW_KEY)) || {}; } catch { return {}; }
}

function drawingsFor(ticker) {
  const all = loadDrawings();
  return all[ticker] || { hlines: [], trends: [] };
}

function saveDrawingsFor(ticker, d) {
  const all = loadDrawings();
  if (!d.hlines.length && !d.trends.length) delete all[ticker];
  else all[ticker] = d;
  try { localStorage.setItem(DRAW_KEY, JSON.stringify(all)); } catch { /* ignora */ }
}

// ---------- Tema ----------

function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const v = name => css.getPropertyValue(name).trim();
  return {
    bg: v('--surface') || '#16181c',
    text: v('--muted') || '#6b7080',
    textStrong: v('--text') || '#e8eaf0',
    grid: v('--border') || '#2a2d35',
    border: v('--border2') || '#363a45',
    up: v('--green') || '#22c87a',
    down: v('--red') || '#e05252',
    blue: v('--blue') || '#4d9fff',
    amber: v('--amber') || '#f5a623'
  };
}

// ---------- UI estática ----------

function buildShell() {
  root.innerHTML = `
    <div class="charts-toolbar" role="toolbar" aria-label="Ferramentas do gráfico">
      <div class="ct-group" id="ctRanges"></div>
      <div class="ct-sep"></div>
      <div class="ct-group">
        <button class="ct-btn" data-type="candles" title="Candles">🕯 Candles</button>
        <button class="ct-btn" data-type="line" title="Linha">📈 Linha</button>
      </div>
      <div class="ct-sep"></div>
      <div class="ct-group ct-dropdown">
        <button class="ct-btn" id="ctIndBtn" aria-haspopup="true" aria-expanded="false">ƒx Indicadores</button>
        <div class="ct-menu hidden" id="ctIndMenu"></div>
      </div>
      <div class="ct-sep"></div>
      <div class="ct-group" id="ctLayouts"></div>
      <div class="ct-sep"></div>
      <div class="ct-group" id="ctTools"></div>
      <button class="ct-btn" id="ctClear" title="Apagar desenhos e alertas do ativo selecionado">🗑</button>
    </div>
    <div class="charts-body">
      <div class="charts-grid" id="chartsGrid"></div>
      <aside class="charts-side">
        <div class="side-title">ALERTAS</div>
        <div id="alertsList" class="alerts-list"></div>
        <p class="side-hint">Use 🔔 e clique no gráfico para criar um alerta. Ele dispara quando o preço cruza o nível ao atualizar cotações.</p>
      </aside>
    </div>
    <datalist id="chartTickerList"></datalist>
  `;

  root.querySelector('#ctRanges').innerHTML = RANGES
    .map(r => `<button class="ct-btn" data-range="${r.id}">${r.label}</button>`).join('');
  root.querySelector('#ctLayouts').innerHTML = LAYOUTS
    .map(l => `<button class="ct-btn" data-layout="${l.n}" title="${l.label}" aria-label="${l.label}">${l.icon}</button>`).join('');
  root.querySelector('#ctTools').innerHTML = TOOLS
    .map(t => `<button class="ct-btn" data-tool="${t.id}" title="${t.label}" aria-label="${t.label}">${t.icon}</button>`).join('');
  root.querySelector('#ctIndMenu').innerHTML = INDICATORS
    .map(i => `<label class="ct-menu-item"><input type="checkbox" value="${i.id}"> ${i.label}</label>`).join('');

  root.querySelectorAll('[data-range]').forEach(b => b.onclick = () => {
    ws.range = b.dataset.range; saveWs(); syncToolbar(); renderAll();
  });
  root.querySelectorAll('[data-type]').forEach(b => b.onclick = () => {
    ws.chartType = b.dataset.type; saveWs(); syncToolbar(); cells.forEach(drawCell);
  });
  root.querySelectorAll('[data-layout]').forEach(b => b.onclick = () => {
    ws.layout = Number(b.dataset.layout);
    if (ws.active >= ws.layout) ws.active = 0;
    saveWs(); syncToolbar(); buildGrid();
  });
  root.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => {
    tool = b.dataset.tool;
    cells.forEach(c => { c.pendingTrend = null; });
    syncToolbar();
  });

  const indBtn = root.querySelector('#ctIndBtn');
  const indMenu = root.querySelector('#ctIndMenu');
  indBtn.onclick = e => {
    e.stopPropagation();
    const open = indMenu.classList.toggle('hidden') === false;
    indBtn.setAttribute('aria-expanded', String(open));
  };
  indMenu.onclick = e => e.stopPropagation();
  document.addEventListener('click', () => {
    indMenu.classList.add('hidden');
    indBtn.setAttribute('aria-expanded', 'false');
  });
  indMenu.querySelectorAll('input').forEach(inp => inp.onchange = () => {
    ws.indicators = [...indMenu.querySelectorAll('input:checked')].map(i => i.value);
    saveWs(); cells.forEach(drawCell);
  });

  root.querySelector('#ctClear').onclick = () => {
    const c = cells[ws.active];
    if (!c) return;
    if (!confirm(`Apagar todos os desenhos e alertas de ${c.ticker}?`)) return;
    saveDrawingsFor(c.ticker, { hlines: [], trends: [] });
    removeAlertsForTicker(c.ticker);
    cells.filter(x => x.ticker === c.ticker).forEach(drawCell);
  };

  document.addEventListener('keydown', e => {
    if (root.closest('.hidden')) return;
    if (e.key === 'Escape') {
      tool = 'cursor';
      cells.forEach(c => { c.pendingTrend = null; });
      syncToolbar();
    }
  });

  onAlertsChange(() => { renderAlertsList(); cells.forEach(drawCell); });
}

function syncToolbar() {
  root.querySelectorAll('[data-range]').forEach(b => b.classList.toggle('active', b.dataset.range === ws.range));
  root.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === ws.chartType));
  root.querySelectorAll('[data-layout]').forEach(b => b.classList.toggle('active', Number(b.dataset.layout) === ws.layout));
  root.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  root.querySelectorAll('#ctIndMenu input').forEach(i => { i.checked = ws.indicators.includes(i.value); });
  root.querySelector('#chartsGrid')?.classList.toggle('drawing', tool !== 'cursor');
}

function updateTickerList() {
  const list = root.querySelector('#chartTickerList');
  if (list) list.innerHTML = ATIVOS.map(a => `<option value="${a.ticker}">${a.setor || ''}</option>`).join('');
}

// ---------- Grade de células ----------

function destroyCells() {
  cells.forEach(c => { if (c.chart) c.chart.remove(); });
  cells = [];
}

function buildGrid() {
  destroyCells();
  const grid = root.querySelector('#chartsGrid');
  grid.className = `charts-grid layout-${ws.layout}${tool !== 'cursor' ? ' drawing' : ''}`;
  grid.innerHTML = '';

  for (let i = 0; i < ws.layout; i++) {
    const el = document.createElement('div');
    el.className = 'chart-cell';
    el.innerHTML = `
      <div class="cell-head">
        <input class="cell-ticker" list="chartTickerList" maxlength="8" spellcheck="false" aria-label="Ticker do gráfico ${i + 1}">
        <span class="cell-name"></span>
        <span class="cell-legend"></span>
      </div>
      <div class="cell-chart"></div>
      <div class="cell-msg hidden"></div>
    `;
    grid.appendChild(el);

    const cell = {
      index: i,
      el,
      chartEl: el.querySelector('.cell-chart'),
      legendEl: el.querySelector('.cell-legend'),
      nameEl: el.querySelector('.cell-name'),
      msgEl: el.querySelector('.cell-msg'),
      input: el.querySelector('.cell-ticker'),
      ticker: ws.tickers[i] || 'ITUB4',
      candles: [],
      chart: null,
      main: null,
      drawSeries: [],
      pendingTrend: null,
      loadSeq: 0
    };
    cell.input.value = cell.ticker;
    cell.input.onchange = () => {
      const t = cell.input.value.trim().toUpperCase();
      if (!/^[A-Z0-9]{4,7}$/.test(t)) { cell.input.value = cell.ticker; return; }
      cell.ticker = t;
      ws.tickers[i] = t;
      saveWs();
      loadCell(cell);
    };
    cell.input.onkeydown = e => { if (e.key === 'Enter') cell.input.blur(); };
    el.addEventListener('mousedown', () => setActive(i), true);
    cells.push(cell);
  }
  setActive(Math.min(ws.active, ws.layout - 1));
  cells.forEach(loadCell);
}

function setActive(i) {
  ws.active = i;
  saveWs();
  cells.forEach(c => c.el.classList.toggle('active', c.index === i && ws.layout > 1));
}

function renderAll() {
  cells.forEach(loadCell);
}

async function loadCell(cell) {
  const seq = ++cell.loadSeq;
  showMsg(cell, 'Carregando…');
  try {
    const { candles, name } = await fetchHistory(cell.ticker, ws.range);
    if (seq !== cell.loadSeq) return;
    cell.candles = candles;
    cell.nameEl.textContent = name !== cell.ticker ? name : '';
    hideMsg(cell);
    drawCell(cell);
    const last = candles[candles.length - 1];
    if (last) checkAlerts({ [cell.ticker]: prices[cell.ticker] ?? last.close });
  } catch (e) {
    if (seq !== cell.loadSeq) return;
    cell.candles = [];
    cell.nameEl.textContent = '';
    if (cell.chart) { cell.chart.remove(); cell.chart = null; }
    cell.legendEl.textContent = '';
    showMsg(cell, e.message || 'Erro ao carregar gráfico.');
  }
}

function showMsg(cell, text) {
  cell.msgEl.textContent = text;
  cell.msgEl.classList.remove('hidden');
}

function hideMsg(cell) {
  cell.msgEl.classList.add('hidden');
}

// ---------- Desenho do gráfico ----------

const fmt = v => (v == null || isNaN(v) ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const fmtVol = v => {
  if (!v) return '0';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return String(v);
};

function drawCell(cell) {
  if (!cell.candles.length) return;
  const viewKey = `${cell.ticker}|${ws.range}|${cell.candles.length}`;
  const prevView = cell.chart && cell.viewKey === viewKey
    ? cell.chart.timeScale().getVisibleLogicalRange()
    : null;
  if (cell.chart) cell.chart.remove();
  cell.viewKey = viewKey;
  cell.drawSeries = [];
  cell.pendingTrend = null;

  const col = themeColors();
  const chart = createChart(cell.chartEl, {
    autoSize: true,
    layout: {
      background: { color: col.bg },
      textColor: col.text,
      fontFamily: "'DM Mono', monospace",
      fontSize: 11,
      panes: { separatorColor: col.grid, separatorHoverColor: col.border }
    },
    grid: {
      vertLines: { color: col.grid, style: LineStyle.Dotted },
      horzLines: { color: col.grid, style: LineStyle.Dotted }
    },
    crosshair: { mode: CrosshairMode.Normal },
    rightPriceScale: { borderColor: col.grid },
    timeScale: { borderColor: col.grid, rightOffset: 4 },
    localization: {
      locale: 'pt-BR',
      priceFormatter: p => fmt(p)
    }
  });
  cell.chart = chart;
  const c = cell.candles;
  const on = id => ws.indicators.includes(id);

  // Série principal
  let main;
  if (ws.chartType === 'line') {
    const up = c[c.length - 1].close >= c[0].close;
    const color = up ? col.up : col.down;
    main = chart.addSeries(AreaSeries, {
      lineColor: color, lineWidth: 2,
      topColor: color + '40', bottomColor: color + '00'
    });
    main.setData(c.map(x => ({ time: x.time, value: x.close })));
  } else {
    main = chart.addSeries(CandlestickSeries, {
      upColor: col.up, downColor: col.down,
      borderUpColor: col.up, borderDownColor: col.down,
      wickUpColor: col.up, wickDownColor: col.down
    });
    main.setData(c);
  }
  cell.main = main;

  // Overlays
  const line = (data, color, width = 1.5, style = LineStyle.Solid) => {
    const s = chart.addSeries(LineSeries, {
      color, lineWidth: width, lineStyle: style,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false
    });
    s.setData(data);
    return s;
  };
  if (on('sma20')) line(sma(c, 20), '#f5a623');
  if (on('sma50')) line(sma(c, 50), '#a855f7');
  if (on('ema9')) line(ema(c, 9), '#14b8a6');
  if (on('ema21')) line(ema(c, 21), '#ec4899');
  if (on('bb')) {
    const bb = bollinger(c, 20, 2);
    line(bb.upper, col.blue, 1);
    line(bb.basis, col.blue, 1, LineStyle.Dashed);
    line(bb.lower, col.blue, 1);
  }

  if (on('volume')) {
    const vol = chart.addSeries(HistogramSeries, {
      priceScaleId: 'vol', priceFormat: { type: 'volume' },
      priceLineVisible: false, lastValueVisible: false
    });
    vol.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    vol.setData(c.map(x => ({
      time: x.time, value: x.volume,
      color: (x.close >= x.open ? col.up : col.down) + '55'
    })));
  }

  // Painéis inferiores
  let pane = 0;
  if (on('rsi')) {
    pane++;
    const r = chart.addSeries(LineSeries, {
      color: '#a855f7', lineWidth: 1.5, priceLineVisible: false,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } })
    }, pane);
    r.setData(rsi(c, 14));
    r.createPriceLine({ price: 70, color: col.text, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false });
    r.createPriceLine({ price: 30, color: col.text, lineStyle: LineStyle.Dashed, lineWidth: 1, axisLabelVisible: false });
  }
  if (on('macd')) {
    pane++;
    const m = macd(c);
    const h = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
    h.setData(m.hist.map(x => ({ ...x, color: (x.value >= 0 ? col.up : col.down) + '99' })));
    const ml = chart.addSeries(LineSeries, { color: col.blue, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false }, pane);
    ml.setData(m.macd);
    const sl = chart.addSeries(LineSeries, { color: col.amber, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false }, pane);
    sl.setData(m.signal);
  }
  const panes = chart.panes();
  if (panes.length > 1) {
    panes[0].setStretchFactor(3);
    for (let i = 1; i < panes.length; i++) panes[i].setStretchFactor(1);
  }

  drawAnnotations(cell);
  if (prevView) chart.timeScale().setVisibleLogicalRange(prevView);
  else chart.timeScale().fitContent();

  // Legenda OHLC (último candle por padrão, candle sob o cursor ao mover)
  const byTime = new Map(c.map(x => [x.time, x]));
  const showLegend = bar => {
    if (!bar) { cell.legendEl.innerHTML = ''; return; }
    const i = c.indexOf(bar);
    const prev = i > 0 ? c[i - 1].close : bar.open;
    const ch = prev ? (bar.close - prev) / prev * 100 : 0;
    const cls = ch >= 0 ? 'pos' : 'neg';
    cell.legendEl.innerHTML =
      `<span>A <b>${fmt(bar.open)}</b></span><span>M <b>${fmt(bar.high)}</b></span>` +
      `<span>m <b>${fmt(bar.low)}</b></span><span>F <b>${fmt(bar.close)}</b></span>` +
      `<span class="${cls}">${ch >= 0 ? '+' : ''}${ch.toFixed(2)}%</span>` +
      `<span>Vol <b>${fmtVol(bar.volume)}</b></span>`;
  };
  showLegend(c[c.length - 1]);
  chart.subscribeCrosshairMove(param => {
    showLegend(param.time ? byTime.get(param.time) : c[c.length - 1]);
  });

  bindPointer(cell);
}

// Captura cliques direto no DOM: o subscribeClick da lib descarta cliques rápidos
// em sequência (tratados como duplo clique), o que quebrava a linha de tendência.
function bindPointer(cell) {
  if (cell.pointerBound) return;
  cell.pointerBound = true;
  let down = null;
  cell.chartEl.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  cell.chartEl.addEventListener('pointerup', e => {
    if (!down || !cell.chart || !cell.main) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4;
    down = null;
    if (moved) return; // foi arraste (pan), não clique
    const rect = cell.chartEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Só o painel principal (preço), sem a escala de preço à direita
    if (x > cell.chart.timeScale().width() || y > cell.chart.paneSize(0).height) return;
    const time = cell.chart.timeScale().coordinateToTime(x);
    handleClick(cell, { point: { x, y }, time });
  });
}

function drawAnnotations(cell) {
  const col = themeColors();
  const d = drawingsFor(cell.ticker);

  d.hlines.forEach(h => {
    cell.main.createPriceLine({
      price: h.price, color: col.blue, lineWidth: 1, lineStyle: LineStyle.Solid,
      axisLabelVisible: true, title: ''
    });
  });

  loadAlerts().filter(a => a.ticker === cell.ticker && !a.triggeredAt).forEach(a => {
    cell.main.createPriceLine({
      price: a.price, color: col.amber, lineWidth: 1, lineStyle: LineStyle.Dashed,
      axisLabelVisible: true, title: '🔔'
    });
  });

  d.trends.forEach(t => {
    const pts = [t.p1, t.p2].sort((a, b) => (a.time < b.time ? -1 : 1));
    const s = cell.chart.addSeries(LineSeries, {
      color: col.blue, lineWidth: 2,
      priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false,
      autoscaleInfoProvider: () => null
    });
    s.setData(pts.map(p => ({ time: p.time, value: p.price })));
    cell.drawSeries.push({ id: t.id, series: s });
  });
}

// ---------- Interação de desenho ----------

function handleClick(cell, param) {
  if (tool === 'cursor' || !param.point || !cell.main) return;
  const price = cell.main.coordinateToPrice(param.point.y);
  if (price == null) return;
  const d = drawingsFor(cell.ticker);
  const round = p => Math.round(p * 100) / 100;

  if (tool === 'hline') {
    d.hlines.push({ id: crypto.randomUUID(), price: round(price) });
    saveDrawingsFor(cell.ticker, d);
    redrawTicker(cell.ticker);
  } else if (tool === 'alert') {
    const last = cell.candles[cell.candles.length - 1];
    const current = prices[cell.ticker] ?? last?.close ?? price;
    const a = addAlert(cell.ticker, round(price), current);
    showToast(`Alerta criado: ${cell.ticker} ${a.direction === 'above' ? '≥' : '≤'} R$ ${fmt(a.price)}`);
  } else if (tool === 'trend') {
    if (!param.time) return;
    if (!cell.pendingTrend) {
      cell.pendingTrend = { time: param.time, price: round(price) };
      showToast('Clique no segundo ponto da linha de tendência');
      return;
    }
    if (cell.pendingTrend.time === param.time) return;
    d.trends.push({ id: crypto.randomUUID(), p1: cell.pendingTrend, p2: { time: param.time, price: round(price) } });
    cell.pendingTrend = null;
    saveDrawingsFor(cell.ticker, d);
    redrawTicker(cell.ticker);
  } else if (tool === 'erase') {
    eraseAt(cell, param.point);
  }
}

function eraseAt(cell, point) {
  const TOL = 8;
  const d = drawingsFor(cell.ticker);
  const ts = cell.chart.timeScale();

  const hIdx = d.hlines.findIndex(h => {
    const y = cell.main.priceToCoordinate(h.price);
    return y != null && Math.abs(y - point.y) <= TOL;
  });
  if (hIdx >= 0) {
    d.hlines.splice(hIdx, 1);
    saveDrawingsFor(cell.ticker, d);
    redrawTicker(cell.ticker);
    return;
  }

  const alert = loadAlerts().find(a => {
    if (a.ticker !== cell.ticker || a.triggeredAt) return false;
    const y = cell.main.priceToCoordinate(a.price);
    return y != null && Math.abs(y - point.y) <= TOL;
  });
  if (alert) { removeAlert(alert.id); return; }

  const tIdx = d.trends.findIndex(t => {
    const x1 = ts.timeToCoordinate(t.p1.time), x2 = ts.timeToCoordinate(t.p2.time);
    const y1 = cell.main.priceToCoordinate(t.p1.price), y2 = cell.main.priceToCoordinate(t.p2.price);
    if ([x1, x2, y1, y2].some(v => v == null)) return false;
    return distToSegment(point.x, point.y, x1, y1, x2, y2) <= TOL;
  });
  if (tIdx >= 0) {
    d.trends.splice(tIdx, 1);
    saveDrawingsFor(cell.ticker, d);
    redrawTicker(cell.ticker);
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function redrawTicker(ticker) {
  cells.filter(c => c.ticker === ticker).forEach(drawCell);
}

// ---------- Painel de alertas ----------

function renderAlertsList() {
  const el = root?.querySelector('#alertsList');
  if (!el) return;
  const alerts = loadAlerts().sort((a, b) => (a.triggeredAt ? 1 : 0) - (b.triggeredAt ? 1 : 0));
  if (!alerts.length) {
    el.innerHTML = '<div class="alerts-empty">Nenhum alerta.</div>';
    return;
  }
  el.innerHTML = alerts.map(a => `
    <div class="alert-row ${a.triggeredAt ? 'fired' : ''}">
      <button class="alert-ticker" data-open="${a.ticker}" title="Abrir ${a.ticker} no gráfico ativo">${a.ticker}</button>
      <span class="alert-cond">${a.direction === 'above' ? '≥' : '≤'} ${fmt(a.price)}</span>
      <span class="alert-status">${a.triggeredAt ? 'disparado' : 'ativo'}</span>
      <button class="btn-remove" data-del="${a.id}" aria-label="Remover alerta">×</button>
    </div>`).join('');
  el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => removeAlert(b.dataset.del));
  el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openTicker(b.dataset.open));
}

// ---------- API pública ----------

/** Abre o ticker no gráfico ativo. */
export function openTicker(ticker) {
  if (!initialized) return;
  const cell = cells[ws.active] || cells[0];
  if (!cell) return;
  cell.ticker = ticker;
  cell.input.value = ticker;
  ws.tickers[cell.index] = ticker;
  saveWs();
  loadCell(cell);
}

/** Chamada ao abrir a aba Gráficos. */
export function showCharts() {
  root = document.getElementById('chartsSection');
  if (!root) return;
  if (!initialized) {
    ws = loadWs();
    buildShell();
    initialized = true;
    syncToolbar();
    updateTickerList();
    renderAlertsList();
    buildGrid();

    // Reaplica cores quando o tema muda
    new MutationObserver(() => cells.forEach(drawCell))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return;
  }
  updateTickerList();
  renderAlertsList();
}

/** Chamada após atualizar cotações: verifica alertas contra os preços atuais. */
export function checkPriceAlerts() {
  return checkAlerts(prices);
}
