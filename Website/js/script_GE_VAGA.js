// /Website/js/script_GE_VAGA.js

const API_BASE = "http://localhost:5000"; // mantenha seu back; aqui só espelhamos

// popula departamentos no select (espelhando a tabela departamentos)
async function carregarDepartamentos() {
  try {
    const sel = document.getElementById("departamentoVaga");
    sel.innerHTML = `<option value="">Carregando...</option>`;
    const resp = await fetch(`${API_BASE}/departamentos`);
    const deps = await resp.json();
    sel.innerHTML = `<option value="">Selecione</option>` + deps.map(d => `<option value="${d.id}">${d.nome}</option>`).join("");
  } catch (e) {
    console.error(e);
    document.getElementById("departamentoVaga").innerHTML = `<option value="">Erro ao carregar</option>`;
  }
}

function resetFormVaga() {
  document.getElementById("formVaga").reset();
}

function coletarPayloadVaga() {
  // espelhando exatamente os campos da tabela "vagas"
  const usuario = JSON.parse(sessionStorage.getItem('usuario')); // seu projeto já usa isso
  const usuario_id = usuario?.usuario?.id_usuario || usuario?.id_usuario || 1;

  return {
    titulo: document.getElementById("tituloVaga").value.trim(),
    departamento_id: Number(document.getElementById("departamentoVaga").value),
    usuario_id: usuario_id,
    localizacao: document.getElementById("localizacaoVaga").value,
    cidade: document.getElementById("cidadeVaga").value.trim() || null,
    tipo_contratacao: document.getElementById("tipoVaga").value,
    nivel_vaga: document.getElementById("nivelVaga").value,
    motivo: document.getElementById("motivoVaga").value,
    numero_vagas: Number(document.getElementById("numVagas").value) || 1,
    urgencia: document.getElementById("urgenciaVaga").value,
    projeto: document.getElementById("projetoVaga").value.trim() || null,
    prazo: document.getElementById("prazoVaga").value || null,
    justificativa: document.getElementById("justificativaVaga").value.trim(),
    skills: document.getElementById("skillsVaga").value.trim() || null,
    status: "Solicitada"
  };
}

async function enviarVagaAPI(payload) {
  // NÃO altero backend; apenas espelho a chamada
  const resp = await fetch(`${API_BASE}/vagas`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  if (!resp.ok) throw new Error(`Erro HTTP: ${resp.status}`);
  return await resp.json();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarDepartamentos();

  document.getElementById("formVaga").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = coletarPayloadVaga();
      // validações mínimas
      if (!payload.titulo || !payload.departamento_id || !payload.localizacao || !payload.tipo_contratacao || !payload.nivel_vaga || !payload.motivo || !payload.justificativa) {
        alert("Preencha todos os campos obrigatórios.");
        return;
      }
      await enviarVagaAPI(payload);
      alert("Vaga enviada para o RH com sucesso!");
      resetFormVaga();
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar a vaga agora.");
    }
  });
});
