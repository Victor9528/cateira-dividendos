// State Management Module
import { supabase } from './supabase.js';

export const DEFAULT_ATIVOS = [
  // Dividendos
  { ticker:'ITUB4', setor:'Bancos', cat:'div', peso:6 },
  { ticker:'BBSE3', setor:'Seguros', cat:'div', peso:6 },
  { ticker:'TAEE11', setor:'Energia elétrica', cat:'div', peso:6 },
  { ticker:'ITSA4', setor:'Holding financeira', cat:'div', peso:5 },
  { ticker:'EGIE3', setor:'Energia elétrica', cat:'div', peso:5 },
  { ticker:'VIVT3', setor:'Telecom', cat:'div', peso:5 },
  { ticker:'BTLG11', setor:'FII logística', cat:'div', peso:5 },
  { ticker:'PETR4', setor:'Petróleo', cat:'div', peso:4 },
  { ticker:'VALE3', setor:'Mineração', cat:'div', peso:4 },
  { ticker:'ABEV3', setor:'Bebidas defensivo', cat:'div', peso:4 },
  { ticker:'XPML11', setor:'FII shoppings', cat:'div', peso:3 },
  { ticker:'KNRI11', setor:'FII híbrido/tijolo', cat:'div', peso:3 },
  { ticker:'HGRU11', setor:'FII renda urbana', cat:'div', peso:3 },
  { ticker:'CSMG3', setor:'Saneamento', cat:'div', peso:2 },
  { ticker:'HGLG11', setor:'FII logística', cat:'div', peso:2 },
  { ticker:'TRPL4', setor:'Transmissão elétrica', cat:'div', peso:2 },
  // Crescimento
  { ticker:'SBSP3', setor:'Saneamento', cat:'cres', peso:6 },
  { ticker:'SLCE3', setor:'Agro', cat:'cres', peso:4 },
  { ticker:'ALOS3', setor:'Shoppings', cat:'cres', peso:4 },
  { ticker:'KLBN11', setor:'Papel e celulose', cat:'cres', peso:4 },
  { ticker:'RDOR3', setor:'Saúde', cat:'cres', peso:4 },
  { ticker:'POMO4', setor:'Indústria', cat:'cres', peso:3 },
  { ticker:'CURY3', setor:'Construção civil', cat:'cres', peso:3 },
  { ticker:'VULC3', setor:'Consumo / indústria', cat:'cres', peso:2 },
  { ticker:'GGBR4', setor:'Siderurgia', cat:'cres', peso:2 },
];

export let ATIVOS = [...DEFAULT_ATIVOS];

export let prices = {};
export let quantities = {};
export let targetQuantities = {};
export let lastPriceFetch = 0;
export let sortConfig = { key: 'ticker', direction: 'asc' };
export let apiToken = '97aSjyCWDW3pXz8WqXTz9g';

export function loadState() {
  try {
    const savedQtys = localStorage.getItem('carteira_qtys');
    if (savedQtys) Object.assign(quantities, JSON.parse(savedQtys));
    
    const savedAtivos = localStorage.getItem('carteira_ativos');
    if (savedAtivos) {
      const parsed = JSON.parse(savedAtivos);
      if (parsed && parsed.length > 0) {
        ATIVOS.length = 0;
        ATIVOS.push(...parsed);
      }
    }
    
    const savedToken = localStorage.getItem('carteira_token');
    if (savedToken) apiToken = savedToken;

    const savedPrices = localStorage.getItem('carteira_prices');
    if (savedPrices) Object.assign(prices, JSON.parse(savedPrices));

    const savedLastFetch = localStorage.getItem('carteira_last_fetch');
    if (savedLastFetch) lastPriceFetch = parseInt(savedLastFetch);

    const savedSort = localStorage.getItem('carteira_sort');
    if (savedSort) Object.assign(sortConfig, JSON.parse(savedSort));
  } catch(e) {
    console.error("Erro ao carregar estado:", e);
  }
}

