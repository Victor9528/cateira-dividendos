import { Chart, DoughnutController, BarController, LineController, ArcElement, BarElement, PointElement, LineElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { ATIVOS, quantities, prices } from './state.js';
import { getValorAtivo, getTotalPortfolio, fmtBRL } from './logic.js';
import { loadHistory, getHistoryStats } from './history.js';

Chart.register(DoughnutController, BarController, LineController, ArcElement, BarElement, PointElement, LineElement, Tooltip, Legend, CategoryScale, LinearScale);

let doughnutChart = null;
let barChart = null;
let historyChart = null;

export function initDashboard() {
  renderDoughnut();
  renderBar();
  renderHistory();
}

function renderDoughnut() {
  const ctx = document.getElementById('chartAlocacao');
  if (!ctx) return;

  if (doughnutChart) doughnutChart.destroy();

  const ativosComPosicao = ATIVOS.filter(a => (quantities[a.ticker] || 0) > 0);
  const total = getTotalPortfolio(ATIVOS);

  if (total === 0) {
    ctx.parentElement.innerHTML = '<p class="chart-empty">Adicione ativos com posição para visualizar</p>';
    return;
  }

  const data = ativosComPosicao.map(a => getValorAtivo(a));
  const labels = ativosComPosicao.map(a => a.ticker);
  const colors = [
    'rgba(34, 197, 94, 0.85)',
    'rgba(59, 130, 246, 0.85)',
    'rgba(168, 85, 247, 0.85)',
    'rgba(251, 191, 36, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(20, 184, 166, 0.85)',
    'rgba(249, 115, 22, 0.85)',
    'rgba(132, 204, 22, 0.85)',
    'rgba(244, 63, 94, 0.85)',
    'rgba(99, 102, 241, 0.85)',
    'rgba(236, 72, 153, 0.85)',
    'rgba(14, 165, 233, 0.85)'
  ];

  doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: 'var(--bg)',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { 
            font: { family: "'DM Sans'", size: 12 }, 
            boxWidth: 14, 
            padding: 12,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 40, 0.95)',
          titleFont: { family: "'DM Mono'", size: 12 },
          bodyFont: { family: "'DM Sans'", size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw;
              const pct = (val / total * 100).toFixed(1);
              return ` ${fmtBRL(val)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function renderBar() {
  const ctx = document.getElementById('chartComparacao');
  if (!ctx) return;

  if (barChart) barChart.destroy();

  const ativos = ATIVOS.filter(a => (quantities[a.ticker] || 0) > 0);
  const total = getTotalPortfolio(ATIVOS);

  if (total === 0) {
    ctx.parentElement.innerHTML = '<p class="chart-empty">Adicione ativos com posição para visualizar</p>';
    return;
  }

  const labels = ativos.map(a => a.ticker);
  const targetData = ativos.map(a => a.peso);
  const atualData = ativos.map(a => {
    const val = getValorAtivo(a);
    return total > 0 ? (val / total * 100) : 0;
  });

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Alvo',
          data: targetData,
          backgroundColor: 'rgba(100, 100, 100, 0.35)',
          borderColor: 'rgba(100, 100, 100, 0.6)',
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        },
        {
          label: 'Atual',
          data: atualData,
          backgroundColor: labels.map((_, i) => i % 2 === 0 ? 'rgba(34, 197, 94, 0.85)' : 'rgba(59, 130, 246, 0.85)'),
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { 
            font: { family: "'DM Sans'", size: 12 }, 
            boxWidth: 12, 
            padding: 16,
            usePointStyle: true,
            pointStyle: 'rectRounded'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 40, 0.95)',
          titleFont: { family: "'DM Mono'", size: 12 },
          bodyFont: { family: "'DM Sans'", size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'DM Mono'", size: 11 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(100,100,100,0.1)' },
          ticks: { 
            font: { family: "'DM Mono'", size: 11 }, 
            callback: v => v + '%'
          }
        }
      }
    }
  });
}

export function updateDashboard(period = 'all') {
  renderDoughnut();
  renderBar();
  renderHistory(period);
}

function renderHistory(period = 'all') {
  const ctx = document.getElementById('chartEvolucao');
  if (!ctx) return;

  if (historyChart) historyChart.destroy();

  const history = loadHistory();
  
  if (history.length < 2) {
    ctx.parentElement.innerHTML = '<p class="chart-empty">Salve pelo menos 2 snapshots para ver a evolução</p>';
    return;
  }

  let sorted = [...history].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  
  if (period !== 'all') {
    const months = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    sorted = sorted.filter(h => new Date(h.recorded_at) >= cutoffDate);
    
    if (sorted.length < 2) {
      ctx.parentElement.innerHTML = '<p class="chart-empty">Período muito curto. Salve mais snapshots.</p>';
      return;
    }
  }

  const labels = sorted.map(h => {
    const d = new Date(h.recorded_at);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  });
  
  const totalData = sorted.map(h => h.total_value);
  const divData = sorted.map(h => h.div_value);
  const cresData = sorted.map(h => h.cres_value);

  const stats = getHistoryStats(sorted);

  historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Total',
          data: totalData,
          borderColor: '#22c87a',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Dividendos',
          data: divData,
          borderColor: '#22c87a',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Crescimento',
          data: cresData,
          borderColor: '#4d9fff',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { 
            font: { family: "'DM Sans'", size: 12 }, 
            boxWidth: 12, 
            padding: 16,
            usePointStyle: true,
            pointStyle: 'rectRounded'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 40, 0.95)',
          titleFont: { family: "'DM Mono'", size: 12 },
          bodyFont: { family: "'DM Sans'", size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmtBRL(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "'DM Mono'", size: 11 } }
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(100,100,100,0.1)' },
          ticks: { 
            font: { family: "'DM Mono'", size: 11 }, 
            callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k'
          }
        }
      }
    }
  });
}