// Main Orchestrator

import { 
  ATIVOS, quantities, apiToken, loadState, saveState, updateApiToken, 
  addAsset, removeAsset, targetQuantities, lastPriceFetch, updateSort,
  syncFromSupabase, clearLocalState, exportPortfolio, importPortfolio, hardReset, restoreDefaults
} from './modules/state.js';
import { fetchPrices, validateTicker } from './modules/api.js';
import { calcTargetQuantities, fmtBRL } from './modules/logic.js';
import { renderTables, updateSummary, setStatus } from './modules/ui.js';
import { setupAuthUI } from './modules/auth.js';
import { initTheme, toggleTheme } from './modules/theme.js';

// --- Callbacks for UI ---
const uiCallbacks = {
  onQtyChange: (ticker, val) => {
    quantities[ticker] = parseInt(val) || 0;
    saveState();
    updateSummary();
    renderTables(uiCallbacks);
  },
  onQtyAdj: (ticker, delta) => {
    const currentQty = quantities[ticker] || 0;
    quantities[ticker] = Math.max(0, currentQty + delta);
    saveState();
    updateSummary();
    renderTables(uiCallbacks);
  },
  onWeightChange: (ticker, val) => {
    const a = ATIVOS.find(x => x.ticker === ticker);
    if (a) a.peso = parseFloat(val) || 0;
    saveState();
    updateSummary();
    renderTables(uiCallbacks);
  },
  onWeightAdj: (ticker, delta) => {
    const a = ATIVOS.find(x => x.ticker === ticker);
    if (a) {
      a.peso = Math.max(0, a.peso + delta);
      saveState();
      updateSummary();
      renderTables(uiCallbacks);
    }
  },
  onRemove: (ticker) => {
    if (confirm(`Deseja remover ${ticker} da carteira?`)) {
      removeAsset(ticker);
      updateSummary();
      renderTables(uiCallbacks);
    }
  }
};

// --- Event Handlers ---
async function handleRefresh(force = false) {
  const agora = Date.now();
  const quinzeMin = 15 * 60 * 1000;
  
  if (!force && agora - lastPriceFetch < quinzeMin) {
    const diff = Math.ceil((quinzeMin - (agora - lastPriceFetch)) / (60 * 1000));
    if (!confirm(`Os preços foram atualizados recentemente. Deseja atualizar novamente? (Recomendado aguardar ${diff} min para poupar sua cota da API)`)) {
      return;
    }
  }

  const btn = document.getElementById('btnRefresh');
  const icon = document.getElementById('refreshIcon');
  if (!btn || !icon) return;

  btn.disabled = true;
  icon.innerHTML = '<span class="spinner"></span>';
  setStatus('load', 'buscando cotações...');

  try {
    await fetchPrices(ATIVOS, () => {
      renderTables(uiCallbacks);
      updateSummary();
    });
    setStatus('ok', 'cotações atualizadas');
  } catch (e) {
    setStatus('err', 'erro ao buscar preços');
  } finally {
    btn.disabled = false;
    icon.textContent = '↻';
  }
}

function handleCalc() {
  const valorStr = document.getElementById('aporteValor').value;
  const aporte = parseFloat(valorStr) || 0;
  
  const { results, totalFuturo } = calcTargetQuantities(ATIVOS, aporte);
  
  // Update state with results
  Object.keys(targetQuantities).forEach(key => delete targetQuantities[key]);
  Object.assign(targetQuantities, results);
  
  document.getElementById('saldoValor').textContent = fmtBRL(totalFuturo);
  renderTables(uiCallbacks);
}

function handleUpdateToken() {
  const modal = document.getElementById('settingsModal');
  const input = document.getElementById('apiTokenInput');
  input.value = apiToken;
  modal.style.display = 'flex';
}

function handleSaveToken() {
  const input = document.getElementById('apiTokenInput');
  updateApiToken(input.value);
  document.getElementById('settingsModal').style.display = 'none';
  alert('Token salvo!');
}

function handleExport() {
  exportPortfolio();
}

function handleImport() {
  document.getElementById('fileInput').click();
}

async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    const success = await importPortfolio(event.target.result);
    if (success) {
      alert('Portfólio importado com sucesso!');
      renderTables(uiCallbacks);
      updateSummary();
    } else {
      alert('Erro ao importar arquivo.');
    }
  };
  reader.readAsText(file);
}

