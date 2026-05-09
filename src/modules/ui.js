// UI Rendering Module

import { ATIVOS, prices, quantities, targetQuantities, lastPriceFetch, sortConfig, saveState } from './state.js';
import { getValorAtivo, getTotalPortfolio, fmtBRL, fmtPct } from './logic.js';

export function setStatus(type, msg) {
  const el = document.getElementById('sumStatus');
  const sub = document.getElementById('sumStatusSub');
  if (!el || !sub) return;
  
  const dots = { ok:'status-ok', err:'status-err', load:'status-load' };
  el.innerHTML = `<span class="status-dot ${dots[type]}"></span>${type === 'ok' ? 'online' : type === 'err' ? 'erro' : 'carregando'}`;
  
  if (msg.includes('401') || msg.includes('Token')) {
    sub.innerHTML = '<span style="color:var(--amber)">Token ausente ou inválido. Clique em ⚙️</span>';
  } else if (type === 'ok' && lastPriceFetch > 0) {
    const d = new Date(lastPriceFetch);
    const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    sub.textContent = `preços de hoje, ${time}`;
  } else {
    sub.textContent = msg;
  }
}

export function updateSummary() {
  const total = getTotalPortfolio(ATIVOS);
  const divTotal = ATIVOS.filter(a=>a.cat==='div').reduce((s,a)=>s+getValorAtivo(a),0);
  const cresTotal = ATIVOS.filter(a=>a.cat==='cres').reduce((s,a)=>s+getValorAtivo(a),0);
  const comPosicao = ATIVOS.filter(a=>(quantities[a.ticker]||0)>0).length;
  const somaPesos = ATIVOS.reduce((s, a) => s + a.peso, 0);

  document.getElementById('sumTotal').textContent = fmtBRL(total);
  document.getElementById('sumAtivos').textContent = comPosicao + ' ativo' + (comPosicao!==1?'s':'') + ' com posição';
  document.getElementById('currentSumText').textContent = somaPesos.toFixed(0) + '%';
  
  const warn = document.getElementById('sumWarning');
  warn.style.display = (Math.abs(somaPesos - 100) > 0.1) ? 'block' : 'none';
  
  const divCount = ATIVOS.filter(a => a.cat === 'div').length;
  const cresCount = ATIVOS.filter(a => a.cat === 'cres').length;
  document.getElementById('countDiv').textContent = `${divCount} ativos · meta 66%`;
  document.getElementById('countCres').textContent = `${cresCount} ativos · meta 34%`;

  if (total > 0) {
    const pDiv = divTotal / total * 100;
    const pCres = cresTotal / total * 100;
    document.getElementById('sumDiv').textContent = fmtPct(pDiv);
    document.getElementById('sumCres').textContent = fmtPct(pCres);
    document.getElementById('allocDivBar').style.width = pDiv + '%';
    document.getElementById('allocCresBar').style.width = pCres + '%';
    document.getElementById('allocText').textContent = fmtPct(pDiv) + ' div · ' + fmtPct(pCres) + ' cres';

    const desvios = ATIVOS.map(a => {
      const pa = getValorAtivo(a) / total * 100;
      return Math.abs(pa - a.peso);
    });
    const avgDesvio = desvios.reduce((s,v)=>s+v,0) / desvios.length;
    document.getElementById('sumDesvio').textContent = fmtPct(avgDesvio);
  } else {
    document.getElementById('sumDiv').textContent = '—';
    document.getElementById('sumCres').textContent = '—';
    document.getElementById('sumDesvio').textContent = '—';
    document.getElementById('allocDivBar').style.width = '0%';
    document.getElementById('allocCresBar').style.width = '0%';
    document.getElementById('allocText').textContent = '— / —';
  }
}

