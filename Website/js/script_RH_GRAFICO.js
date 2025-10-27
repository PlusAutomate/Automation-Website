// -------------------------------
// MOCKS (baseados nas suas VIEWs)
// -------------------------------

// VIEW: vw_tempo_medio_etapas
const mockTempoMedioEtapas = [
  { status: "Novo", dias: 3.5 },
  { status: "Triagem", dias: 5.2 },
  { status: "Entrevista", dias: 7.1 },
  { status: "Aprovado", dias: 2.3 },
  { status: "Contratado", dias: 1.4 },
  { status: "Rejeitado", dias: 1.2 },
];

// VIEW: vw_taxa_aprovacao_entrevista
const mockAprovacao = {
  taxaPercent: 62.5,    // taxa geral (%)
  aprovados: 20,        // Aprovado + Contratado
  avaliados: 32         // Entrevista + Aprovado + Contratado
};

// VIEW: vw_areas_mais_requisitadas
const mockAreas = [
  { departamento: "TI", total: 7 },
  { departamento: "Marketing", total: 3 },
  { departamento: "RH", total: 2 },
  { departamento: "Financeiro", total: 1 },
];

// VIEW: vw_tempo_medio_fechamento_vaga
const mockFechamento = [
  { titulo: "Dev Frontend React", dias: 22 },
  { titulo: "Backend Java", dias: 18 },
  { titulo: "Social Media", dias: 14 },
  { titulo: "Analista RH Jr", dias: 10 }
];

// VIEW: Origem (pode virar uma view: vw_origem_candidatos)
const mockOrigem = [
  { origem: "LinkedIn", total: 18 },
  { origem: "Site", total: 9 },
  { origem: "Upload RH", total: 7 },
  { origem: "Indicação", total: 5 },
  { origem: "Outro", total: 3 }
];

// VIEW: Urgência x Volume (pode virar uma view: vw_urgencia_vagas)
const mockUrgencia = [
  { urgencia: "Normal", total: 6 },
  { urgencia: "Alta", total: 4 },
  { urgencia: "Crítica", total: 2 }
];

// VIEW: Funil (pode virar uma view: vw_funil_processo)
const mockFunil = [
  { etapa: "Novo", total: 40 },
  { etapa: "Triagem", total: 28 },
  { etapa: "Entrevista", total: 18 },
  { etapa: "Aprovado", total: 10 },
  { etapa: "Contratado", total: 6 }
];

// VIEW: Banco de talentos (crescimento mensal) (vw_talentos_mes)
const mockTalentosMes = [
  { mes: "Out/24", total: 8 },
  { mes: "Nov/24", total: 11 },
  { mes: "Dez/24", total: 13 },
  { mes: "Jan/25", total: 14 },
  { mes: "Fev/25", total: 16 },
  { mes: "Mar/25", total: 18 },
  { mes: "Abr/25", total: 19 },
  { mes: "Mai/25", total: 21 },
  { mes: "Jun/25", total: 22 }
];

// VIEW: Abandono (vw_taxa_abandono_mes)
const mockAbandonoMes = [
  { mes: "Out/24", taxa: 10 },
  { mes: "Nov/24", taxa: 12 },
  { mes: "Dez/24", taxa: 9 },
  { mes: "Jan/25", taxa: 15 },
  { mes: "Fev/25", taxa: 14 },
  { mes: "Mar/25", taxa: 13 },
  { mes: "Abr/25", taxa: 11 },
  { mes: "Mai/25", taxa: 12 },
  { mes: "Jun/25", taxa: 14 }
];

// -------------------------------
// ESTADO GLOBAL
// -------------------------------
let chartInstance = null;

// -------------------------------
// HELPERS DE UI
// -------------------------------
function setActiveSubmenu(key) {
  const links = document.querySelectorAll(".submenu li a");
  links.forEach(a => a.classList.remove("active-submenu"));
  const target = Array.from(links).find(a => (a.getAttribute("onclick") || "").includes(key));
  if (target) target.classList.add("active-submenu");
}