export function saveState() {
  try {
    localStorage.setItem('carteira_qtys', JSON.stringify(quantities));
    localStorage.setItem('carteira_ativos', JSON.stringify(ATIVOS));
    localStorage.setItem('carteira_token', apiToken);
    localStorage.setItem('carteira_prices', JSON.stringify(prices));
    localStorage.setItem('carteira_last_fetch', lastPriceFetch.toString());
    localStorage.setItem('carteira_sort', JSON.stringify(sortConfig));
    
    // Cloud Sync
    saveToSupabase();
  } catch(e) {
    console.error("Erro ao salvar estado:", e);
  }
}

export async function syncFromSupabase() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('user_assets')
    .select('*');

  if (error) {
    console.error('Error fetching from Supabase:', error);
    return;
  }

  if (data) {
    ATIVOS.length = 0;
    Object.keys(quantities).forEach(k => delete quantities[k]);
    
    if (data.length > 0) {
      data.forEach(item => {
        ATIVOS.push({
          ticker: item.ticker,
          setor: item.setor,
          cat: item.cat,
          peso: parseFloat(item.peso)
        });
        quantities[item.ticker] = item.quantity;
      });
    }
  }
}

export async function saveToSupabase() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const assetsToUpsert = ATIVOS.map(a => ({
    user_id: session.user.id,
    ticker: a.ticker,
    setor: a.setor,
    cat: a.cat,
    peso: a.peso,
    quantity: quantities[a.ticker] || 0
  }));

  if (assetsToUpsert.length === 0) {
    // If state is empty, delete all for user
    await supabase.from('user_assets').delete().eq('user_id', session.user.id);
    return;
  }

  // Cleanup deleted assets
  const tickersInState = ATIVOS.map(a => a.ticker);
  await supabase
    .from('user_assets')
    .delete()
    .eq('user_id', session.user.id)
    .not('ticker', 'in', `(${tickersInState.join(',')})`);

  // Upsert
  const { error } = await supabase
    .from('user_assets')
    .upsert(assetsToUpsert, { onConflict: 'user_id,ticker' });

  if (error) console.error('Error saving to Supabase:', error);
}

export function clearLocalState() {
  ATIVOS.length = 0;
  Object.keys(quantities).forEach(k => delete quantities[k]);
  saveState();
}

export function exportPortfolio() {
  const data = {
    ativos: ATIVOS,
    quantities: quantities,
    apiToken: apiToken,
    version: '1.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `carteira_portfolio_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPortfolio(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.ativos || !data.quantities) throw new Error("Formato inválido");
    
    ATIVOS.length = 0;
    ATIVOS.push(...data.ativos);
    
    Object.keys(quantities).forEach(k => delete quantities[k]);
    Object.assign(quantities, data.quantities);
    
    if (data.apiToken) apiToken = data.apiToken;
    
    saveState();
    return true;
  } catch (e) {
    console.error("Erro na importação:", e);
    return false;
  }
}

export async function hardReset() {
  if (!confirm("Tem certeza que deseja apagar TODOS os seus dados? Esta ação não pode ser desfeita.")) return false;
  
  ATIVOS.length = 0;
  Object.keys(quantities).forEach(k => delete quantities[k]);
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.from('user_assets').delete().eq('user_id', session.user.id);
  }
  
  saveState();
  return true;
}

export async function restoreDefaults() {
  if (!confirm("Deseja restaurar os ativos padrão? Seus dados atuais serão apagados localmente.")) return false;
  ATIVOS.length = 0;
  ATIVOS.push(...DEFAULT_ATIVOS);
  Object.keys(quantities).forEach(k => delete quantities[k]);
  saveState();
  return true;
}

export function updateApiToken(newToken) {
  apiToken = newToken;
  saveState();
}

export function addAsset(asset) {
  ATIVOS.push(asset);
  saveState();
}

export function removeAsset(ticker) {
  const index = ATIVOS.findIndex(a => a.ticker === ticker);
  if (index !== -1) {
    ATIVOS.splice(index, 1);
    delete quantities[ticker];
    saveState();
  }
}

export function updateLastPriceFetch() {
  lastPriceFetch = Date.now();
  saveState();
}

export function updateSort(key) {
  if (sortConfig.key === key) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.key = key;
    sortConfig.direction = 'asc';
  }
  saveState();
}
