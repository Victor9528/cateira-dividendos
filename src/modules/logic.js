// Business Logic Module

import { quantities, prices, targetQuantities } from './state.js';

export function getValorAtivo(a) {
  const qty = quantities[a.ticker] || 0;
  const price = prices[a.ticker] || 0;
  return qty * price;
}

export function getTotalPortfolio(assets) {
  return assets.reduce((s, a) => s + getValorAtivo(a), 0);
}

export function calcTargetQuantities(assets, aporteAmount) {
  const total = getTotalPortfolio(assets);
  const totalFuturo = total + aporteAmount;
  const results = {};

  assets.forEach(a => {
    const price = prices[a.ticker];
    if (price && price > 0) {
      const valorIdeal = (a.peso / 100) * totalFuturo;
      results[a.ticker] = Math.floor(valorIdeal / price);
    } else {
      results[a.ticker] = 0;
    }
  });

  return { results, totalFuturo };
}

export function fmtBRL(v) {
  if (isNaN(v) || v === null || v === undefined) return '—';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

export function fmtPct(v) {
  if (isNaN(v)) return '—';
  return v.toFixed(1) + '%';
}