function clearChartIfAny() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function injectKPIGrid(containerEl, items, columns2 = false) {
  containerEl.innerHTML = "";
  if (columns2) containerEl.style.gridTemplateColumns = "repeat(2, minmax(280px, 1fr))";
  else containerEl.style.gridTemplateColumns = ""; // padrão

  items.forEach(({ titulo, valor, sufixo }) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.justifyContent = "center";
    card.style.textAlign = "center";
    card.style.padding = "18px 14px";

    const h3 = document.createElement("h3");
    h3.textContent = titulo;
    h3.style.margin = "0 0 8px 0";
    h3.style.fontSize = "17px";
    h3.style.color = "#2c3e50";
    h3.style.fontWeight = "700";

    const big = document.createElement("div");
    big.textContent = sufixo ? `${valor} ${sufixo}` : String(valor);
    big.style.fontWeight = "800";
    big.style.fontSize = "28px";
    big.style.color = "#111";
    big.style.letterSpacing = "0.2px";

    card.appendChild(h3);
    card.appendChild(big);
    containerEl.appendChild(card);
  });
}

function getCanvasCtx() {
  const canvas = document.getElementById("graficoCanvas");
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  return canvas.getContext("2d");
}

// Plugin para texto central no donut
const CenterTextPlugin = {
  id: "centerText",
  afterDraw(chart, args, opts) {
    if (!opts || !opts.text) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[0]) return;

    const { x, y } = meta.data[0];
    ctx.save();
    ctx.font = opts.font || "700 26px Segoe UI, Arial";
    ctx.fillStyle = opts.color || "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.text, x, y);
    ctx.restore();
  }
};
if (window.Chart && !Chart.registry.plugins.get('centerText')) {
  Chart.register(CenterTextPlugin);
}

// Gradiente VERTICAL para barras horizontais (indexAxis:'y')
function verticalGradientForBar(ctx, chartArea, topColor = "#00c4cc", bottomColor = "#007a82") {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, topColor);
  g.addColorStop(1, bottomColor);
  return g;
}

