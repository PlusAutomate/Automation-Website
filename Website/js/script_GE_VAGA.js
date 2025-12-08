// ./js/script_GE_VAGA.js

const API_BASE = "http://98.95.103.3:5000"; // mantenha seu back; aqui só espelhamos

// popula departamentos no select (espelhando a tabela departamentos)
async function carregarDepartamentos() {
  try {
    const sel = document.getElementById("departamentoVaga");
    sel.innerHTML = `<option value="">Carregando...</option>`;
    const resp = await fetch(`${API_BASE}/departamentos`);
    const deps = await resp.json();
    sel.innerHTML = `<option value="">Selecione</option>` + deps.map(d => `<option value="${d.id_departamento}">${d.nome}</option>`).join("");
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

async function criar_vaga() {
  // Monta o objeto com os dados do formulário
  const vaga = {
    titulo: document.getElementById("tituloVaga").value.trim(),
    descricao: document.getElementById("justificativaVaga").value.trim(),
    status: "Em Análise",
    id_usuario: 1, // TODO: ajustar para o ID real do gestor logado
    id_departamento: parseInt(document.getElementById("departamentoVaga").value),
    localizacao: document.getElementById("localizacaoVaga").value,
    tipo_contratacao: document.getElementById("tipoVaga").value,
    nivel_vaga: document.getElementById("nivelVaga").value,
    motivo: document.getElementById("motivoVaga").value,
    numero_vagas: parseInt(document.getElementById("numVagas").value),
    urgencia: document.getElementById("urgenciaVaga").value,
    projeto: document.getElementById("projetoVaga").value.trim() || null,
    prazo: document.getElementById("prazoVaga").value || null,
    skills: document.getElementById("skillsVaga").value.trim() || null
  };

  try {
    const resposta = await fetch("http://98.95.103.3:5000/vagas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(vaga)
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new Error(`Erro ao criar vaga: ${erro}`);
    }

    const dados = await resposta.json();
    alert("✅ " + dados.mensagem);

  } catch (erro) {
    console.error(erro);
    alert("❌ Ocorreu um erro ao enviar a solicitação. Verifique os dados e tente novamente.");
  }
}

async function enviarVagaAPI(payload) {
  // NÃO altero backend; apenas espelho a chamada
  const resp = await fetch(`${API_BASE}/vagas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
