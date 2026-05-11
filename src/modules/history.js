import { supabase } from './supabase.js';
import { ATIVOS, quantities, prices } from './state.js';
import { getValorAtivo, getTotalPortfolio, fmtBRL } from './logic.js';

const STORAGE_KEY = 'carteira_history';

export function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Erro ao carregar histórico:', e);
    return [];
  }
}

export function saveHistoryLocal(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export async function saveSnapshot(aporteMes = 0) {
  const total = getTotalPortfolio(ATIVOS);
  
  if (total <= 0) {
    alert('Adicione pelo menos um ativo com quantidade para salvar um snapshot.');
    return null;
  }
  
  const divTotal = ATIVOS.filter(a => a.cat === 'div').reduce((s, a) => s + getValorAtivo(a), 0);
  const cresTotal = ATIVOS.filter(a => a.cat === 'cres').reduce((s, a) => s + getValorAtivo(a), 0);
  
  const snapshot = {
    id: crypto.randomUUID(),
    recorded_at: new Date().toISOString().split('T')[0],
    total_value: total,
    div_value: divTotal,
    cres_value: cresTotal,
    div_pct: total > 0 ? (divTotal / total * 100) : 0,
    cres_pct: total > 0 ? (cresTotal / total * 100) : 0,
    aporte_mes: aporteMes,
    note: '',
    ativos: ATIVOS.map(a => ({
      ticker: a.ticker,
      setor: a.setor,
      cat: a.cat,
      peso: a.peso,
      quantity: quantities[a.ticker] || 0,
      value: getValorAtivo(a),
      price: prices[a.ticker] || 0
    }))
  };

  const history = loadHistory();
  const existingIndex = history.findIndex(h => h.recorded_at === snapshot.recorded_at);
  
  if (existingIndex >= 0) {
    history[existingIndex] = snapshot;
  } else {
    history.push(snapshot);
  }
  
  saveHistoryLocal(history);
  await saveToSupabase(snapshot);
  
  return snapshot;
}

async function saveToSupabase(snapshot) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase
    .from('portfolio_history')
    .upsert({
      user_id: session.user.id,
      recorded_at: snapshot.recorded_at,
      total_value: snapshot.total_value,
      div_value: snapshot.div_value,
      cres_value: snapshot.cres_value,
      div_pct: snapshot.div_pct,
      cres_pct: snapshot.cres_pct,
      aporte_mes: snapshot.aporte_mes,
      data: snapshot.ativos
    }, { onConflict: 'user_id,recorded_at' });

  if (error && !error.message?.includes('relation') && !error.message?.includes('policy')) {
    console.error('Erro ao salvar histórico no Supabase:', error);
  }
}

export async function loadHistoryFromSupabase() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('portfolio_history')
    .select('*')
    .eq('user_id', session.user.id)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar histórico do Supabase:', error);
    return null;
  }

  return data?.map(d => ({
    id: d.id,
    recorded_at: d.recorded_at,
    total_value: d.total_value,
    div_value: d.div_value,
    cres_value: d.cres_value,
    div_pct: d.div_pct,
    cres_pct: d.cres_pct,
    aporte_mes: d.aporte_mes,
    ativos: d.data
  })) || [];
}

export function getHistoryStats(history) {
  if (history.length < 2) return null;
  
  const first = history[0];
  const last = history[history.length - 1];
  
  const variation = ((last.total_value - first.total_value) / first.total_value * 100);
  const months = history.length;
  const cagr = months > 0 ? (Math.pow(last.total_value / first.total_value, 12 / months) - 1) * 100 : 0;
  
  const totalAporte = history.reduce((s, h) => s + (h.aporte_mes || 0), 0);
  const appreciation = last.total_value - first.total_value - totalAporte;
  
  return {
    variation: variation.toFixed(1),
    cagr: cagr.toFixed(1),
    totalAporte: totalAporte.toFixed(2),
    appreciation: appreciation.toFixed(2),
    months
  };
}

export function deleteSnapshot(id) {
  const history = loadHistory();
  const filtered = history.filter(h => h.id !== id);
  saveHistoryLocal(filtered);
  return filtered;
}