async function handleHardReset() {
  const success = await hardReset();
  if (success) {
    renderTables(uiCallbacks);
    updateSummary();
  }
}

async function handleRestoreDefaults() {
  const success = await restoreDefaults();
  if (success) {
    renderTables(uiCallbacks);
    updateSummary();
    handleRefresh(true);
  }
}

function handleAddAsset(cat) {
  const modal = document.getElementById('assetModal');
  const title = document.getElementById('assetModalTitle');
  const catInput = document.getElementById('assetCat');
  
  catInput.value = cat;
  title.textContent = `Adicionar Ativo (${cat === 'div' ? 'Dividendos' : 'Crescimento'})`;
  modal.style.display = 'flex';
  
  // Clear fields
  document.getElementById('assetTicker').value = '';
  document.getElementById('assetSetor').value = 'Outros';
  document.getElementById('assetPeso').value = '4';
}

async function onAssetFormSubmit(e) {
  e.preventDefault();
  const ticker = document.getElementById('assetTicker').value.toUpperCase().trim();
  const setor = document.getElementById('assetSetor').value;
  const cat = document.getElementById('assetCat').value;
  const peso = parseFloat(document.getElementById('assetPeso').value) || 0;
  
  if (!ticker) return;
  if (ATIVOS.find(a => a.ticker === ticker)) return alert("Ativo já existe na carteira!");

  const btn = document.getElementById('assetForm').querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  
  try {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Validando...';
    
    const isValid = await validateTicker(ticker);
    if (!isValid) {
      alert(`O ticker "${ticker}" não foi encontrado na B3 ou é inválido.`);
      return;
    }
    
    addAsset({ ticker, setor, cat, peso });
    document.getElementById('assetModal').style.display = 'none';
    
    renderTables(uiCallbacks);
    updateSummary();
    handleRefresh(true);
  } catch (err) {
    console.error(err);
    alert("Erro ao validar ticker.");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// --- Initialization ---
function init() {
  initTheme();
  loadState();
  renderTables(uiCallbacks);
  updateSummary();
  
  // Event Bindings
  document.getElementById('btnTheme').onclick = toggleTheme;
  document.getElementById('btnRefresh').onclick = handleRefresh;
  document.getElementById('btnCalc').onclick = handleCalc;
  document.getElementById('btnConfig').onclick = handleUpdateToken;
  document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').style.display = 'none';
  document.getElementById('btnSaveToken').onclick = handleSaveToken;
  document.getElementById('btnExport').onclick = handleExport;
  document.getElementById('btnImport').onclick = handleImport;
  document.getElementById('fileInput').onchange = handleFileSelect;
  document.getElementById('btnHardReset').onclick = handleHardReset;
  document.getElementById('btnRestoreDefaults').onclick = handleRestoreDefaults;

  document.getElementById('btnAddDiv').onclick = () => handleAddAsset('div');
  document.getElementById('btnAddCres').onclick = () => handleAddAsset('cres');
  document.getElementById('closeAssetModal').onclick = () => document.getElementById('assetModal').style.display = 'none';
  document.getElementById('assetForm').onsubmit = onAssetFormSubmit;

  // Centralized Modal Closing (outside click)
  window.addEventListener('click', (e) => {
    const modals = ['authModal', 'settingsModal', 'assetModal', 'updatePwdModal'];
    modals.forEach(id => {
      const el = document.getElementById(id);
      if (e.target === el) el.style.display = 'none';
    });
  });

  // Supabase Auth Setup
  setupAuthUI(async (user, event) => {
    if (user) {
      await syncFromSupabase();
      renderTables(uiCallbacks);
      updateSummary();
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        handleRefresh(true);
      }
    } else {
      if (event === 'SIGNED_OUT') {
        clearLocalState();
        // Reset to default ATIVOS if desired, or just leave empty. 
        // For now, let's just re-load state which might have defaults.
        loadState(); 
      }
      renderTables(uiCallbacks);
      updateSummary();
    }
  });

  // Sorting Headers
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.onclick = () => {
      updateSort(th.dataset.sort);
      renderTables(uiCallbacks);
    };
  });
  
  // Auto-refresh only if needed (24h cache)
  const agora = Date.now();
  const umDia = 24 * 60 * 60 * 1000;
  if (agora - lastPriceFetch > umDia || Object.keys(quantities).length === 0) {
    handleRefresh(true);
  } else {
    setStatus('ok', 'usando preços em cache');
  }
}

init();
