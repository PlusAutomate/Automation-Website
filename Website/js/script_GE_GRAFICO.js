// =====================================================
// DASHBOARD GESTOR — v1.1 (low-lag + fallback SLA + fixes)
// =====================================================

let chartInstance = null;
const API_BASE_G = "http://98.92.123.94:8000/dashboard/gestor";

// ----- Cache simples por endpoint -----
const CACHE_TTL = 30_000; // 30s
const cacheG = new Map(); // key -> { ts, data }

// ----- Controle de requests em voo -----
let currentControllerG = null;

// ---------- Usuário/gestor logado (sessionStorage) ----------
function getGestorId() {
  try {
    const u = JSON.parse(sessionStorage.getItem("usuario"));
    return u?.usuario?.id_usuario ?? u?.id_usuario ?? 1;
  } catch {
    return 1;
  }
}
const GESTOR_ID = getGestorId();

// ---------- Utils visuais ----------
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
  if (!items || !items.length) return;
  for (const k of items) {
    container.innerHTML += `
      <div class="card">
        <h3>${k.titulo}</h3>
        <p><strong>${k.valor}${k.sufixo || ""}</strong></p>
      </div>`;
  }
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

function getCtx() {
  const canvas = document.getElementById("graficoCanvas");
  canvas.style.maxHeight = "360px";
  canvas.height = 340;
  return canvas.getContext("2d");
}

// Começa uma troca de gráfico: header + skeleton + abort
function beginLoad({ submenuKey, title, desc, skeletonCount = 2 }) {
  setActiveSubmenu(submenuKey);
  setHeader(title, desc);
  clearChart();
  injectSkeletonKPIs(skeletonCount);
  if (currentControllerG) currentControllerG.abort();
  currentControllerG = new AbortController();
  return currentControllerG.signal;
}

// ---------- Fetch com cache/abort ----------
async function getJSONG(endpoint, { useCache = true, signal } = {}) {
  const withId = endpoint + (endpoint.includes("?") ? "&" : "?") + `id_gestor=${GESTOR_ID}`;

  if (useCache && cacheG.has(withId)) {
    const { ts, data } = cacheG.get(withId);
    if (Date.now() - ts < CACHE_TTL) return data;
  }
  try {
    const res = await fetch(`${API_BASE_G}/${withId}`, { signal });
    if (!res.ok) throw new Error(`Erro ao buscar ${endpoint}`);
    const data = await res.json();
    if (useCache) cacheG.set(withId, { ts: Date.now(), data });
    return data;
  } catch (e) {
    if (e.name === "AbortError") return [];
    console.error("Erro API GESTOR:", e);
    return [];
  }
}

