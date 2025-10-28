// =====================================================
// DASHBOARD GESTOR – INTEGRAÇÃO (com fallback igual ao RH)
// =====================================================

let chartInstance = null;
const API_BASE_G = "http://localhost:5000/dashboard/gestor";
const GESTOR_ID = 1;

// ---------- Helper Fetch ----------
async function getJSONGestor(endpoint) {
  try {
    const response = await fetch(`${API_BASE_G}${endpoint}`);
    if (!response.ok) throw new Error(`Erro ao buscar ${endpoint}`);
    return await response.json();
  } catch (e) {
    console.error("Erro API GESTOR:", e);
    return [];
  }
}

function clearChartIfAny() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
}

function setActiveSubmenuGestor(key) {
  document.querySelectorAll(".submenu a").forEach(a => a.classList.remove("active-submenu"));
  const target = Array.from(document.querySelectorAll(".submenu a"))
    .find(a => (a.getAttribute("onclick") || "").includes(key));
  if (target) target.classList.add("active-submenu");
}

function injectKPIGrid(containerEl, items, columns2 = false) {
  containerEl.innerHTML = "";
  if (!items || items.length === 0) return;
  if (columns2) containerEl.style.gridTemplateColumns = "repeat(2, minmax(280px, 1fr))";
  else containerEl.style.gridTemplateColumns = "";

  items.forEach(({ titulo, valor, sufixo }) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${titulo}</h3>
      <p><strong>${valor}${sufixo || ""}</strong></p>
    `;
    containerEl.appendChild(div);
  });
}

function getCanvasCtx() {
  return document.getElementById("graficoCanvas").getContext("2d");
}

// -------------------------------
// 1) Status Vagas
// -------------------------------
async function renderStatusVagas() {
  setActiveSubmenuGestor("statusVagas");
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Status das Vagas";
  desc.textContent = "Distribuição geral das vagas solicitadas.";

  const data = await getJSONGestor("/status");
  if (!data.length) {
    injectKPIGrid(document.getElementById("kpiContainer"), [{ titulo: "Total", valor: 0 }]);
    clearChartIfAny();
    return;
  }

  injectKPIGrid(document.getElementById("kpiContainer"), data.map(r => ({
    titulo: r.status,
    valor: r.total
  })));

  clearChartIfAny();
  const ctx = getCanvasCtx();
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: data.map(r => r.status),
      datasets: [{
        data: data.map(r => r.total),
        backgroundColor: ["#3498db","#9b59b6","#00c4cc","#2ecc71","#e74c3c"],
        borderColor: "#fff",
        borderWidth: 2,
        cutout: "60%"
      }]
    },
    options: { responsive: true, plugins:{ legend:{ position:"bottom" } } }
  });
}

// -------------------------------
// 2) SLA (Fechar x Contratar)
// -------------------------------
async function renderSLAContratacao() {
  setActiveSubmenuGestor("slaContratacao");
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "SLA de Contratação";
  desc.textContent = "Tempo médio para fechar e contratar.";

  const data = await getJSONGestor("/sla");
  const fecharMedio = data?.fechamento_medio?.fechar_medio_dias ?? 0;
  const contratarMedio = data?.contratacao_medio?.contratar_medio_dias ?? 0;

  injectKPIGrid(document.getElementById("kpiContainer"), [
    { titulo: "Fechamento Médio", valor: fecharMedio, sufixo: " dias" },
    { titulo: "Contratação Média", valor: contratarMedio, sufixo: " dias" }
  ], true);

  const meses = data.fechamento_mensal?.map(m => m.mes) || [];
  const fechar = data.fechamento_mensal?.map(m => m.fechar) || [];
  const contratar = data.contratacao_mensal?.map(m => m.contratar) || [];

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels: meses,
      datasets: [
        { label:"Fechar",data:fechar,borderColor:"#00c4cc",tension:0.3 },
        { label:"Contratar",data:contratar,borderColor:"#e67e22",tension:0.3 }
      ]
    },
    options:{ responsive:true, plugins:{legend:{position:"bottom"}} }
  });
}

// -------------------------------
// 3) Tempo por Departamento
// -------------------------------
async function renderLeadtimeDepto() {
  setActiveSubmenuGestor("leadtimeDepto");
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Lead Time por Departamento";
  desc.textContent = "Tempo médio em dias por área solicitante.";

  const data = await getJSONGestor("/departamento");
  if (!data.length) {
    clearChartIfAny();
    return;
  }

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d => d.departamento),
      datasets: [{
        label: "Dias",
        data: data.map(d => d.dias),
        backgroundColor: "#00c4cc",
        borderRadius: 8
      }]
    },
    options: { responsive:true, plugins:{legend:{display:false}} }
  });
}

// -------------------------------
// 4) Urgências
// -------------------------------
async function renderUrgenciaCriticas() {
  setActiveSubmenuGestor("urgenciaCriticas");
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Urgências";
  desc.textContent = "Distribuição por criticidade.";

  const data = await getJSONGestor("/urgencia");

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(d=>d.urgencia),
      datasets:[{ data:data.map(d=>d.total), backgroundColor:"#e67e22" }]
    },
    options:{ responsive:true }
  });
}

// -------------------------------
// 5) Fechamentos por mês
// -------------------------------
async function renderFechamentosMes() {
  setActiveSubmenuGestor("fechamentosMes");
  const title = document.querySelector("#graficoContent h2");
  const desc = document.querySelector("#graficoContent p");
  title.textContent = "Fechamentos por Mês";
  desc.textContent = "Quantidade de vagas concluídas ao longo dos meses.";

  const data = await getJSONGestor("/fechamentos");
  if (!data.length) {
    injectKPIGrid(document.getElementById("kpiContainer"), [{ titulo:"Total finalizadas", valor:0 }]);
    clearChartIfAny();
    return;
  }
  const total = data.reduce((a,b)=>a+b.total,0);
  injectKPIGrid(document.getElementById("kpiContainer"), [
    { titulo:"Total finalizadas", valor:total }
  ]);

  clearChartIfAny();
  const ctx = getCanvasCtx();

  chartInstance = new Chart(ctx, {
    type: "line",
    data:{
      labels:data.map(d=>d.mes),
      datasets:[{ data:data.map(d=>d.total), borderColor:"#2ecc71",tension:0.3 }]
    }
  });
}

// -------------------------------
// Roteador + Exposição Global
// -------------------------------
function loadGraficoGestor(tipo) {
  const canvasEl = document.getElementById("graficoCanvas");
  canvasEl.parentElement.style.minHeight = "350px";

  switch (tipo) {
    case "statusVagas": return renderStatusVagas();
    case "slaContratacao": return renderSLAContratacao();
    case "leadtimeDepto": return renderLeadtimeDepto();
    case "urgenciaCriticas": return renderUrgenciaCriticas();
    case "fechamentosMes": return renderFechamentosMes();
    default: return renderStatusVagas();
  }
}

// 🔥 ESSENCIAL para onclick funcionar no HTML
window.loadGraficoGestor = loadGraficoGestor;

// Inicialização automática
document.addEventListener("DOMContentLoaded", () => loadGraficoGestor("statusVagas"));