export function renderRow(a, tbody, callbacks) {
  const price = prices[a.ticker];
  const qty = quantities[a.ticker] || 0;
  const valor = qty * (price || 0);
  const total = getTotalPortfolio(ATIVOS);
  const pesoAtual = total > 0 ? (valor / total * 100) : 0;
  const diff = pesoAtual - a.peso;

  let chipClass = 'peso-zero';
  let chipText = '—';
  if (qty > 0) {
    if (Math.abs(diff) <= 0.5) { chipClass = 'peso-ok'; chipText = fmtPct(pesoAtual); }
    else if (diff < 0) { chipClass = 'peso-low'; chipText = fmtPct(pesoAtual); }
    else { chipClass = 'peso-high'; chipText = fmtPct(pesoAtual); }
  }

  const barPct = total > 0 ? Math.min(100, pesoAtual / a.peso * 100) : 0;
  const barColor = a.cat === 'div' ? 'var(--green)' : 'var(--blue)';

  const tr = document.createElement('tr');
  tr.id = 'row-' + a.ticker;
  tr.innerHTML = `
    <td class="td-ticker">${a.ticker}</td>
    <td class="td-setor">${a.setor}</td>
    <td class="td-right td-price ${price ? '' : 'loading'}" id="price-${a.ticker}">
      ${price ? fmtBRL(price).replace('R$ ','') : '<span class="spinner"></span>'}
    </td>
    <td class="td-right">
      <div class="weight-control">
        <button class="weight-btn btn-qty-minus">-</button>
        <input type="text" inputmode="numeric" pattern="[0-9]*" class="qty-input" id="qty-${a.ticker}"
          value="${qty || ''}" placeholder="0" style="width: 40px;">
        <button class="weight-btn btn-qty-plus">+</button>
      </div>
    </td>
    <td class="td-right td-target-qty" id="target-${a.ticker}">${targetQuantities[a.ticker] || '—'}</td>
    <td class="td-right td-delta" style="color: ${(targetQuantities[a.ticker] || 0) - qty > 0 ? 'var(--green)' : ((targetQuantities[a.ticker] || 0) - qty < 0 ? 'var(--red)' : 'var(--muted2)')}">
      ${(targetQuantities[a.ticker] || 0) - qty > 0 ? '+' : ''}${(targetQuantities[a.ticker] || 0) - qty || '—'}
    </td>
    <td class="td-right td-valor td-target-value" id="valor-${a.ticker}">${qty > 0 && price ? fmtBRL(valor) : '—'}</td>
    <td class="td-right">
      <div class="weight-control">
        <button class="weight-btn btn-minus">-</button>
        <input type="number" class="weight-input" value="${a.peso}">
        <button class="weight-btn btn-plus">+</button>
      </div>
    </td>
    <td class="td-right">
      <span class="peso-chip ${chipClass}">${chipText}</span>
      <div class="mini-bar-wrap"><div class="mini-bar-fill" style="width:${barPct}%;background:${barColor}"></div></div>
    </td>
    <td class="td-right">
      <button class="btn-remove" title="Excluir ${a.ticker}" aria-label="Excluir ${a.ticker}">×</button>
    </td>
  `;

  // Add Event Listeners
  tr.querySelector('.qty-input').onchange = (e) => callbacks.onQtyChange(a.ticker, e.target.value);
  tr.querySelector('.qty-input').onkeydown = (e) => {
    if (e.key === 'Enter') {
      callbacks.onQtyChange(a.ticker, e.target.value);
      e.target.blur();
    }
  };
  tr.querySelector('.btn-qty-minus').onclick = () => callbacks.onQtyAdj(a.ticker, -1);
  tr.querySelector('.btn-qty-plus').onclick = () => callbacks.onQtyAdj(a.ticker, 1);
  tr.querySelector('.weight-input').oninput = (e) => callbacks.onWeightChange(a.ticker, e.target.value);
  tr.querySelector('.btn-minus').onclick = () => callbacks.onWeightAdj(a.ticker, -1);
  tr.querySelector('.btn-plus').onclick = () => callbacks.onWeightAdj(a.ticker, 1);
  tr.querySelector('.btn-remove').onclick = () => callbacks.onRemove(a.ticker);

  tbody.appendChild(tr);
}

export function renderTables(callbacks) {
  const divBody = document.getElementById('tbodyDiv');
  const cresBody = document.getElementById('tbodyCres');
  if (!divBody || !cresBody) return;
  
  divBody.innerHTML = '';
  cresBody.innerHTML = '';

  // Sort Assets
  const sorted = [...ATIVOS].sort((a, b) => {
    let valA, valB;
    const { key, direction } = sortConfig;

    if (key === 'ticker') {
      valA = a.ticker;
      valB = b.ticker;
    } else if (key === 'setor') {
      valA = a.setor;
      valB = b.setor;
    } else if (key === 'price') {
      valA = prices[a.ticker] || 0;
      valB = prices[b.ticker] || 0;
    } else if (key === 'qty') {
      valA = quantities[a.ticker] || 0;
      valB = quantities[b.ticker] || 0;
    } else if (key === 'target') {
      valA = targetQuantities[a.ticker] || 0;
      valB = targetQuantities[b.ticker] || 0;
    } else if (key === 'valor') {
      valA = getValorAtivo(a);
      valB = getValorAtivo(b);
    } else if (key === 'peso') {
      valA = a.peso;
      valB = b.peso;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Update Header Arrows
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortConfig.key) {
      th.classList.add('sort-' + sortConfig.direction);
    }
  });

  sorted.forEach(a => {
    if (a.cat === 'div') renderRow(a, divBody, callbacks);
    else renderRow(a, cresBody, callbacks);
  });

  // Empty state messaging
  if (divBody.children.length === 0) {
    divBody.innerHTML = `<tr><td colspan="10" class="empty-state">Nenhum ativo cadastrado · <button class="btn-link" onclick="document.getElementById('btnAddDiv').click()">+ adicionar</button></td></tr>`;
  }
  if (cresBody.children.length === 0) {
    cresBody.innerHTML = `<tr><td colspan="10" class="empty-state">Nenhum ativo cadastrado · <button class="btn-link" onclick="document.getElementById('btnAddCres').click()">+ adicionar</button></td></tr>`;
  }
}
