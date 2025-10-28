// =====================================================
// RH GRÁFICOS – INTEGRAÇÃO FINAL (com fallback seguro)
// =====================================================

let chartInstance = null;
const API_BASE = "http://localhost:5000/dashboard/rh";

// ---------- Funções auxiliares ----------
async function getJSON(endpoint) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`);
    if (!response.ok) throw new Error(`Erro ao buscar ${endpoint}`);
    return await response.json();
  } catch (e) {
    console.error("Erro na API:", e);
    return [];  // fallback sem quebrar
  }
}

function clearChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function setActiveSubmenu(key) {
  document.querySelectorAll(".submenu a").forEach(a => a.classList.remove("active-submenu"));
  const target = Array.from(document.querySelectorAll(".submenu a"))
    .find(a => (a.getAttribute("onclick") || "").includes(key));
  if (target) target.classList.add("active-submenu");
}

function injectKPIs(items) {
  const container = document.getElementById("kpiContainer");
  container.innerHTML = "";
  if (!items || items.length === 0) return;

  items.forEach(k => {
    container.innerHTML += `
      <div class="card">
        <h3>${k.titulo}</h3>
        <p><strong>${k.valor}${k.sufixo || ""}</strong></p>
      </div>
    `;
  });
}

// =====================================================
// 1) Tempo Médio por Etapa
// =====================================================
async function renderTempoEtapas() {
  setActiveSubmenu("tempoEtapas");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Tempo Médio por Etapa";
  desc.textContent = "Visualize o tempo médio que os candidatos permanecem em cada etapa.";

  const data = await getJSON("tempo-etapas");
  if (!data || data.length === 0) {
    injectKPIs([{ titulo: "Média Geral", valor: 0, sufixo: " dias" }]);
    clearChart();
    return;
  }

  const mediaGeral = (
    data.reduce((acc, cur) => acc + Number(cur.dias || 0), 0) / data.length
  ).toFixed(1);
  injectKPIs([{ titulo: "Média Geral", valor: mediaGeral, sufixo: " dias" }]);

  clearChart();
  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.status),
      datasets: [{
        label: "Dias",
        data: data.map(d => d.dias),
        backgroundColor: "#00c4cc",
        borderRadius: 12
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } }
    }
  });
}

// =====================================================
// 2) Taxa de Aprovação
// =====================================================
async function renderTaxaAprovacao() {
  setActiveSubmenu("taxaAprovacao");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Taxa de Aprovação";
  desc.textContent = "Percentual de candidatos aprovados entre os avaliados.";

  const data = await getJSON("taxa-aprovacao");
  const taxa = data?.taxa_percent ?? 0;
  const aprov = data?.aprovados ?? 0;
  const aval = data?.avaliados ?? 0;

  injectKPIs([
    { titulo: "Taxa", valor: taxa, sufixo: "%" },
    { titulo: "Aprovados", valor: aprov },
    { titulo: "Avaliados", valor: aval }
  ]);

  clearChart();
  const ctx = document.getElementById("graficoCanvas").getContext("2d");

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Taxa de Aprovação"],
      datasets: [{ data: [taxa], backgroundColor: "#00c4cc" }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// =====================================================
// 3) Áreas mais Requisitadas
// =====================================================
async function renderAreasRequisitadas() {
  setActiveSubmenu("areasRequisitadas");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Áreas mais Requisitadas";
  desc.textContent = "Departamentos com maior número de vagas abertas.";

  const data = await getJSON("areas");
  if (!data || data.length === 0) {
    clearChart();
    return;
  }

  clearChart();
  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.departamento),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#00c4cc" }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// =====================================================
// 4) Tempo Médio de Fechamento
// =====================================================
async function renderTempoFechamento() {
  setActiveSubmenu("tempoFechamento");

  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Tempo Médio de Fechamento";
  desc.textContent = "Tempo médio (em dias) para fechamento das vagas.";

  const data = await getJSON("tempo-fechamento");
  if (!data || data.length === 0) {
    injectKPIs([{ titulo: "Média Geral", valor: 0, sufixo: " dias" }]);
    clearChart();
    return;
  }

  const media = (
    data.reduce((acc, cur) => acc + Number(cur.dias || 0), 0) / data.length
  ).toFixed(1);
  injectKPIs([{ titulo: "Média Geral", valor: media, sufixo: " dias" }]);

  clearChart();
  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.titulo),
      datasets: [{
        label: "Dias",
        data: data.map(d => d.dias),
        borderColor: "#00c4cc",
        fill: false,
        tension: 0.3
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// =====================================================
// ROTEADOR
// =====================================================
function loadGrafico(tipo) {
  switch (tipo) {
    case "tempoEtapas": return renderTempoEtapas();
    case "taxaAprovacao": return renderTaxaAprovacao();
    case "areasRequisitadas": return renderAreasRequisitadas();
    case "tempoFechamento": return renderTempoFechamento();
    default: return renderTempoEtapas();
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => loadGrafico("tempoEtapas"));
