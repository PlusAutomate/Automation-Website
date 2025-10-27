

let chartInstance = null;
const GESTOR_ID = 1; // mock — gestor logado

// =============================
// MOCKS (substituíveis pelas VIEWs futuramente)
// =============================

// 1) GLOBAL — Status das Vagas
const mockStatusVagas = [
  { status: "Solicitada", total: 3 },
  { status: "Em Análise", total: 2 },
  { status: "Aberta", total: 4 },
  { status: "Fechada", total: 5 },
  { status: "Rejeitada", total: 1 }
];

// 2) GLOBAL — SLA: Fechar vs Contratar
const mockSLAByMonth = [
  { mes: "Out/24", fechar: 20, contratar: 24 },
  { mes: "Nov/24", fechar: 18, contratar: 22 },
  { mes: "Dez/24", fechar: 16, contratar: 20 },
  { mes: "Jan/25", fechar: 19, contratar: 23 },
  { mes: "Fev/25", fechar: 20, contratar: 22 }
];
const mockSLAFecharMedio = 18.6;
const mockSLAContratarMedio = 22.3;

// 3) GLOBAL — Tempo médio por departamento
const mockTempoDepto = [
  { departamento: "TI", dias: 20 },
  { departamento: "Marketing", dias: 14 },
  { departamento: "RH", dias: 11 },
  { departamento: "Financeiro", dias: 9 }
];

// 4) GLOBAL — Urgências
const mockUrgencia = [
  { urgencia: "Normal", total: 6 },
  { urgencia: "Alta", total: 4 },
  { urgencia: "Crítica", total: 2 }
];

// 5) GLOBAL — Fechamentos por mês
const mockFechamentosMes = [
  { mes: "Out/24", total: 2 },
  { mes: "Nov/24", total: 3 },
  { mes: "Dez/24", total: 2 },
  { mes: "Jan/25", total: 4 },
  { mes: "Fev/25", total: 3 }
];

// 6) MINHAS — Qualificados por vaga
const mockQualificadosVaga = [
  { id_usuario: 1, vaga: "Dev Backend Java", qualificados: 6 },
  { id_usuario: 1, vaga: "Dev Frontend React", qualificados: 4 },
  { id_usuario: 2, vaga: "Social Media", qualificados: 2 }
];

// 7) MINHAS — Gargalo
const mockGargalo = [
  { id_usuario: 1, etapa: "Triagem", perdas: 10 },
  { id_usuario: 1, etapa: "Entrevista Técnica", perdas: 7 },
  { id_usuario: 1, etapa: "Aprovado", perdas: 2 }
];

// 8) MINHAS — Sucesso
const mockSucessoVaga = [
  { id_usuario: 1, vaga: "Dev Backend Java", sucessoPct: 60 },
  { id_usuario: 1, vaga: "Dev Frontend React", sucessoPct: 40 },
  { id_usuario: 2, vaga: "Social Media", sucessoPct: 30 }
];

// 9) MINHAS — Produtividade RH
const mockProdutividadeRH = [
  { id_usuario: 1, vaga: "Dev Backend Java", candidatosEnviados: 14 },
  { id_usuario: 1, vaga: "Dev Frontend React", candidatosEnviados: 9 },
  { id_usuario: 2, vaga: "Social Media", candidatosEnviados: 6 }
];

// 10) MINHAS — SLA detalhe
const mockSLAporVaga = [
  { id_usuario: 1, vaga: "Dev Backend Java", dias: 21 },
  { id_usuario: 1, vaga: "Dev Frontend React", dias: 24 }
];

// =============================
// HELPERS (padrão RH)
// =============================

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
  else containerEl.style.gridTemplateColumns = "";

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

    card.appendChild(h3);
    card.appendChild(big);
    containerEl.appendChild(card);
  });
}

function getCanvasCtx() {
  const canvas = document.getElementById("graficoCanvas");
  canvas.height = 300; // altura padrão RH confirmada
  return canvas.getContext("2d");
}

// Plugin texto central donut (padrão RH)
const CenterTextPlugin = {
  id: "centerText",
  afterDraw(chart, args, opts) {
    if (!opts || !opts.text) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || !meta.data[0]) return;
    const { x, y } = meta.data[0]._model || meta.data[0];
    ctx.save();
    ctx.font = opts.font || "700 22px Segoe UI, Arial";
    ctx.fillStyle = opts.color || "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.text, (chartArea.left + chartArea.right)/2, (chartArea.top + chartArea.bottom)/2);
    ctx.restore();
  }
};

if (window.Chart && !Chart.registry.plugins.get('centerText')) {
  Chart.register(CenterTextPlugin);
}

