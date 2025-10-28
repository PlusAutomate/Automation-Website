let vagas = [];
let id_usuario = sessionStorage.getItem('idUsuario')


async function carregarVagasGestor() {
  try {
    const resposta = await fetch(`http://localhost:5000/vagas/gestor/${id_usuario}`);
    if (!resposta.ok) throw new Error("Erro ao buscar vagas");
    vagas = await resposta.json();
    console.log("Vagas carregadas:", vagas);
    // aqui você pode chamar funções que dependem das vagas
  } catch (err) {
    console.error(err);
  }
}

let curriculos = [];

let vagaIdAtual = null;
let modalCandidatoId = null;
let modalVagaId = null;

// FUNÇÕES DE UTILIDADE E INTERFACE

function toggleUserMenu() {
  document.getElementById("userMenu").classList.toggle("show");
}

function abrirModalCustom(contentHtml) {
  document.getElementById('modalContent').innerHTML = contentHtml;
  document.getElementById('customModal').style.display = 'flex';
}
function fecharModalCustom() {
  document.getElementById('customModal').style.display = 'none';
  modalVagaId = null;
  modalCandidatoId = null;
}

async function getVagaMetrics(vagaId) {
  try {
    const response = await fetch(`http://localhost:5000/processo-seletivo/vaga/${vagaId}`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const candidatos = await response.json();

    const ativos = candidatos.filter(c => ["Novo", "Triagem", "Entrevista"].includes(c.status));
    const novos = ativos.filter(c => c.status === "Novo").length;
    console.log("Ativos: ", novos)
    const emContato = ativos.filter(c => ["Entrevista", "Triagem"].includes(c.status)).length;
    console.log("Em contato: ", emContato)
    const totalContratados = candidatos.filter(c => c.status === "Contratado").length;

    return { totalAtivos: ativos.length, novos, emContato, totalContratados };
  } catch (erro) {
    console.error("Erro ao buscar métricas da vaga:", erro);
    return { totalAtivos: 0, novos: 0, emContato: 0, totalContratados: 0 };
  }
}

function filterCards(containerId, inputId, dataAttr) {
  const val = (document.getElementById(inputId)?.value || "").toLowerCase();
  document.querySelectorAll(`#${containerId} .card`).forEach(c => {
    let textToSearch = c.innerText.toLowerCase();

    if (dataAttr) {
      const dataVal = c.getAttribute(dataAttr).toLowerCase();
      c.style.display = (!val || dataVal === val || dataVal.includes(val)) ? "" : "none";
    } else {
      c.style.display = textToSearch.includes(val) ? "" : "none";
    }
  });
}
function filterCardByStatus(containerId = 'vagaCard', dataAttribute = 'data-status') {
  const val = document.getElementById("filterVagas")?.value || "";
  document.querySelectorAll(`#${containerId} .card`).forEach(c => {
    const status = c.getAttribute(dataAttribute);
    c.style.display = !val || status === val ? "" : "none";
  });
}

async function loadContent(page) {
  const mainContent = document.getElementById("mainContent");
  fecharModalCustom();

  try {
    const resposta = await fetch(`http://localhost:5000/vagas/gestor/${id_usuario}`);
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    vagas = await resposta.json();
    console.log("Vagas carregadas: ", vagas);
  } catch (erro) {
    console.error("Erro ao buscar vagas:", erro);
    mainContent.innerHTML = `<div style="padding:20px; color:red;">Erro ao carregar vagas. Verifique o servidor.</div>`;
    return;
  }

  try {
    const resposta = await fetch(`http://localhost:5000/processo-seletivo/gestor/${id_usuario}`);
    if (!resposta.ok) throw new Error("Erro ao buscar curriculos");
    curriculos = await resposta.json();
    console.log("Curriculos carregados: ", curriculos);
  } catch (err) {
    console.error(err)
  }

  // const vagasAbertas = vagas.filter(v => v.status === 'Aberta');
  let html = "";

  if (page === "listarVagas") {
    let cardsHTML = "";
    for (const v of vagas) {
      const metrics = await getVagaMetrics(v.id_vaga);
      const temCandidatos = metrics.totalAtivos > 0 || metrics.totalContratados > 0;

      cardsHTML += `
        <div class="card status-${v.status.toLowerCase().replace(/ /g, '-')}" data-status="${v.status}">
          <div>
            <h3>${v.titulo}</h3>
            <p><strong>Status:</strong> ${v.status}</p>
            <p><strong>Descrição:</strong> ${v.descricao || "Sem descrição"}</p>
            <p><strong>Data de criação:</strong> ${new Date(v.data_criacao).toLocaleString()}</p>
            ${v.status === 'Aberta' ? `<hr style="margin: 5px 0;">
              <p style="font-size: 13px; color: #2c3e50;">
                <strong style="color: ${metrics.novos > 0 ? '#dc3545' : '#3498db'};">Novos CVs: ${metrics.novos}</strong> | 
                <strong style="color: #9b59b6;">Em Contato/Entrevista: ${metrics.emContato}</strong>
                ${metrics.totalContratados > 0 ? `| <strong style="color: #28a745;">CONTRATADOS: ${metrics.totalContratados}</strong>` : ''}
              </p>` : ""}
          </div>
          <div class="action-icons">
            <img title="Ver detalhes da vaga" onclick="verDetalhesVagaGestor(${v.id_vaga})" class="icon-cards" src="../img/inspecionar-icon.png" alt="">
            ${v.status === 'Aberta' && temCandidatos ?
          `<button class="btn-ghost" title="Ver Candidatos" style="background:#00c4cc; color:white; border-color:#007bff; margin-left: 10px;" onclick="listarCandidatosPorVaga('${v.titulo}', ${v.id_vaga})">
                Candidatos (${metrics.totalAtivos + metrics.totalContratados})
              </button>` : ''}
          </div>
        </div>
      `;
    }

    html = `
      <div class="crud-container">
        <div class="breadcrumb">Vagas > Listar</div>
        <h2>Listar Vagas</h2>
        <div class="filter-box">
          <input type="text" id="searchVagas" placeholder="Buscar por Título..." onkeyup="filterCards('vagaCard','searchVagas')">
          <select id="filterVagas" onchange="filterCardByStatus()">
            <option value="">Todos os Status</option>
            <option value="Aberta">Abertas</option>
            <option value="Em Análise">Em Análise</option>
            <option value="Fechada">Fechada</option>
          </select>
        </div>
        <div class="card-grid" id="vagaCard">
          ${cardsHTML}
        </div>
      </div>
    `;
  }

  if (page === "curriculos") {
    const candidatosTriagem = curriculos.filter(c => c.status === "Novo" || c.status === "Triagem" || c.status === "Entrevista" || c.status === "Rejeitado" || c.status === "Contratado");

    html = `
      <div class="crud-container">
        <div class="breadcrumb">Candidatos > Curriculos</div>
        <h2>Triagem de Currículos</h2>
        <div class="filter-box">
          <input type="text" id="searchCurriculos" placeholder="Buscar Candidato/Vaga..." onkeyup="filterCards('triagemCardGrid','searchCurriculos')">
          <select id="filterStatusCurriculo" onchange="filterCards('triagemCardGrid','filterStatusCurriculo', 'data-status')">
            <option value="">Todos</option>
            <option value="Novo">Novo</option>
            <option value="Triagem">Triagem</option>
            <option value="Entrevista">Entrevista</option>
            <option value="Rejeitado">Rejeitado</option>
            <option value="Contratado">Contratado</option>
          </select>
        </div>

        <div class="card-grid" id="triagemCardGrid">
          ${candidatosTriagem.map(c => `
            <div class="card status-${c.status.toLowerCase().replace(/ /g, '-')}" data-status="${c.status}">
              <div>
                <h3>${c.nome_candidato}</h3>
                <p><strong>Vaga:</strong> ${c.titulo_vaga || "N/A"}</p>
                <p><strong>Status:</strong> ${c.status}</p>
                <p><strong>Contato:</strong> ${c.email_candidato}</p>
              </div>
              <div class="action-icons">
                  <img title="Exibir curriculo" onclick="exibirCurriculo(${c.id_candidato})" class="icon-cards" src="../img/inspecionar-icon.png" alt=">
                  <img title="Excluir candidato" onclick="deletarCurriculo(${c.id_candidato})" class="icon-cards" src="../img/lixo-icon.png" alt="">
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  mainContent.innerHTML = html;
}


async function exibirCurriculo(id_candidato) {
  try {
    // Busca os dados da vaga direto do backend
    const resposta = await fetch(`http://localhost:5000/candidatos/${id_candidato}`);
    if (!resposta.ok) throw new Error("Erro ao buscar detalhes da vaga");

    const c = await resposta.json();
    console.log("Resposta: ", c)
    const html = `
      <div class="crud-container">
        <div class="breadcrumb">Candidatos > Curriculos</div>
        <h2>Detalhes Candidato (${c.nome})</h2>
        <div class="detail-form-grid">

          <div class="field-group">
            <label class="field-label">Email: </label>
            <input class="field-value read-only" value="${c.email ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Telefone: </label>
            <input class="field-value read-only" value="${c.telefone ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Origem: </label>
            <input class="field-value read-only" value="${c.origem ?? ''}" disabled>
          </div>

          <div class="field-group full-width">
            <label class="field-label">Requisitos Técnicos</label>
            <textarea class="field-value read-only" rows="3" disabled>${c.skill ?? ''}</textarea>
          </div>

        </div>

        <div style="margin-top:20px;">
          <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar</button>
        </div>
      </div>`;

    document.getElementById("mainContent").innerHTML = html;

  } catch (erro) {
    console.error("Erro ao carregar detalhes da vaga:", erro);
    document.getElementById("mainContent").innerHTML = `
      <div class="crud-container">
        <h2>Erro ao carregar detalhes</h2>
        <p>${erro.message}</p>
        <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar</button>
      </div>`;
  }
}

async function verDetalhesVagaGestor(id_vaga) {
  try {
    // Busca os dados da vaga direto do backend
    const resposta = await fetch(`http://localhost:5000/vagas/${id_vaga}`);
    if (!resposta.ok) throw new Error("Erro ao buscar detalhes da vaga");

    const v = await resposta.json();

    const html = `
      <div class="crud-container">
        <div class="breadcrumb">Vagas > <a onclick="loadContent('listarVagas')">Listar</a> > Especificações da vaga</div>
        <h2>Especificações da Vaga (${v.titulo})</h2>
        <div class="detail-form-grid">
          <p class="descricao" style="color:red;">Para editar campo, entrar em contato com o gestor</p>

          <div class="field-group">
            <label class="field-label">Gestor Requisitante</label>
            <input class="field-value read-only" value="${v.id_usuario ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Status Atual</label>
            <input class="field-value read-only" value="${v.status ?? ''}" disabled>
          </div>

          <div class="field-group full-width">
            <label class="field-label">Requisitos Técnicos</label>
            <textarea class="field-value read-only" rows="3" disabled>${v.skills ?? ''}</textarea>
          </div>

          <div class="field-group full-width">
            <label class="field-label">Descrição Resumida</label>
            <textarea class="field-value read-only" rows="4" disabled>${v.descricao ?? ''}</textarea>
          </div>

          <div class="field-group">
            <label class="field-label">Título</label>
            <input class="field-value read-only" value="${v.titulo ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Departamento</label>
            <input class="field-value read-only" value="${v.departamento_nome ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Localização</label>
            <input class="field-value read-only" value="${v.localizacao ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Cidade</label>
            <input class="field-value read-only" value="${v.cidade ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Tipo de Contratação</label>
            <input class="field-value read-only" value="${v.tipo_contratacao ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Nível</label>
            <input class="field-value read-only" value="${v.nivel_vaga ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Motivo</label>
            <input class="field-value read-only" value="${v.motivo ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Nº Vagas</label>
            <input type="number" class="field-value read-only" value="${v.numero_vagas ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Urgência</label>
            <input class="field-value read-only" value="${v.urgencia ?? ''}" disabled>
          </div>

          <div class="field-group">
            <label class="field-label">Prazo</label>
            <input type="date" class="field-value read-only" value="${v.prazo ?? ''}" disabled>
          </div>

          <div class="field-group full-width">
            <label class="field-label">Justificativa</label>
            <textarea class="field-value read-only" rows="4" disabled>${v.descricao ?? ''}</textarea>
          </div>
        </div>

        <div style="margin-top:20px;">
          <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar</button>
        </div>
      </div>`;

    document.getElementById("mainContent").innerHTML = html;

  } catch (erro) {
    console.error("Erro ao carregar detalhes da vaga:", erro);
    document.getElementById("mainContent").innerHTML = `
      <div class="crud-container">
        <h2>Erro ao carregar detalhes</h2>
        <p>${erro.message}</p>
        <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar</button>
      </div>`;
  }
}



// FUNÇÕES DE VAGA, CANDIDATO E MODAIS

async function listarCandidatosPorVaga(tituloVaga, idVaga) {
  vagaIdAtual = idVaga;

  try {
    // Faz a requisição ao endpoint Flask
    const resposta = await fetch(`http://localhost:5000/processo-seletivo/vaga/${idVaga}`);
    if (!resposta.ok) throw new Error("Erro ao buscar candidatos da vaga");

    const candidatosDaVaga = await resposta.json();
    console.log("Candidatos da vaga:", candidatosDaVaga);

    // Gera o HTML de cada candidato
    let htmlCandidatos = candidatosDaVaga.map(c => {
      const statusClass = c.status ? c.status.toLowerCase().replace(/ /g, '-') : 'desconhecido';

      return `
        <div class="card status-${statusClass}" data-status="${c.status}">
          <div>
            <h3>${c.nome}</h3>
            <p><strong>Status:</strong> ${c.status}</p>
            <p><strong>Contato:</strong> ${c.email}</p>
            ${c.telefone ? `<p><strong>Telefone:</strong> ${c.telefone}</p>` : ""}
          </div>
          <div class="action-icons" style="justify-content: flex-end;">
            ${c.status !== 'Contratado' ?
          `<button class="btn-ghost" title="Mudar Status"
                  style="background:#00c4cc; color:white; border-color:#5bc0de;"
                  onclick="abrirModalMudarStatus(${c.id_candidato}, '${c.nome}', '${c.status}', '${tituloVaga}', ${c.id_vaga})">
                  Status
              </button>`
          : ''}
          </div>
        </div>
      `;
    }).join("");

    // Monta a tela
    const html = `
      <div class="crud-container">
        <div class="breadcrumb">
          Vagas > <a onclick="loadContent('listarVagas')">Listar Vagas</a> > Candidatos: ${tituloVaga}
        </div>
        <h2>Candidatos Atribuídos: ${tituloVaga}</h2>
        <p>Lista de candidatos vinculados a esta vaga. Total: ${candidatosDaVaga.length}</p>

        <div class="card-grid" id="candidatosVagaGrid" style="margin-top: 20px;">
          ${htmlCandidatos || "<p>Nenhum candidato encontrado.</p>"}
        </div>

        <div style="margin-top:20px;">
          <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar para Vagas</button>
        </div>
      </div>
    `;

    document.getElementById("mainContent").innerHTML = html;

  } catch (err) {
    console.error("Erro ao listar candidatos por vaga:", err);
    document.getElementById("mainContent").innerHTML = `
      <div style="padding:20px; color:red;">Erro ao carregar candidatos da vaga.</div>
    `;
  }
}





function abrirModalMudarStatus(idCandidato, nomeCandidato, statusAtual, tituloVaga, idVaga) {
  modalCandidatoId = idCandidato;
  vagaIdAtual = idVaga;

  // opções compatíveis com o ENUM do banco
  let opcoes = [
    { value: "Triagem", label: "Triagem (Em análise inicial)" },
    { value: "Entrevista", label: "Entrevista (Fase Técnica)" },
    { value: "Aprovado", label: "Aprovado (Aguardando Contratação)" },
    { value: "Contratado", label: "Contratado (Fechar Vaga)" },
    { value: "Rejeitado", label: "Rejeitado (Desclassificado)" }
  ].filter(opt => opt.value !== statusAtual);

  const html = `
    <h3>Atualizar Status de: ${nomeCandidato}</h3>
    <p>Vaga: <strong>${tituloVaga}</strong> | Status Atual: <strong>${statusAtual}</strong></p>

    <label class="field-label" style="margin-top:10px;">Novo Status no Pipeline:</label>
    <select id="selectNovoStatus" class="field-value">
      ${opcoes.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
    </select>

    <div class="field-group full-width" style="margin-top: 15px;">
      <label class="field-label">Observações (Opcional)</label>
      <textarea id="modalObservacoes" class="field-value" rows="2"></textarea>
    </div>

    <div style="margin-top:15px; text-align:right;">
      <button class="btn-ghost" onclick="fecharModalCustom()">Cancelar</button>
      <button class="btn-ghost" style="background:#00c4cc; color:white; border-color:#5bc0de;" onclick="confirmarMudarStatus(${idCandidato}, ${idVaga}, '${tituloVaga}')">Confirmar Mudança</button>
    </div>
  `;

  abrirModalCustom(html);
}

async function confirmarMudarStatus(idCandidato, idVaga, tituloVaga) {
  const novoStatus = document.getElementById("selectNovoStatus").value;
  const observacoes = document.getElementById("modalObservacoes").value;

  try {
    const resposta = await fetch(`http://localhost:5000/processo-seletivo/${idVaga}/${idCandidato}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus, observacoes })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.erro || "Erro ao atualizar status");
    }

    console.log(`Status atualizado para "${novoStatus}" com sucesso!`);
    fecharModalCustom();

    // recarrega a lista de candidatos dessa vaga
    listarCandidatosPorVaga(tituloVaga, idVaga);

  } catch (erro) {
    console.error("Erro ao atualizar status:", erro);
    alert("Falha ao atualizar o status. Tente novamente.");
  }
}

// function confirmarMudarStatus(tituloVaga) {
//   const novoStatus = document.getElementById('selectNovoStatus').value;
//   const c = curriculos.find(x => x.id === modalCandidatoId);
//   let v = vagas.find(x => x.titulo === tituloVaga);

//   if (c) {
//     c.status = novoStatus;

//     if (novoStatus === "Contratado") {
//       if (v) v.status = "Fechada";
//       alert(`Sucesso! Candidato ${c.nome} contratado. A vaga '${tituloVaga}' foi marcada como Fechada.`);
//     } else if (novoStatus === "Reprovado") {
//       alert(`Candidato ${c.nome} reprovado. (TODO: Mover dados detalhados para o Banco de Talentos).`);
//     } else {
//       alert(`Status de ${c.nome} alterado para: ${novoStatus}.`);
//     }
//   }

//   fecharModalCustom();

//   // Adiciona uma verificação para garantir que a vaga foi encontrada antes de chamar a listagem
//   if (v) {
//     // Volta para a lista de candidatos da vaga atualizada
//     listarCandidatosPorVaga(tituloVaga, v.id);
//   } else {
//     // Se não encontrar a vaga, volta para a lista principal
//     loadContent('listarVagas');
//   }
// }

// INICIALIZAÇÃO DA PÁGINA (EXECUTA NO CARREGAMENTO)

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".submenu.open").forEach(s => {
        if (s !== btn.nextElementSibling) s.classList.remove("open");
      });
      const submenu = btn.nextElementSibling;
      submenu.classList.toggle("open");
    });
  });
});