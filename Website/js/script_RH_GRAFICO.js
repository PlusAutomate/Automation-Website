// =====================================================
// RH GRÁFICOS – low-lag KPIs + cancelamento + cache
// =====================================================

let chartInstance = null;
const API_BASE = "http://98.95.103.3:5000/dashboard/rh";

// --- cache simples (por endpoint) ---
const CACHE_TTL = 30_000; // 30s
const cache = new Map(); // endpoint -> {ts, data}

// --- controle de requisições em voo ---
let currentController = null;

// ---------- utils ----------
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

function setHeader(h2, p) {
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = h2;
  desc.textContent = p;
}

function clearKPIs() {
  const container = document.getElementById("kpiContainer");
  container.innerHTML = "";
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

function injectSkeletonKPIs(n = 2) {
  const container = document.getElementById("kpiContainer");
  container.innerHTML = "";
  const skel = `
    <div class="card" style="min-width:160px">
      <h3 style="height:18px;background:#ececec;border-radius:6px;margin:0 0 10px;"></h3>
      <p style="height:22px;background:#f2f2f2;border-radius:6px;width:70%;"></p>
    </div>`;
  container.innerHTML = Array.from({ length: n }).map(() => skel).join("");
}

// começa uma troca de gráfico: limpa chart + coloca skeleton e aborta a chamada anterior
function beginLoad({ submenuKey, title, desc, skeletonCount = 2 }) {
  setActiveSubmenu(submenuKey);
  setHeader(title, desc);
  clearChart();
  injectSkeletonKPIs(skeletonCount);
  if (currentController) currentController.abort(); // cancela fetch anterior
  currentController = new AbortController();
  return currentController.signal;
}

async function getJSON(endpoint, { useCache = true, signal } = {}) {
  // cache
  if (useCache && cache.has(endpoint)) {
    const { ts, data } = cache.get(endpoint);
    if (Date.now() - ts < CACHE_TTL) return data;
  }

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, { signal });
    if (!res.ok) throw new Error(`Erro ao buscar ${endpoint}`);
    const data = await res.json();
    if (useCache) cache.set(endpoint, { ts: Date.now(), data });
    return data;
  } catch (e) {
    if (e.name === "AbortError") return []; // troca de gráfico: ignore
    console.error("Erro na API:", e);
    return []; // fallback
  }
}

