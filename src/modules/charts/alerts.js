// Alertas de preço criados a partir de linhas desenhadas no gráfico.
// Disparam quando o preço cruza o nível (checado ao atualizar cotações ou carregar um gráfico).

const KEY = 'carteira_chart_alerts';
const listeners = new Set();

export function loadAlerts() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts) {
  try { localStorage.setItem(KEY, JSON.stringify(alerts)); } catch { /* ignora */ }
  listeners.forEach(fn => fn(alerts));
}

export function onAlertsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addAlert(ticker, price, currentPrice) {
  const alerts = loadAlerts();
  const alert = {
    id: crypto.randomUUID(),
    ticker,
    price,
    direction: price >= currentPrice ? 'above' : 'below',
    createdAt: new Date().toISOString(),
    triggeredAt: null
  };
  alerts.push(alert);
  saveAlerts(alerts);
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  return alert;
}

export function removeAlert(id) {
  saveAlerts(loadAlerts().filter(a => a.id !== id));
}

export function removeAlertsForTicker(ticker) {
  saveAlerts(loadAlerts().filter(a => a.ticker !== ticker));
}

/**
 * Verifica alertas ativos contra os preços informados ({ TICKER: preço }).
 * Retorna a lista de alertas disparados agora.
 */
export function checkAlerts(priceMap) {
  const alerts = loadAlerts();
  const fired = [];
  alerts.forEach(a => {
    if (a.triggeredAt) return;
    const p = priceMap[a.ticker];
    if (p == null || isNaN(p)) return;
    const hit = a.direction === 'above' ? p >= a.price : p <= a.price;
    if (hit) {
      a.triggeredAt = new Date().toISOString();
      a.triggeredPrice = p;
      fired.push(a);
    }
  });
  if (fired.length) {
    saveAlerts(alerts);
    fired.forEach(notify);
  }
  return fired;
}

function notify(a) {
  const verb = a.direction === 'above' ? 'subiu acima de' : 'caiu abaixo de';
  const msg = `${a.ticker} ${verb} R$ ${a.price.toFixed(2)} (agora R$ ${a.triggeredPrice.toFixed(2)})`;
  showToast(`🔔 ${msg}`);
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Alerta de preço', { body: msg });
    }
  } catch { /* alguns navegadores não permitem new Notification */ }
}

export function showToast(text) {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}