// Gradiente para área (linhas com fill)
function verticalAreaGradient(ctx, chartArea, top = "rgba(0,196,204,0.28)", bottom = "rgba(0,196,204,0.02)") {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

// -------------------------------
// MÉTRICA 1: Tempo Médio por Etapa
// -------------------------------
function renderTempoEtapas() {
  setActiveSubmenu("tempoEtapas");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Tempo Médio por Etapa";
  desc.textContent = "Visualize o tempo médio (em dias) que os candidatos permanecem em cada etapa.";

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(
    kpiContainer,
    mockTempoMedioEtapas.map(e => ({
      titulo: e.status,
      valor: e.dias,
      sufixo: "dias"
    }))
  );

  clearChartIfAny();
  const ctx = getCanvasCtx();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: mockTempoMedioEtapas.map(e => e.status),
      datasets: [{
        label: "Dias Médios",
        data: mockTempoMedioEtapas.map(e => e.dias),
        backgroundColor: "#00c4cc",
        borderRadius: 8,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } },
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y} dias` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 12 }, callback: (v) => `${v}d` },
          title: { display: true, text: "Dias" }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 2: Taxa de Aprovação (Donut)
// -------------------------------
function renderTaxaAprovacao() {
  setActiveSubmenu("taxaAprovacao");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Taxa de Aprovação em Entrevistas";
  desc.textContent = "Percentual de candidatos aprovados/contratados dentre os avaliados (Entrevista/Aprovado/Contratado).";

  const kpiContainer = document.getElementById("kpiContainer");
  const restantes = Math.max(0, mockAprovacao.avaliados - mockAprovacao.aprovados);

  injectKPIGrid(kpiContainer, [
    { titulo: "Taxa de Aprovação", valor: `${mockAprovacao.taxaPercent}%` },
    { titulo: "Aprovados", valor: mockAprovacao.aprovados },
    { titulo: "Avaliados", valor: mockAprovacao.avaliados }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  const TURQUESA = "#00c4cc";
  const TURQUESA_FADE = "rgba(0,196,204,0.15)";
  const CINZA_CLARO = "rgba(0,0,0,0.08)";

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Aprovados/Contratados", "Outros Avaliados"],
      datasets: [{
        data: [mockAprovacao.aprovados, restantes],
        backgroundColor: [TURQUESA, TURQUESA_FADE],
        borderColor: [TURQUESA, CINZA_CLARO],
        borderWidth: 2,
        hoverOffset: 6,
        cutout: "65%"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 14, usePointStyle: true, pointStyle: "circle" }
        },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` }
        },
        centerText: {
          text: `${mockAprovacao.taxaPercent}%`,
          color: "#111",
          font: "700 26px Segoe UI, Arial"
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 3: Áreas Mais Requisitadas (Barras Horizontais com GRADIENTE VERTICAL)
// -------------------------------
function renderAreasRequisitadas() {
  setActiveSubmenu("areasRequisitadas");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Áreas Mais Requisitadas";
  desc.textContent = "Quantidade de vagas ativas por departamento (baseado na sua view).";

  // Ordena por total desc
  const dataSorted = [...mockAreas].sort((a, b) => b.total - a.total);
  const topArea = dataSorted[0]?.departamento || "-";
  const totalAbertas = dataSorted.reduce((acc, cur) => acc + cur.total, 0);

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(
    kpiContainer,
    [
      { titulo: "Top Área", valor: topArea },
      { titulo: "Total Abertas", valor: totalAbertas }
    ],
    true // 2 colunas
  );

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dataSorted.map(d => d.departamento),
      datasets: [{
        label: "Vagas",
        data: dataSorted.map(d => d.total),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "#00c4cc";
          return verticalGradientForBar(c, chartArea, "#00c4cc", "#007a82");
        },
        borderRadius: 10,
        maxBarThickness: 44
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } },
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.x} vaga(s)` }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 12 } },
          title: { display: true, text: "Vagas" }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 4: Tempo Médio de Fechamento (Linha Simples - Ordenação: Maior -> Menor)
// -------------------------------
function renderTempoFechamento() {
  setActiveSubmenu("tempoFechamento");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Tempo Médio de Fechamento de Vagas";
  desc.textContent  = "Dias necessários entre a abertura e o fechamento de cada vaga (ordenado do maior para o menor).";

  const dataSorted = [...mockFechamento].sort((a, b) => b.dias - a.dias);

  // KPI Média Geral
  const mediaGeral = (
    dataSorted.reduce((acc, cur) => acc + cur.dias, 0) / dataSorted.length
  ).toFixed(1);

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Média Geral", valor: mediaGeral, sufixo: "dias" }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dataSorted.map(d => d.titulo),
      datasets: [{
        label: "Dias",
        data: dataSorted.map(d => d.dias),
        borderColor: "#00c4cc",
        borderWidth: 2,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y} dias` }
        }
      },
      scales: {
        x: {
          ticks: { font: { size: 12 } },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: { callback: (v) => `${v}d`, font: { size: 12 } },
          title: { display: true, text: "Dias" }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 5: Origem dos Candidatos (PIZZA tradicional)
// -------------------------------
function renderOrigemCandidatos() {
  setActiveSubmenu("origemCandidatos");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Origem dos Candidatos";
  desc.textContent  = "Distribuição por fonte (LinkedIn, Site, Upload RH, Indicação, Outros).";

  const totalCandidatos = mockOrigem.reduce((acc, o) => acc + o.total, 0);
  const topOrigem = [...mockOrigem].sort((a, b) => b.total - a.total)[0]?.origem || "-";

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Top Origem", valor: topOrigem },
    { titulo: "Total Candidatos", valor: totalCandidatos }
  ], true);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: mockOrigem.map(o => o.origem),
      datasets: [{
        data: mockOrigem.map(o => o.total),
        backgroundColor: [
          "#00c4cc", "#3498db", "#9b59b6", "#f1c40f", "#2ecc71"
        ],
        borderColor: "rgba(255,255,255,0.9)",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed || 0;
              const pct = ((val / totalCandidatos) * 100).toFixed(1);
              return ` ${ctx.label}: ${val} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 6: Urgência x Volume (Barras verticais)
// -------------------------------
function renderUrgenciaVolume() {
  setActiveSubmenu("urgenciaVolume");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Urgência x Volume de Vagas";
  desc.textContent  = "Distribuição por nível de urgência (Normal, Alta, Crítica).";

  const totalCriticas = mockUrgencia.find(u => u.urgencia === "Crítica")?.total || 0;
  const totalAltas    = mockUrgencia.find(u => u.urgencia === "Alta")?.total || 0;

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Críticas", valor: totalCriticas },
    { titulo: "Altas", valor: totalAltas }
  ], true);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: mockUrgencia.map(u => u.urgencia),
      datasets: [{
        label: "Vagas",
        data: mockUrgencia.map(u => u.total),
        backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"],
        borderRadius: 8,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y} vaga(s)` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 12 } },
          title: { display: true, text: "Vagas" }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 7: Funil do Processo (Barras horizontais simulando funnel)
// -------------------------------
function renderFunilProcesso() {
  setActiveSubmenu("funilProcesso");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Funil do Processo";
  desc.textContent  = "Conversões por etapa: Novo → Triagem → Entrevista → Aprovado → Contratado.";

  const conversaoGeral = ((mockFunil.at(-1).total / mockFunil[0].total) * 100).toFixed(0) + "%";

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Conversão Geral", valor: conversaoGeral }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  // Ordena do topo (maior) ao fundo (menor) para visual de funil
  const dataSorted = [...mockFunil]; // já está decrescente

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dataSorted.map(f => f.etapa),
      datasets: [{
        label: "Candidatos",
        data: dataSorted.map(f => f.total),
        backgroundColor: "#00c4cc",
        borderRadius: 12,
        maxBarThickness: 48
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.x} candidato(s)` }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 12 } },
          title: { display: true, text: "Candidatos" }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 8: Banco de Talentos (Crescimento) (Linha com área)
// -------------------------------
function renderTalentosCrescimento() {
  setActiveSubmenu("talentosCrescimento");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Banco de Talentos (Crescimento)";
  desc.textContent  = "Evolução do tamanho do banco mês a mês.";

  const totalAtual = mockTalentosMes.at(-1).total;

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Total Atual", valor: totalAtual }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: mockTalentosMes.map(m => m.mes),
      datasets: [{
        label: "Talentos",
        data: mockTalentosMes.map(m => m.total),
        borderColor: "#00c4cc",
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(0,196,204,0.18)";
          return verticalAreaGradient(c, chartArea);
        },
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "#00c4cc"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y} talento(s)` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 12 } }
        }
      }
    }
  });
}

