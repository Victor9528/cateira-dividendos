# Contexto da Sessão - Carteira de Dividendos

## Projeto
**Nome:** Carteira de Dividendos
**Tipo:** Single Page Application (SPA) para gestão de portfólio de investimentos na B3

## Stack
- **Frontend:** Vanilla JavaScript + Vite
- **Backend/Auth:** Supabase
- **APIs:** brapi.dev (cotações B3)
- **Chart.js:** Gráficos (doughnut, bar)
- **Fonts:** DM Sans + DM Mono

## Estrutura de Arquivos
```
├── index.html              # HTML principal (328 linhas)
├── package.json            # Dependencies: vite, @supabase/supabase-js, chart.js
├── vite.config.js          # Config Vite (port 5173)
├── src/
│   ├── main.js             # Orchestrator (461 linhas)
│   ├── styles/main.css    # CSS completo (603 linhas)
│   └── modules/
│       ├── state.js       # Estado global + sync Supabase (276 linhas)
│       ├── logic.js       # Funções de negócio (41 linhas)
│       ├── api.js         # Fetch cotações brapi (61 linhas)
│       ├── ui.js          # Renderização UI (208 linhas)
│       ├── auth.js        # Auth Supabase (196 linhas)
│       ├── supabase.js    # Cliente Supabase (7 linhas)
│       ├── dashboard.js   # Gráficos Chart.js (185 linhas)
│       ├── theme.js       # Dark/Light mode (21 linhas)
│       └── history.js     # Snapshots portfólio (140 linhas)
├── dist/                   # Build produção
└── .planning/              # Documentação planejamento
```

## Funcionalidades
1. **Gestão de Ativos** - Adicionar/editar/remover tickers B3
2. **Categorização** - Dividendos (66% meta) vs Crescimento (34% meta)
3. **Cotações** - Fetch via brapi.dev com cache 15min
4. **Alocação** - Meta vs atual, cálculo automático de quantidade alvo
5. **Aporte** - Simulador de compra com base no valor inputado
6. **Autenticação** - Login/Signup/Reset password via Supabase
7. **Sync Nuvem** - Salvar portfólio e histórico no Supabase
8. **Snapshots** - Salvar mensalmente estado do portfólio
9. **Dashboard** - Gráficos de alocação e comparação alvo vs atual
10. **Export/Import** - JSON do portfólio
11. **Theme** - Dark/Light mode

## Ativos Padrão (DEFAULT_ATIVOS)
**Dividendos (17):** ITUB4, BBSE3, TAEE11, ITSA4, EGIE3, VIVT3, BTLG11, PETR4, VALE3, ABEV3, XPML11, KNRI11, HGRU11, CSMG3, HGLG11, TRPL4

**Crescimento (9):** SBSP3, SLCE3, ALOS3, KLBN11, RDOR3, POMO4, CURY3, VULC3, GGBR4

## Estado Atual
- Versão: v46d4a96 (2026-05-11)
- Funcionando: auth, sync, fetch prices, CRUD ativos
- Tema: Dark mode padrão
- Token API: 97aSjyCWDW3pXz8WqXTz9g (brapi.dev)

## Histórico de Interações
1. (11/05/2026) - Revisão completa do projeto para criar este arquivo de contexto
2. (11/05/2026) - Correção de bugs (botões btnTheme e btnConfig faltando no HTML)
3. (11/05/2026) - Melhoria na lógica de snapshots (validação, não salvar se património = 0)
4. (11/05/2026) - Adicionado gráfico de evolução histórica no dashboard (line chart)

---

**Nota:** Este arquivo deve ser atualizado sempre que houver novas interações ou mudanças significativas no projeto, para manter contexto persistente entre sessões.