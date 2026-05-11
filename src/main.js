// Main Orchestrator

import {
  ATIVOS, quantities, apiToken, loadState, saveState, updateApiToken,
  addAsset, removeAsset, targetQuantities, lastPriceFetch, updateSort,
  syncFromSupabase, clearLocalState, exportPortfolio, importPortfolio, hardReset, restoreDefaults,
  applyAllocationSplit
} from './modules/state.js';
import { fetchPrices, validateTicker } from './modules/api.js';
import { calcTargetQuantities, fmtBRL } from './modules/logic.js';
import { renderTables, updateSummary, setStatus } from './modules/ui.js';
import { initDashboard, updateDashboard } from './modules/dashboard.js';
import { setupAuthUI } from './modules/auth.js';
import { initTheme, toggleTheme } from './modules/theme.js';
import { saveSnapshot, loadHistory, getHistoryStats, deleteSnapshot, loadHistoryFromSupabase } from './modules/history.js';

function renderDashboardStats() {
  const statsEl = document.getElementById('historyStatsDash');
  const history = loadHistory();
  const stats = getHistoryStats(history);
  
  if (!stats || history.length < 2) {
    statsEl.innerHTML = '';
    return;
  }
  
  statsEl.innerHTML = `
    <div class="dashboard-stat">
      <div class="dashboard-stat-label">Variação Total</div>
      <div class="dashboard-stat-value ${parseFloat(stats.variation) >= 0 ? 'positive' : 'negative'}">${stats.variation}%</div>
    </div>
    <div class="dashboard-stat">
      <div class="dashboard-stat-label">CAGR</div>
      <div class="dashboard-stat-value ${parseFloat(stats.cagr) >= 0 ? 'positive' : 'negative'}">${stats.cagr}%</div>
    </div>
    <div class="dashboard-stat">
      <div class="dashboard-stat-label">Total Aportes</div>
      <div class="dashboard-stat-value">R$ ${parseFloat(stats.totalAporte).toLocaleString('pt-BR', {minimumFractionDigits: 0})}</div>
    </div>
    <div class="dashboard-stat">
      <div class="dashboard-stat-label">Meses</div>
      <div class="dashboard-stat-value">${stats.months}</div>
    </div>
  `;
}

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
    if (a) a.peso = parseFloat(String(val).replace(',', '.')) || 0;
    saveState();
    updateSummary();
    renderTables(uiCallbacks);
  },
  onWeightAdj: (ticker, delta) => {
    const a = ATIVOS.find(x => x.ticker === ticker);
    if (a) {
      a.peso = Math.max(0, parseFloat((a.peso + delta * 0.5).toFixed(1)));
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

async function handleSaveSnapshot() {
  console.log('handleSaveSnapshot called');
  try {
    const aporteStr = prompt('Informe o valor do aporte deste mês (R$):', '0');
    const aporte = parseFloat(aporteStr) || 0;
    
    const result = await saveSnapshot(aporte);
    if (result) {
      alert(`Snapshot salvo!\nData: ${result.recorded_at}\nPatrimônio: ${fmtBRL(result.total_value)}`);
      openHistoryModal();
    }
  } catch (e) {
    console.error('Error saving snapshot:', e);
    alert('Erro ao salvar snapshot: ' + e.message);
  }
}

async function openHistoryModal() {
  const modal = document.getElementById('historyModal');
  const listEl = document.getElementById('historyList');
  const statsEl = document.getElementById('historyStats');
  
  let history = loadHistory();
  
  // Try sync from cloud if logged in
  const cloudHistory = await loadHistoryFromSupabase();
  if (cloudHistory && cloudHistory.length > 0) {
    const localIds = new Set(history.map(h => h.id));
    cloudHistory.forEach(h => {
      if (!localIds.has(h.id)) history.push(h);
    });
    history.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  }
  
  if (history.length === 0) {
    statsEl.innerHTML = '';
    listEl.innerHTML = '<div class="history-empty">Nenhum snapshot salvo ainda.<br>Clique em 📊 na barra superior para salvar o primeiro!</div>';
    modal.style.display = 'flex';
    return;
  }
  
  const stats = getHistoryStats(history);
  if (stats) {
    statsEl.innerHTML = `
      <div class="history-stat">
        <div class="history-stat-label">Variação Total</div>
        <div class="history-stat-value ${parseFloat(stats.variation) >= 0 ? 'positive' : 'negative'}">${stats.variation}%</div>
      </div>
      <div class="history-stat">
        <div class="history-stat-label">CAGR</div>
        <div class="history-stat-value ${parseFloat(stats.cagr) >= 0 ? 'positive' : 'negative'}">${stats.cagr}%</div>
      </div>
      <div class="history-stat">
        <div class="history-stat-label">Aportes Total</div>
        <div class="history-stat-value">R$ ${parseFloat(stats.totalAporte).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
      </div>
      <div class="history-stat">
        <div class="history-stat-label">Meses</div>
        <div class="history-stat-value">${stats.months}</div>
      </div>
    `;
  } else {
    statsEl.innerHTML = '';
  }
  
  listEl.innerHTML = history.map(h => {
    const date = new Date(h.recorded_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const variation = history.length > 1 && history.indexOf(h) > 0 
      ? (h.total_value - history[history.indexOf(h) - 1].total_value) / history[history.indexOf(h) - 1].total_value * 100 
      : null;
    const varStr = variation !== null ? `<span class="history-item-pct" style="color: ${variation >= 0 ? 'var(--green)' : 'var(--red)'}">${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%</span>` : '';
    return `
      <div class="history-item">
        <div>
          <div class="history-item-date">${date}</div>
          <div class="history-item-pct">${h.div_pct.toFixed(0)}% div · ${h.cres_pct.toFixed(0)}% cres</div>
        </div>
        <div style="text-align:right;">
          <div class="history-item-value">${fmtBRL(h.total_value)}</div>
          ${varStr}
          ${h.aporte_mes > 0 ? `<div class="history-item-pct">+R$ ${h.aporte_mes.toLocaleString('pt-BR', {minimumFractionDigits: 2})} aporte</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  modal.style.display = 'flex';
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

// --- Split Modal Handlers ---
function handleOpenSplit() {
  const divAssets = ATIVOS.filter(a => a.cat === 'div');
  const totalDiv = divAssets.reduce((s, a) => s + a.peso, 0);
  document.getElementById('splitDivInput').value = Math.round(totalDiv);
  document.getElementById('splitCresInput').value = 100 - Math.round(totalDiv);
  document.getElementById('splitError').style.display = 'none';
  document.getElementById('splitModal').style.display = 'flex';
}

function handleSplitChange() {
  const divVal = parseFloat(document.getElementById('splitDivInput').value) || 0;
  document.getElementById('splitCresInput').value = 100 - divVal;
}

function handleApplySplit() {
  const divVal = parseFloat(document.getElementById('splitDivInput').value) || 0;
  const errorEl = document.getElementById('splitError');
  
  if (divVal <= 0 || divVal >= 100) {
    errorEl.textContent = 'Digite um valor entre 1 e 99.';
    errorEl.style.display = 'block';
    return;
  }
  
  const success = applyAllocationSplit(divVal);
  if (success) {
    document.getElementById('splitModal').style.display = 'none';
    renderTables(uiCallbacks);
    updateSummary();
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

  // Split Modal
  document.getElementById('btnSplit').onclick = handleOpenSplit;
  document.getElementById('closeSplit').onclick = () => document.getElementById('splitModal').style.display = 'none';
  document.getElementById('splitDivInput').oninput = handleSplitChange;
  document.getElementById('btnApplySplit').onclick = handleApplySplit;

  document.getElementById('btnAddDiv').onclick = () => handleAddAsset('div');
  document.getElementById('btnAddCres').onclick = () => handleAddAsset('cres');
  document.getElementById('closeAssetModal').onclick = () => document.getElementById('assetModal').style.display = 'none';
  document.getElementById('assetForm').onsubmit = onAssetFormSubmit;

  // History Modal - executado assim que carrega
  console.log('DEBUG: Setting up snapshot button handler');
  const snapshotBtn = document.getElementById('btnSnapshot');
  console.log('DEBUG: btnSnapshot found:', !!snapshotBtn);
  if (snapshotBtn) {
    snapshotBtn.onclick = function() {
      console.log('DEBUG: Button clicked!');
      handleSaveSnapshot();
    };
  }
  document.getElementById('closeHistory').onclick = () => document.getElementById('historyModal').style.display = 'none';
  document.getElementById('historyModal').ondblclick = (e) => {
    if (e.target.id === 'historyModal') openHistoryModal();
  };

  // Centralized Modal Closing (outside click)
  window.addEventListener('click', (e) => {
    const modals = ['authModal', 'settingsModal', 'assetModal', 'updatePwdModal', 'splitModal', 'historyModal'];
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
  
  // --- Tab Switching ---
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      if (tab === 'dashboard') {
        document.getElementById('summary').style.display = 'none';
        document.getElementById('allocSection').style.display = 'none';
        document.querySelectorAll('[id^="countDiv"]').forEach(el => el.style.display = 'none');
        document.getElementById('tableDiv').style.display = 'none';
        document.querySelector('hr.divider').style.display = 'none';
        document.getElementById('tableCres').style.display = 'none';
        document.getElementById('dashboardSection').classList.remove('hidden');
        renderDashboardStats();
        const period = document.getElementById('historyPeriod')?.value || 'all';
        updateDashboard(period);
      } else {
        document.getElementById('summary').style.display = '';
        document.getElementById('allocSection').style.display = '';
        document.querySelectorAll('[id^="countDiv"]').forEach(el => el.style.display = '');
        document.getElementById('tableDiv').style.display = '';
        document.querySelector('hr.divider').style.display = '';
        document.getElementById('tableCres').style.display = '';
        document.getElementById('dashboardSection').classList.add('hidden');
      }
    };
  });

  // Period selector for history chart
  const periodSelect = document.getElementById('historyPeriod');
  if (periodSelect) {
    periodSelect.onchange = () => {
      const period = periodSelect.value;
      updateDashboard(period);
      const stats = getHistoryStats(loadHistory());
      if (stats) renderDashboardStats(stats, period);
    };
  }

  // Auto-refresh only if needed (24h cache)
  const agora = Date.now();
  const umDia = 24 * 60 * 60 * 1000;
  if (agora - lastPriceFetch > umDia || Object.keys(quantities).length === 0) {
    handleRefresh(true);
  } else {
    setStatus('ok', 'usando preços em cache');
  }
}

// Expose for debugging
window._handleSaveSnapshot = handleSaveSnapshot;

init();