// =====================================================
// 1) Tempo Médio por Etapa
// =====================================================
async function renderTempoEtapas() {
  const signal = beginLoad({
    submenuKey: "tempoEtapas",
    title: "Tempo Médio por Etapa",
    desc: "Tempo médio (em dias) que os candidatos permanecem em cada etapa.",
    skeletonCount: 1
  });

  const data = await getJSON("tempo-etapas", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    injectKPIs([{ titulo: "Média Geral", valor: 0, sufixo: " dias" }]);
    clearChart();
    return;
  }

  const mediaGeral = (
    data.reduce((acc, cur) => acc + Number(cur.dias || 0), 0) / data.length
  ).toFixed(1);
  injectKPIs([{ titulo: "Média Geral", valor: mediaGeral, sufixo: " dias" }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
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
  const signal = beginLoad({
    submenuKey: "taxaAprovacao",
    title: "Taxa de Aprovação",
    desc: "Percentual de candidatos aprovados entre os avaliados.",
    skeletonCount: 3
  });

  const data = await getJSON("taxa-aprovacao", { signal });
  clearKPIs();

  const taxa = Number(data?.taxa_percent ?? 0);
  const aprov = Number(data?.aprovados ?? 0);
  const aval = Number(data?.avaliados ?? 0);

  injectKPIs([
    { titulo: "Taxa", valor: taxa, sufixo: "%" },
    { titulo: "Aprovados", valor: aprov },
    { titulo: "Avaliados", valor: aval }
  ]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Taxa de Aprovação"],
      datasets: [{ data: [taxa], backgroundColor: "#00c4cc", borderRadius: 12 }]
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
  const signal = beginLoad({
    submenuKey: "areasRequisitadas",
    title: "Áreas mais Requisitadas",
    desc: "Departamentos com maior volume de vagas ativas.",
    skeletonCount: 0
  });

  const data = await getJSON("areas", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.departamento),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#00c4cc", borderRadius: 12 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// =====================================================
// 4) Tempo Médio de Fechamento
// =====================================================
async function renderTempoFechamento() {
  const signal = beginLoad({
    submenuKey: "tempoFechamento",
    title: "Tempo Médio de Fechamento",
    desc: "Dias médios para fechamento das vagas (status 'Fechada').",
    skeletonCount: 1
  });

  const data = await getJSON("tempo-fechamento", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    injectKPIs([{ titulo: "Média Geral", valor: 0, sufixo: " dias" }]);
    clearChart();
    return;
  }

  const media = (
    data.reduce((acc, cur) => acc + Number(cur.dias || 0), 0) / data.length
  ).toFixed(1);
  injectKPIs([{ titulo: "Média Geral", valor: media, sufixo: " dias" }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
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
// 5) Origem dos Candidatos
// =====================================================
async function renderOrigemCandidatos() {
  const signal = beginLoad({
    submenuKey: "origemCandidatos",
    title: "Origem dos Candidatos",
    desc: "Distribuição por origem dos candidatos.",
    skeletonCount: 1
  });

  const data = await getJSON("origem", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const total = data.reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  injectKPIs([{ titulo: "Total de Candidatos", valor: total }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(d => d.origem),
      datasets: [{
        data: data.map(d => d.total),
        backgroundColor: ["#00c4cc", "#00a5ad", "#008f96", "#00797f", "#006468"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      cutout: "55%"
    }
  });
}

// =====================================================
// 6) Urgência x Volume
// =====================================================
async function renderUrgenciaVagas() {
  const signal = beginLoad({
    submenuKey: "urgenciaVagas",
    title: "Urgência x Volume",
    desc: "Quantidade de vagas ativas por nível de urgência.",
    skeletonCount: 0
  });

  const data = await getJSON("urgencia", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.urgencia),
      datasets: [{ data: data.map(d => d.total), backgroundColor: "#00c4cc", borderRadius: 12 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// =====================================================
// 7) Funil do Processo
// =====================================================
async function renderFunilProcesso() {
  const signal = beginLoad({
    submenuKey: "funilProcesso",
    title: "Funil do Processo Seletivo",
    desc: "Volume por etapa do funil.",
    skeletonCount: 1
  });

  const data = await getJSON("funil", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const total = data.reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  injectKPIs([{ titulo: "Total no Funil", valor: total }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.etapa),
      datasets: [{ label: "Total", data: data.map(d => d.total), backgroundColor: "#00c4cc", borderRadius: 12 }]
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
// 8) Banco de Talentos (Mês a Mês)
// =====================================================
async function renderTalentosMes() {
  const signal = beginLoad({
    submenuKey: "talentosMes",
    title: "Banco de Talentos (Mês a Mês)",
    desc: "Novos candidatos cadastrados por mês.",
    skeletonCount: 1
  });

  const data = await getJSON("talentos", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const totalPeriodo = data.reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  injectKPIs([{ titulo: "Total no Período", valor: totalPeriodo }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.mes),
      datasets: [{
        label: "Candidatos",
        data: data.map(d => d.total),
        borderColor: "#00c4cc",
        fill: false,
        tension: 0.3
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });
}

// =====================================================
// 9) Taxa de Abandono / Desistência
// =====================================================
async function renderTaxaAbandono() {
  const signal = beginLoad({
    submenuKey: "taxaAbandono",
    title: "Taxa de Abandono / Desistência",
    desc: "Percentual mensal de processos não concluídos (aprox).",
    skeletonCount: 1
  });

  const data = await getJSON("abandono", { signal });
  clearKPIs();

  if (!Array.isArray(data) || data.length === 0) {
    clearChart();
    return;
  }

  const media = (
    data.reduce((acc, cur) => acc + Number(cur.taxa || 0), 0) / data.length
  ).toFixed(1);
  injectKPIs([{ titulo: "Média do Período", valor: media, sufixo: "%" }]);

  const ctx = document.getElementById("graficoCanvas").getContext("2d");
  clearChart();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.mes),
      datasets: [{
        label: "% Abandono",
        data: data.map(d => d.taxa),
        borderColor: "#00c4cc",
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
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
    case "origemCandidatos": return renderOrigemCandidatos();
    case "urgenciaVagas": return renderUrgenciaVagas();
    case "funilProcesso": return renderFunilProcesso();
    case "talentosMes": return renderTalentosMes();
    case "taxaAbandono": return renderTaxaAbandono();
    default: return renderTempoEtapas();
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => loadGrafico("tempoEtapas"));