// -------------------------------
// MÉTRICA 9: Taxa de Abandono (Linha com área)
// -------------------------------
function renderTaxaAbandono() {
  setActiveSubmenu("taxaAbandono");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Taxa de Abandono / Desistência";
  desc.textContent  = "Percentual de candidatos que abandonam ou interrompem o processo (mês a mês).";

  const taxaAtual = mockAbandonoMes.at(-1).taxa + "%";

  const kpiContainer = document.getElementById("kpiContainer");
  injectKPIGrid(kpiContainer, [
    { titulo: "Taxa Atual", valor: taxaAtual }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: mockAbandonoMes.map(m => m.mes),
      datasets: [{
        label: "Abandono (%)",
        data: mockAbandonoMes.map(m => m.taxa),
        borderColor: "#e74c3c",
        backgroundColor: (context) => {
          const { chart } = context;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(231,76,60,0.18)";
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, "rgba(231,76,60,0.28)");
          g.addColorStop(1, "rgba(231,76,60,0.02)");
          return g;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: "#e74c3c"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(0,0,0,.85)",
          padding: 12,
          callbacks: { label: (ctx) => ` ${ctx.parsed.y}%` }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { callback: (v) => `${v}%`, font: { size: 12 } }
        }
      }
    }
  });
}

// -------------------------------
// ROTEADOR
// -------------------------------
function loadGrafico(tipo) {
  const canvasEl = document.getElementById("graficoCanvas");
  canvasEl.parentElement.style.minHeight = "380px";

  switch (tipo) {
    case "tempoEtapas":
      renderTempoEtapas();
      break;
    case "taxaAprovacao":
      renderTaxaAprovacao();
      break;
    case "areasRequisitadas":
      renderAreasRequisitadas();
      break;
    case "tempoFechamento":
      renderTempoFechamento();
      break;
    case "origemCandidatos":
      renderOrigemCandidatos();
      break;
    case "urgenciaVolume":
      renderUrgenciaVolume();
      break;
    case "funilProcesso":
      renderFunilProcesso();
      break;
    case "talentosCrescimento":
      renderTalentosCrescimento();
      break;
    case "taxaAbandono":
      renderTaxaAbandono();
      break;
    default:
      renderTempoEtapas();
  }
}

// -------------------------------
// INIT
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".submenu li a").forEach(a => {
    a.addEventListener("click", () => {
      setTimeout(() => {
        const key = (a.getAttribute("onclick") || "").match(/'(.*?)'/);
        if (key && key[1]) setActiveSubmenu(key[1]);
      }, 0);
    });
  });
  loadGrafico("tempoEtapas");
});