// =============================
// 1) Status das Vagas (GLOBAL) — donut
// =============================
function renderStatusVagas() {
  setActiveSubmenu("statusVagas");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Status das Vagas";
  desc.textContent  = "Distribuição geral das vagas solicitadas pelo gestor.";

  const total = mockStatusVagas.reduce((a,b)=>a+b.total,0);

  const kpi = document.getElementById("kpiContainer");
  injectKPIGrid(kpi, mockStatusVagas.map(s => ({
    titulo: s.status,
    valor: s.total
  })), false);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: mockStatusVagas.map(s => s.status),
      datasets: [{
        data: mockStatusVagas.map(s => s.total),
        backgroundColor: ["#3498db","#9b59b6","#00c4cc","#2ecc71","#e74c3c"],
        borderColor: "rgba(255,255,255,0.9)",
        borderWidth: 2,
        cutout: "63%",
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 14, usePointStyle: true, pointStyle: "circle" } },
        tooltip: { backgroundColor: "rgba(0,0,0,.85)", padding: 12 },
        centerText: { text: `${total} total`, font: "700 22px Segoe UI, Arial" }
      },
      animation: { duration: 1100, easing: "easeOutQuart" }
    }
  });
}

// =============================
// 2) SLA de Contratação — linha
// =============================
function renderSLAContratacao() {
  setActiveSubmenu("slaContratacao");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "SLA (Fechar vs Contratar)";
  desc.textContent  = "Fechar = quando o processo acaba (com ou sem contratação). Contratar = quando a vaga realmente é preenchida.";

  const kpi = document.getElementById("kpiContainer");
  injectKPIGrid(kpi, [
    { titulo: "Fechar (média)", valor: mockSLAFecharMedio, sufixo: "dias" },
    { titulo: "Contratar (média)", valor: mockSLAContratarMedio, sufixo: "dias" }
  ], true);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: mockSLAByMonth.map(m=>m.mes),
      datasets: [
        { label: "Fechar", data: mockSLAByMonth.map(m=>m.fechar), borderColor:"#00c4cc", borderWidth:2, tension:0.3, fill:false },
        { label: "Contratar", data: mockSLAByMonth.map(m=>m.contratar), borderColor:"#e67e22", borderWidth:2, tension:0.3, fill:false },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:"bottom" } },
      scales:{
        y:{ beginAtZero:true, ticks:{ callback:v=>`${v}d` } }
      }
    }
  });
}

// =============================
// 3) Tempo por Departamento — barras
// =============================
function renderLeadtimeDepto() {
  setActiveSubmenu("leadtimeDepto");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Tempo Médio por Departamento";
  desc.textContent  = "Quantos dias, em média, o processo leva por área solicitante.";

  const maior = Math.max(...mockTempoDepto.map(d=>d.dias));
  injectKPIGrid(document.getElementById("kpiContainer"), [
    { titulo: "Maior tempo", valor: maior, sufixo: "dias" },
    { titulo: "Departamentos", valor: mockTempoDepto.length }
  ], true);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: mockTempoDepto.map(d=>d.departamento),
      datasets: [{
        label: "Dias",
        data: mockTempoDepto.map(d=>d.dias),
        backgroundColor: "#00c4cc",
        borderRadius: 10,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{
        y:{ beginAtZero:true, ticks:{ callback:v=>`${v}d` } }
      }
    }
  });
}

// =============================
// 4) Urgências — barras
// =============================
function renderUrgenciaCriticas() {
  setActiveSubmenu("urgenciaCriticas");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Urgências";
  desc.textContent  = "Quantas vagas têm prioridade Normal, Alta ou Crítica.";

  const kpi = document.getElementById("kpiContainer");
  injectKPIGrid(kpi, mockUrgencia.map(u => ({
    titulo: u.urgencia,
    valor: u.total
  })), true);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: mockUrgencia.map(u=>u.urgencia),
      datasets: [{
        label: "Vagas",
        data: mockUrgencia.map(u=>u.total),
        backgroundColor:["#2ecc71","#f1c40f","#e74c3c"],
        borderRadius:8,
        maxBarThickness:44
      }]
    }
  });
}

// =============================
// 5) Fechamentos por mês — linha
// =============================
function renderFechamentosMes() {
  setActiveSubmenu("fechamentosMes");

  const title = document.querySelector("#graficoContent h2");
  const desc  = document.querySelector("#graficoContent p");
  title.textContent = "Fechamentos por Mês";
  desc.textContent  = "Histórico de quantas vagas foram finalizadas mês a mês.";

  const total = mockFechamentosMes.reduce((a,b)=>a+b.total,0);
  injectKPIGrid(document.getElementById("kpiContainer"), [
    { titulo: "Total finalizadas", valor: total }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: mockFechamentosMes.map(m=>m.mes),
      datasets: [{
        label: "Finalizadas",
        data: mockFechamentosMes.map(m=>m.total),
        borderColor:"#2ecc71", borderWidth:2,
        tension:0.3, fill:false
      }]
    }
  });
}


// =============================
// ROTEADOR
// =============================
function loadGrafico(tipo) {
  const canvasEl = document.getElementById("graficoCanvas");
  canvasEl.parentElement.style.minHeight = "350px";

  switch (tipo) {
    case "statusVagas":      return renderStatusVagas();
    case "slaContratacao":   return renderSLAContratacao();
    case "leadtimeDepto":    return renderLeadtimeDepto();
    case "urgenciaCriticas": return renderUrgenciaCriticas();
    case "fechamentosMes":   return renderFechamentosMes();
    default: return renderStatusVagas();
  }
}

// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadGrafico("statusVagas");
});

