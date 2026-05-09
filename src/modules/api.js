// API Module

import { apiToken, prices, updateLastPriceFetch } from './state.js';

export async function fetchPrices(assets, onUpdate) {
  if (!assets || assets.length === 0) return;
  let successCount = 0;
  for (let i = 0; i < assets.length; i++) {
    const a = assets[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      let url = `https://brapi.dev/api/quote/${a.ticker}?fundamental=false`;
      if (apiToken) url += `&token=${apiToken}`;
      
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!resp.ok) continue;
      
      const data = await resp.json();
      if (data.results && data.results[0]) {
        prices[a.ticker] = data.results[0].regularMarketPrice;
        successCount++;
        if (onUpdate) onUpdate();
      }
      
      await new Promise(r => setTimeout(r, 250));
      
    } catch(e) {
      clearTimeout(timeoutId);
      console.warn(`Erro ao buscar ${a.ticker}:`, e.name === 'AbortError' ? 'timeout' : e);
    }
  }
  
  if (successCount > 0) {
    updateLastPriceFetch();
  }
}

export async function validateTicker(ticker) {
  try {
    let url = `https://brapi.dev/api/quote/${ticker}?fundamental=false`;
    if (apiToken) url += `&token=${apiToken}`;
    
    const resp = await fetch(url);
    if (!resp.ok) return false;
    
    const data = await resp.json();
    if (data.results && data.results[0] && !data.results[0].error) {
      // Also cache the price immediately to save an API call
      prices[ticker] = data.results[0].regularMarketPrice;
      return true;
    }
    return false;
  } catch(e) {
    console.error("Erro ao validar ticker:", e);
    return false; // Assume invalid on error to be safe, or we could throw. 
  }
}