// =====================================================
// 1) Status das Vagas — donut + KPIs (GLOBAL)
// =====================================================
async function renderStatusVagas() {
  const signal = beginLoad({
    submenuKey: "statusVagas",
    title: "Status das Vagas",
    desc: "Distribuição geral das vagas por status.",
    skeletonCount: 5
  });

  const data = await getJSONG("status", { signal });
  clearKPIs();

  const total = (data || []).reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  injectKPIs(
    (data || []).map(r => ({ titulo: r.status, valor: r.total }))
      .concat([{ titulo: "Total", valor: total }])
  );

  if (!data || data.length === 0) { clearChart(); return; }

  clearChart();
  const ctx = getCtx();
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(r => r.status),
      datasets: [{
        data: data.map(r => r.total),
        backgroundColor: ["#00c4cc", "#2ecc71", "#3498db", "#9b59b6", "#e74c3c"],
        borderColor: "#fff",
        borderWidth: 2,
        cutout: "58%"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// =====================================================
// 2) SLA Fechar x Contratar — linha + KPIs (GLOBAL)
//   Fallback A: se séries mensais vierem vazias mas
//   houver médias, plota 1 ponto “Geral” com as médias.
// =====================================================
async function renderSLAContratacao() {
  const signal = beginLoad({
    submenuKey: "slaContratacao",
    title: "SLA de Contratação",
    desc: "Tempo médio para fechar e contratar (mês a mês).",
    skeletonCount: 2
  });

  const data = await getJSONG("sla", { signal });

  const fecharMedio = data?.fechamento_medio?.fechar_medio_dias ?? 0;
  const contratarMedio = data?.contratacao_medio?.contratar_medio_dias ?? 0;

  const mesesFechar = data?.fechamento_mensal?.map(m => m.mes) || [];
  const fechar = data?.fechamento_mensal?.map(m => Number(m.fechar || 0)) || [];

  const mesesContratar = data?.contratacao_mensal?.map(m => m.mes) || [];
  const contratar = data?.contratacao_mensal?.map(m => Number(m.contratar || 0)) || [];

  clearKPIs();
  injectKPIs([
    { titulo: "Fechar (média)", valor: fecharMedio, sufixo: " dias" },
    { titulo: "Contratar (média)", valor: contratarMedio, sufixo: " dias" }
  ]);

  clearChart();
  const ctx = getCtx();

  const seriesFecharOK = mesesFechar.length && fechar.some(v => v > 0);
  const seriesContratarOK = mesesContratar.length && contratar.some(v => v > 0);

  // --- Fallback A: nenhuma série mensal, mas médias > 0
  if (!seriesFecharOK && !seriesContratarOK && (fecharMedio > 0 || contratarMedio > 0)) {
    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Geral"],
        datasets: [
          { label: "Fechar (dias)", data: [fecharMedio], borderColor: "#00c4cc", borderWidth: 2, tension: 0.3, fill: false },
          { label: "Contratar (dias)", data: [contratarMedio], borderColor: "#e67e22", borderWidth: 2, tension: 0.3, fill: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } }
      }
    });
    return;
  }

  // --- Normal: plota o que existir
  const labels = seriesFecharOK ? mesesFechar : mesesContratar;
  const datasets = [];
  if (seriesFecharOK) {
    datasets.push({ label: "Fechar (dias)", data: fechar, borderColor: "#00c4cc", borderWidth: 2, tension: 0.3, fill: false });
  }
  if (seriesContratarOK) {
    datasets.push({ label: "Contratar (dias)", data: contratar, borderColor: "#e67e22", borderWidth: 2, tension: 0.3, fill: false });
  }

  if (!datasets.length) {
    // Nenhum dado mesmo
    ctx.font = "16px Arial";
    ctx.fillStyle = "#777";
    ctx.textAlign = "center";
    ctx.fillText("Sem dados disponíveis para SLA ainda", ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// =====================================================
// 3) Lead Time por Departamento — barras (GLOBAL)
// =====================================================
async function renderLeadtimeDepto() {
  const signal = beginLoad({
    submenuKey: "leadtimeDepto",
    title: "Lead Time por Departamento",
    desc: "Dias médios entre abertura e última atualização das vagas por área.",
    skeletonCount: 2
  });

  const data = await getJSONG("departamento", { signal });

  if (!data || !data.length) {
    clearKPIs();
    clearChart();
    const ctx = getCtx();
    ctx.font = "16px Arial";
    ctx.fillStyle = "#777";
    ctx.textAlign = "center";
    ctx.fillText("Nenhum dado disponível ainda", ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }

  // Protege contra valores indefinidos/NaN
  const valores = data.map(d => Number(d.dias || 0)).filter(v => Number.isFinite(v));
  const maiorLead = valores.length ? Math.max(...valores) : 0;

  clearKPIs();
  injectKPIs([
    { titulo: "Departamentos", valor: data.length },
    { titulo: "Maior Lead Time", valor: maiorLead, sufixo: " dias" }
  ]);

  clearChart();
  const ctx = getCtx();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.departamento),
      datasets: [{
        label: "Dias",
        data: data.map(d => d.dias),
        backgroundColor: "#00c4cc",
        borderRadius: 10,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} dias` } }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Dias" } }
      }
    }
  });
}

// =====================================================
// 4) Urgências — barras (GLOBAL)
// =====================================================
async function renderUrgenciaCriticas() {
  const signal = beginLoad({
    submenuKey: "urgenciaCriticas",
    title: "Urgências (Críticas vs Outras)",
    desc: "Volume de vagas ativas por nível de urgência.",
    skeletonCount: 3
  });

  const data = await getJSONG("urgencia", { signal });

  clearKPIs();
  injectKPIs((data || []).map(u => ({ titulo: u.urgencia, valor: u.total })));

  if (!data || !data.length) { clearChart(); return; }

  clearChart();
  const ctx = getCtx();
  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(u => u.urgencia),
      datasets: [{
        label: "Vagas",
        data: data.map(u => u.total),
        backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"],
        borderRadius: 10,
        maxBarThickness: 44
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// =====================================================
// 5) Fechamentos por Mês — linha (GLOBAL)
// =====================================================
async function renderFechamentosMes() {
  const signal = beginLoad({
    submenuKey: "fechamentosMes",
    title: "Fechamentos por Mês",
    desc: "Quantidade de vagas concluídas (status 'Fechada') ao longo dos meses.",
    skeletonCount: 1
  });

  const data = await getJSONG("fechamentos", { signal });

  clearKPIs();
  const total = (data || []).reduce((acc, cur) => acc + Number(cur.total || 0), 0);
  injectKPIs([{ titulo: "Total finalizadas", valor: total }]);

  if (!data || !data.length) { clearChart(); return; }

  clearChart();
  const ctx = getCtx();
  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => d.mes),
      datasets: [{
        label: "Finalizadas",
        data: data.map(d => d.total),
        borderColor: "#2ecc71",
        borderWidth: 2,
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// =====================================================
// Roteador — exporta como loadGraficoGestor e ponte loadGrafico
// =====================================================
function loadGraficoGestor(tipo) {
  switch (tipo) {
    case "statusVagas": return renderStatusVagas();
    case "slaContratacao": return renderSLAContratacao();
    case "leadtimeDepto": return renderLeadtimeDepto();
    case "urgenciaCriticas": return renderUrgenciaCriticas();
    case "fechamentosMes": return renderFechamentosMes();
    default: return renderStatusVagas();
  }
}
window.loadGraficoGestor = loadGraficoGestor; // chamado pelo HTML
window.loadGrafico = loadGraficoGestor;       // compat com chamadas antigas

// INIT
document.addEventListener("DOMContentLoaded", () => loadGraficoGestor("statusVagas"));
