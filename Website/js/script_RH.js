
// VARIÁVEIS GLOBAIS (Simulação)

// let vagas = [
//   { id: 1, titulo: "Dev Frontend", status: "Aberta", descricao: "Atuação com React, SPA, REST.", gestor: "Maria", salarioMax: "R$ 8.000", beneficios: "VT, VR (R$ 40), Plano Saúde", responsavelRS: "Gustavo (RH)", requisitos: "React 3 anos, Node.js, Inglês Avançado" },
//   { id: 2, titulo: "Analista RH", status: "Em análise", descricao: "Pipeline de recrutamento e seleção.", gestor: "João", salarioMax: "N/A", beneficios: "N/A", responsavelRS: "N/A", requisitos: "Experiência em triagem, Conhecimento CLT" },
//   { id: 3, titulo: "Designer UI/UX", status: "Fechada", descricao: "Pesquisa, prototipação e UI kits.", gestor: "Ana", salarioMax: "R$ 6.000", beneficios: "VT, VR (R$ 35)", responsavelRS: "Júlia (RH)", requisitos: "Figma, Adobe XD, Portfólio" }
// ];

let vagas = []

async function carregarVagas() {
  try {
    const resposta = await fetch("http://localhost:5000/vagas");
    if (!resposta.ok) throw new Error("Erro ao buscar vagas");
    vagas = await resposta.json();
    console.log("Vagas carregadas:", vagas);
    // aqui você pode chamar funções que dependem das vagas
  } catch (err) {
    console.error(err);
  }
}

let curriculos = [
  { id: 1, nome: "Maria Silva", vaga: "Dev Frontend", status: "Contratado", email: "maria@email.com", telefone: "(11) 98765-4321", cvUrl: "link_cv_maria.pdf", cvDetalhe: { skills: ["React", "Node.js", "JavaScript", "UX/UI"], analise: "Maria possui forte experiência com React e Node.js. (CONTRATADA, 01/09)" } },
  { id: 2, nome: "João Souza", vaga: "Analista RH", status: "Entrevista Técnica", email: "joao@email.com", telefone: "(11) 99999-8888", cvUrl: "link_cv_joao.pdf", cvDetalhe: { skills: ["Recrutamento", "Onboarding", "Gestão de Pessoas"], analise: "João tem sólida experiência em recrutamento. Próxima etapa: Entrevista Técnica." } },
  { id: 3, nome: "Pedro Rocha", vaga: "Dev Frontend", status: "Em Contato", email: "pedro@email.com", telefone: "(11) 97777-6666", cvUrl: "link_cv_pedro.pdf", cvDetalhe: { skills: ["HTML", "CSS", "Angular"], analise: "Pedro possui experiência com desenvolvimento web, mas sua principal habilidade é Angular, não React. Baixa aderência aos requisitos técnicos da vaga." } },
  { id: 4, nome: "Ana Costa", vaga: "Dev Frontend", status: "Novo", email: "ana@email.com", telefone: "(11) 95555-4444", cvUrl: "link_cv_ana.pdf", cvDetalhe: { skills: ["React", "Redux", "TypeScript", "Node.js"], analise: "Ana é uma candidata ideal, com experiência em tecnologias adicionais. Atribuir entrevista urgente." } }
];

let talentos = [
  { id: 1, nome: "Carlos Oliveira", area: "TI", contato: "Não", ultimaAtualizacao: "2024-05-10", origem: "Triagem", cvDetalhe: { skills: ["Python", "Machine Learning", "Data Analysis"], resumo: "Especialista em dados, ideal para futuras vagas de TI focadas em ciência de dados." } },
  { id: 2, nome: "Mariana Alves", area: "Design", contato: "Não", ultimaAtualizacao: "2024-06-21", origem: "Triagem", cvDetalhe: { skills: ["Figma", "Design System", "Prototipação"], resumo: "Projetista de UI/UX com foco em design systems. Ótima para vagas de senioridade." } }
];

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

function uploadCurriculo() {
  alert("Simulação de Upload Rápido realizado. Currículo em 'Triagem'.");
  loadContent('triagem');
}

// FUNÇÕES DE NAVEGAÇÃO E CARREGAMENTO DE CONTEÚDO

async function getVagaMetrics(vagaId) {
  try {
    const response = await fetch(`http://localhost:5000/processo-seletivo/vaga/${vagaId}`);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const candidatos = await response.json();

    const ativos = candidatos.filter(c => ["Novo", "Em Contato", "Entrevista Técnica"].includes(c.status));
    const novos = ativos.filter(c => c.status === "Novo").length;
    const emContato = ativos.filter(c => ["Em Contato", "Entrevista Técnica"].includes(c.status)).length;
    const totalContratados = candidatos.filter(c => c.status === "Contratado").length;

    return { totalAtivos: ativos.length, novos, emContato, totalContratados };
  } catch (erro) {
    console.error("Erro ao buscar métricas da vaga:", erro);
    return { totalAtivos: 0, novos: 0, emContato: 0, totalContratados: 0 };
  }
}

async function aprovarVaga(id) {
  try {
    const resposta = await fetch(`http://localhost:5000/vagas/${id}/aprovar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await resposta.json();

    if (resposta.ok) {
      alert(data.mensagem);  // ou notificação mais elegante
      // Atualiza a lista de vagas na tela
      vagas = vagas.map(v => v.id_vaga === id ? { ...v, status: "Aberta" } : v);
      loadContent("aprovarVagas"); // <-- substituído renderPage
    } else {
      alert(data.erro || "Erro ao aprovar a vaga.");
    }
  } catch (error) {
    console.error(error);
    alert("Erro de conexão com o servidor.");
  }
}



async function loadContent(page) {
  const mainContent = document.getElementById("mainContent");
  fecharModalCustom();

  try {
    const resposta = await fetch("http://localhost:5000/vagas");
    if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);
    vagas = await resposta.json();
  } catch (erro) {
    console.error("Erro ao buscar vagas:", erro);
    mainContent.innerHTML = `<div style="padding:20px; color:red;">Erro ao carregar vagas. Verifique o servidor.</div>`;
    return;
  }

  // Filtros derivados
  const vagasAbertas = vagas.filter(v => v.status === 'Aberta');
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
            <img title="Editar detalhes RH" onclick="editarDetalhesVagaRH(${v.id_vaga})" class="icon-cards" src="../img/edit-icon.png" alt="">
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
            <option value="Fechada">Fechadas</option>
          </select>
        </div>
        <div class="card-grid" id="vagaCard">
          ${cardsHTML}
        </div>
      </div>
    `;
  }

  if (page === "aprovarVagas") {
    vagas.filter
    const pendentes = vagas.filter(v => v.status === "Em Análise");
    html = `
      <div class="crud-container">
        <div class="breadcrumb">Vagas > Aprovar</div>
        <h2>Aprovar Vagas</h2>
        <p class="descricao">Visualize as vagas pendentes e aprove ou reprove.</p>
        <div class="card-grid" id="aprovarCardGrid">
          ${pendentes.length ? pendentes.map(v => `
            <div class="card status-analise">
              <div>
                <h3>${v.titulo}</h3>
                <p><strong>Gestor:</strong> ${v.gestor || "N/A"}</p>
                <p class="descricao">Requisitos: ${v.requisitos || "Não especificado."}</p>
              </div>
              <div class="action-icons" style="justify-content: flex-end;">
                <button class="btn-ghost icon-approve" style="background:#00c4cc; color:white; border-color:#28a745;" onclick="aprovarVaga(${v.id_vaga})">Aprovar</button>
                <button class="icon-reject" title="Reprovar" onclick="abrirModalReprovacao(${v.id_vaga})">✖︎</button>
              </div>
            </div>
          `).join("") : `<div style="text-align:center; padding:20px;">Nenhuma vaga pendente de aprovação.</div>`}
        </div>
      </div>`;
  }

  if (page === "triagem") {
    const candidatosTriagem = curriculos.filter(c => c.status === "Novo" || c.status === "Em Contato");

    html = `
      <div class="crud-container">
        <div class="breadcrumb">Candidatos > Triagem</div>
        <h2>Triagem de Currículos</h2>
        <div class="filter-box">
          <input type="text" id="searchCurriculos" placeholder="Buscar Candidato/Vaga..." onkeyup="filterCards('triagemCardGrid','searchCurriculos')">
          <select id="filterStatusCurriculo" onchange="filterCards('triagemCardGrid','filterStatusCurriculo', 'data-status')">
            <option value="">Todos</option>
            <option value="Novo">Novo (Para Triar)</option>
            <option value="Em Contato">Em Contato (Ativo)</option>
          </select>
        </div>

        <div class="card-grid" id="triagemCardGrid">
          ${candidatosTriagem.map(c => `
            <div class="card status-${c.status.toLowerCase().replace(/ /g, '-')}" data-status="${c.status}">
              <div>
                <h3>${c.nome}</h3>
                <p><strong>Vaga:</strong> ${c.vaga || "N/A"}</p>
                <p><strong>Status:</strong> ${c.status}</p>
                <p><strong>Contato:</strong> ${c.email}</p>
              </div>
              <div class="action-icons">
                  <img title="Atribuir candidato"  onclick="abrirModalAtribuicao(${c.id}, '${c.nome}')" class="icon-cards" src="../img/atribuir-icon.png" alt="">
                  <img title="Exibir curriculo" onclick="exibirCurriculo(${c.id})" class="icon-cards" src="../img/inspecionar-icon.png" alt=">
                  <img title="Mover para talentos"  onclick="moverParaTalentos(${c.id})" class="icon-cards" src="../img/mover-icon.png" alt="">
                  <img title="Excluir candidato" onclick="deletarCurriculo(${c.id})" class="icon-cards" src="../img/lixo-icon.png" alt="">
              </div>
            </div>
          `).join("")}
        </div>
      </div>`;
  }

  if (page === "uploadCurriculos") {
    html = `
      <div class="crud-container">
        <div class="breadcrumb">Candidatos > Upload Rápido</div>
        <h2>Upload de Currículos</h2>
        <p class="descricao">Suba currículos de fontes externas e atribua a uma vaga.</p>
        <div class="detail-form-grid">
          <div class="field-group"><label class="field-label">Nome do Candidato</label><input type="text" id="nomeCandidato" class="field-value"></div>
          <div class="field-group"><label class="field-label">Email do Candidato</label><input type="email" id="emailCandidato" class="field-value"></div>
          <div class="field-group"><label class="field-label">Telefone</label><input type="tel" id="telefoneCandidato" class="field-value"></div>
          <div class="field-group"><label class="field-label">Vaga de Atribuição</label>
            <select id="vagaCandidato" class="field-value">
              <option value="">(Manter em Triagem - Status: Novo)</option>
              ${vagasAbertas.map(v => `<option value="${v.titulo}">${v.titulo}</option>`).join("")}
            </select>
          </div>
          <div class="field-group full-width"><label class="field-label">Arquivo CV (.pdf)</label><input type="file" id="myFile" name="filename" style="margin-top:5px; margin-bottom:15px;"></div>
        </div>
        <button class="btn-ghost" onclick="uploadCurriculo()" style="background:#00c4cc; color:white;">Subir e Atribuir</button>
      </div>`;
  }

  if (page === "listaTalentos") {
    html = `
      <div class="crud-container">
        <div class="breadcrumb">Banco de Talento > Listar</div>
        <h2>Banco de Talentos</h2>
        <div class="filter-box">
          <input type="text" id="searchTalentos" placeholder="Buscar por Nome/Área..." onkeyup="filterCards('talentoCardGrid','searchTalentos')">
          <select id="filterTalentosArea" onchange="filterCardByStatus('talentoCardGrid','data-area')">
            <option value="">Todas Áreas</option>
            <option value="TI">TI</option>
            <option value="Design">Design</option>
          </select>
        </div>
        <div class="card-grid" id="talentoCardGrid">
          ${talentos.length ? talentos.map(t => `
            <div class="card" data-area="${t.area}">
              <div>
                <h3>${t.nome}</h3>
                <p><strong>Área:</strong> ${t.area}</p>
                <p><strong>Última Atualização:</strong> ${t.ultimaAtualizacao}</p>
                <p><strong>Origem:</strong> ${t.origem}</p>
              </div>
              <div class="action-icons">
               <img title="Exibir curriculo" onclick="exibirTalento(${t.id})" class="icon-cards" src="../img/inspecionar-icon.png" alt=">
               <img title="Excluir candidato" onclick="deletarTalento(${t.id})" class="icon-cards" src="../img/lixo-icon.png" alt="">
              </div>
            </div>
          `).join("") : `<div style="text-align:center; padding:20px;">Nenhum talento no banco.</div>`}
        </div>
      </div>`;
  }

  mainContent.innerHTML = html;
}

// FUNÇÕES DE VAGA, CANDIDATO E MODAIS

function listarCandidatosPorVaga(tituloVaga, idVaga) {
  vagaIdAtual = idVaga;
  const candidatosDaVaga = curriculos.filter(c => c.vaga === tituloVaga);

  let htmlCandidatos = candidatosDaVaga.map(c => {
    const statusClass = c.status.toLowerCase().replace(/ /g, '-');

    return `
            <div class="card status-${statusClass}" data-status="${c.status}">
                <div>
                    <h3>${c.nome}</h3>
                    <p><strong>Status:</strong> ${c.status}</p>
                    <p><strong>Contato:</strong> ${c.email}</p>
                </div>
                <div class="action-icons" style="justify-content: flex-end;">
                    ${c.status !== 'Contratado' ?
        `<button class="btn-ghost" title="Mudar Status" style="background:#00c4cc; color:white; border-color:#5bc0de;" onclick="abrirModalMudarStatus(${c.id}, '${c.nome}', '${c.status}', '${tituloVaga}')">Status</button>`
        : ''}
                </div>
            </div>
        `;
  }).join("");

  const html = `
      <div class="crud-container">
        <div class="breadcrumb">Vagas > <a onclick="loadContent('listarVagas')">Listar Vagas</a> > Candidatos: ${tituloVaga}</div>
        <h2>Candidatos Atribuídos: ${tituloVaga}</h2>
        <p>Lista de currículos para esta vaga. Total: ${candidatosDaVaga.length}</p>
        
        <div class="card-grid" id="candidatosVagaGrid" style="margin-top: 20px;">
            ${htmlCandidatos}
        </div>
        
        <div style="margin-top:20px;">
            <button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar para Vagas</button>
        </div>
      </div>`;
  document.getElementById("mainContent").innerHTML = html;
}

function abrirModalMudarStatus(idCandidato, nomeCandidato, statusAtual, tituloVaga) {
  modalCandidatoId = idCandidato;
  const c = curriculos.find(x => x.id === idCandidato);

  let opcoes = [
    { value: "Em Contato", label: "Em Contato (Triagem Inicial)" },
    { value: "Entrevista Técnica", label: "Entrevista Técnica (Próxima Fase)" },
    { value: "Reprovado", label: "Reprovado (Desclassificar)" },
    { value: "Contratado", label: "Contratado (Fechar Vaga)" }
  ].filter(opt => opt.value !== statusAtual);

  const html = `
        <h3>Atualizar Status de: ${nomeCandidato}</h3>
        <p>Vaga: <strong>${tituloVaga}</strong> | Status Atual: <strong>${statusAtual}</strong></p>
        <label class="field-label" style="margin-top:10px;">Novo Status no Pipeline:</label>
        <select id="selectNovoStatus" class="field-value">
          ${opcoes.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")}
        </select>
        ${c.status === 'Reprovado' || c.status === 'Contratado' ? '' : `
          <div class="field-group full-width" style="margin-top: 15px;">
            <label class="field-label">Observações (Opcional)</label>
            <textarea id="modalObservacoes" class="field-value" rows="2"></textarea>
          </div>
        `}
        <div style="margin-top:15px; text-align:right;">
            <button class="btn-ghost" onclick="fecharModalCustom()">Cancelar</button>
            <button class="btn-ghost" style="background:#00c4cc; color:white; border-color:#5bc0de;" onclick="confirmarMudarStatus('${tituloVaga}')">Confirmar Mudança</button>
        </div>`;
  abrirModalCustom(html);
}

function confirmarMudarStatus(tituloVaga) {
  const novoStatus = document.getElementById('selectNovoStatus').value;
  const c = curriculos.find(x => x.id === modalCandidatoId);
  let v = vagas.find(x => x.titulo === tituloVaga);

  if (c) {
    c.status = novoStatus;

    if (novoStatus === "Contratado") {
      if (v) v.status = "Fechada";
      alert(`Sucesso! Candidato ${c.nome} contratado. A vaga '${tituloVaga}' foi marcada como Fechada.`);
    } else if (novoStatus === "Reprovado") {
      alert(`Candidato ${c.nome} reprovado. (TODO: Mover dados detalhados para o Banco de Talentos).`);
    } else {
      alert(`Status de ${c.nome} alterado para: ${novoStatus}.`);
    }
  }

  fecharModalCustom();

  // Adiciona uma verificação para garantir que a vaga foi encontrada antes de chamar a listagem
  if (v) {
    // Volta para a lista de candidatos da vaga atualizada
    listarCandidatosPorVaga(tituloVaga, v.id_vaga);
  } else {
    // Se não encontrar a vaga, volta para a lista principal
    loadContent('listarVagas');
  }
}

function abrirModalReprovacao(id) {
  modalVagaId = id;
  const html = `
        <h3>Reprovar Vaga - Feedback</h3>
        <p>Insira o motivo da reprovação:</p>
        <textarea id="feedbackTextarea" rows="4"></textarea>
        <div style="margin-top:15px; text-align:right;">
            <button class="btn-ghost" onclick="fecharModalCustom()">Cancelar</button>
            <button class="btn-ghost" style="background:#e74c3c; color:white; border-color:#e74c3c;" onclick="confirmarReprovacao()">Confirmar</button>
        </div>`;
  abrirModalCustom(html);
}
function confirmarReprovacao() {
  const vaga = vagas.find(v => v.id_vaga === modalVagaId);
  if (vaga) { vaga.status = "Fechada"; alert(`Vaga '${vaga.titulo}' reprovada.`); }
  fecharModalCustom();
  loadContent("aprovarVagas");
}

function abrirModalAtribuicao(id, nome) {
  modalCandidatoId = id;
  const vagasAbertas = vagas.filter(v => v.status === "Aberta");
  const html = `
    <h3>Atribuir Currículo</h3>
    <p>Candidato: <strong>${nome}</strong></p>
    <label class="field-label" style="margin-top:10px;">Vaga de Destino:</label>
    <select id="selectVagaAtribuicao" class="field-value">
      ${vagasAbertas.map(v => `<option value="${v.titulo}">${v.titulo}</option>`).join("")}
    </select>
    <div style="margin-top:15px; text-align:right;">
      <button class="btn-ghost" onclick="fecharModalCustom()">Cancelar</button>
      <button class="btn-ghost" style="background:#28a745; color:white; border-color:#28a745;" onclick="confirmarAtribuicao()">Atribuir</button>
    </div>`;
  abrirModalCustom(html);
}

// Função que abre o modal já define modalCandidatoId = id;

function confirmarAtribuicao() {
  const vaga = document.getElementById('selectVagaAtribuicao').value;
  const c = curriculos.find(x => x.id === modalCandidatoId); // Usa o ID global
  if (c && vaga) {
    c.vaga = vaga;
    c.status = "Em Contato";
    alert(`Currículo atribuído à vaga: ${vaga}.`);
  }
  fecharModalCustom();
  loadContent("triagem");
}

function abrirModalDetalhesRH(id) {
  modalVagaId = id;
  const vaga = vagas.find(v => v.id_vaga === id);
  const html = `
        <h3>Detalhes de RH e Aprovação</h3>
        <p>Preencha os detalhes para aprovar e abrir a vaga **${vaga.titulo}**.</p>
        <div class="field-group"><label class="field-label">Responsável R&S</label><input id="modalResponsavelRS" class="field-value" value="Gustavo (RH)"></div>
        <div class="field-group"><label class="field-label">Salário Máximo</label><input id="modalSalarioMax" class="field-value" value=""></div>
        <div class="field-group full-width"><label class="field-label">Benefícios</label><textarea id="modalBeneficios" class="field-value" rows="2"></textarea></div>
        <div style="margin-top:15px; text-align:right;">
            <button class="btn-ghost" onclick="fecharModalCustom()">Cancelar</button>
            <button class="btn-ghost" style="background:#00c4cc; color:white; border-color:#28a745;" onclick="confirmarAprovacaoComDetalhes()">Aprovar e Publicar</button>
        </div>`;
  abrirModalCustom(html);
}

// Função que abre o modal já define modalVagaId = id;

function confirmarAprovacaoComDetalhes() {
  const vaga = vagas.find(v => v.id_vaga === modalVagaId); // Usa o ID global
  if (vaga) {
    vaga.responsavelRS = document.getElementById('modalResponsavelRS').value;
    vaga.salarioMax = document.getElementById('modalSalarioMax').value;
    vaga.beneficios = document.getElementById('modalBeneficios').value;
    vaga.status = "Aberta";
    alert(`Vaga '${vaga.titulo}' aprovada e publicada.`);
  }
  fecharModalCustom();
  loadContent("aprovarVagas");
}

function verDetalhesVagaGestor(id_vaga) {
  const v = vagas.find(x => x.id_vaga === id_vaga);
  if (!v) {
    console.error("Vaga não encontrada:", id_vaga);
    return;
  }
  const html = `<div class="crud-container"><div class="breadcrumb">Vagas > <a onclick="loadContent('listarVagas')">Listar</a> > Especificações do Gestor</div><h2>Especificações da Vaga (${v.titulo})</h2><div class="detail-form-grid"> <p class="descricao" style="color-red">Para editar campo, entrar em contato com o gestor</p>       
        <div class="field-group"><label class="field-label">Gestor Requisitante</label><input class="field-value read-only" value="${v.gestor || 'N/A'}" disabled></div>
        <div class="field-group"><label class="field-label">Status Atual</label><input class="field-value read-only" value="${v.status}" disabled></div>
        <div class="field-group full-width"><label class="field-label">Requisitos Técnicos (Esperado)</label><textarea class="field-value read-only" rows="3" disabled>${v.requisitos || 'Não especificado.'}</textarea></div>
        <div class="field-group full-width"><label class="field-label">Descrição Resumida</label><textarea class="field-value read-only" rows="4" disabled>${v.descricao}</textarea></div>
        </div>
        <div style="margin-top:20px;"><button class="btn-ghost" onclick="loadContent('listarVagas')">⬅ Voltar</button></div>
    </div>`;
  document.getElementById("mainContent").innerHTML = html;
}

function editarDetalhesVagaRH(id_vaga) {
  const v = vagas.find(x => x.id_vaga === id_vaga);
  if (!v) {
    console.error("Vaga não encontrada:", id_vaga);
    return;
  }
  const html = `<div class="crud-container"><div class="breadcrumb">Vagas > <a onclick="loadContent('listarVagas')">Listar</a> > Editar Detalhes RH</div><h2>Editar Detalhes RH: ${v.titulo}</h2><div class="detail-form-grid">
        <div class="field-group full-width"><label class="field-label">Responsável R&S</label><input id="editResponsavelRS" class="field-value" value="${v.responsavelRS || ''}"></div>
        <div class="field-group"><label class="field-label">Salário Máximo</label><input id="editSalarioMax" class="field-value" value="${v.salarioMax || ''}"></div>
        <div class="field-group full-width"><label class="field-label">Benefícios</label><textarea id="editBeneficios" class="field-value" rows="2">${v.beneficios || ''}</textarea></div>
        <div class="field-group full-width"><label class="field-label">Descrição (para divulgação)</label><textarea id="editDescricao" class="field-value" rows="4">${v.descricao}</textarea></div>
        </div>
        <div style="margin-top:20px;">
            <button class="btn-ghost" onclick="salvarVagaRH(${v.id_vaga})" style="background:#28a745; color:white; border-color:#28a745;">Salvar Detalhes RH</button>
            <button class="btn-ghost" onclick="loadContent('listarVagas')">Cancelar</button>
        </div>
    </div>`;
  document.getElementById("mainContent").innerHTML = html;
}


async function salvarVagaRH(id_vaga) {
  // Busca os valores do formulário
  const dadosAtualizados = {
    responsavelRS: document.getElementById('editResponsavelRS').value,
    salarioMax: document.getElementById('editSalarioMax').value,
    beneficios: document.getElementById('editBeneficios').value,
    descricao: document.getElementById('editDescricao').value
  };

  try {
    // Chama o endpoint PUT
    const resposta = await fetch(`http://localhost:5000/vagas/${id_vaga}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAtualizados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(resultado.erro || 'Erro ao atualizar a vaga.');
    }

    // Atualiza também o array local (opcional, se quiser refletir imediatamente no front)
    const v = vagas.find(x => x.id_vaga === id_vaga);
    if (v) {
      v.responsavelRS = dadosAtualizados.responsavelRS;
      v.salarioMax = dadosAtualizados.salarioMax;
      v.beneficios = dadosAtualizados.beneficios;
      v.descricao = dadosAtualizados.descricao;
    }

    alert(resultado.mensagem || "Detalhes de RH salvos com sucesso!");
    loadContent("listarVagas");

  } catch (erro) {
    console.error("Erro ao salvar vaga:", erro);
    alert("Erro ao salvar a vaga. Veja o console para detalhes.");
  }
}


function deletarCurriculo(id) {
  if (confirm("ATENÇÃO: Este CV será excluído permanentemente. Confirma?")) {
    const index = curriculos.findIndex(c => c.id === id);
    if (index !== -1) {
      curriculos.splice(index, 1);
      alert("Currículo excluído.");
      loadContent('triagem');
    }
  }
}

function moverParaTalentos(id) {
  if (confirm("Mover para o Banco de Talentos?")) {
    const c = curriculos.find(x => x.id === id);
    if (c) {
      talentos.push({
        id: talentos.length + 1,
        nome: c.nome,
        area: c.vaga.includes("Dev") ? "TI" : "Geral",
        contato: "Não",
        ultimaAtualizacao: new Date().toISOString().slice(0, 10),
        origem: "Triagem",
        cvDetalhe: {
          skills: c.cvDetalhe.skills,
          resumo: c.cvDetalhe.analise
        }
      });

      const index = curriculos.findIndex(x => x.id === id);
      curriculos.splice(index, 1);

      alert(`Candidato ${c.nome} movido para o Banco de Talentos.`);
      loadContent('triagem');
    }
  }
}
// A função principal de exibição do currículo
async function exibirCurriculo(id, rodarIA = false) { 
    const c = curriculos.find(x => x.id === id);
    const vaga = vagas.find(v => v.titulo === c.vaga);
    
    // 1. Inicialização do Estado da IA no currículo
    if (!c.iaResultado) {
        c.iaResultado = { matchScore: 'N/A', analiseIA: 'Clique no botão abaixo para rodar a análise de IA.', iaRodada: false };
    }
    
    // 2. Lógica para definir os parâmetros da IA
    let requisitosParaAnalise = "";
    let nomeVagaParaIA = "Candidato em Triagem (Potencial Geral)"; 

    if (vaga) {
        requisitosParaAnalise = vaga.requisitos;
        nomeVagaParaIA = c.vaga;
    } else if (c.vaga && c.vaga !== 'N/A') {
        requisitosParaAnalise = "N/A (Vaga não encontrada)";
        nomeVagaParaIA = c.vaga; 
    } else {
        requisitosParaAnalise = "N/A";
        nomeVagaParaIA = "Área Geral/Banco de Talentos";
    }

    // 3. Chama a IA apenas se rodarIA for true
    if (rodarIA) {
        // Estado de Carregamento
        let carregandoResultado = { matchScore: '...', analiseIA: 'Aguardando análise da IA (Gemini)...', iaRodada: false };
        // Renderiza o HTML com estado de "carregando"
        let loadingHtml = montarCurriculoHTML(c, vaga, carregandoResultado, nomeVagaParaIA);
        document.getElementById("mainContent").innerHTML = loadingHtml;
        
        // Exibe status de carregamento no botão
        const iaButtonArea = document.getElementById('iaButtonArea');
        if (iaButtonArea) {
            iaButtonArea.innerHTML = '<span style="color: #00c4cc; font-weight: bold;"> Rodando análise... Aguarde.</span>';
        }
        
        // Obtém o resultado da IA (VIA FETCH PARA O SEU app.py)
        let resultado = await fetchMatchScoreIA(c.cvDetalhe.skills, requisitosParaAnalise, nomeVagaParaIA);
        
        // Salva o resultado no objeto do currículo
        c.iaResultado = {
            matchScore: resultado.matchScore,
            analiseIA: resultado.analiseIA,
            iaRodada: true // Assume que rodou se chegou até aqui (mesmo que com erro)
        };
    }
    
    // 4. Renderiza o HTML com o estado final (ou carregado)
    let html = montarCurriculoHTML(c, vaga, c.iaResultado, nomeVagaParaIA);
    document.getElementById("mainContent").innerHTML = html;
}

// Função auxiliar para construir o HTML (AGORA COM BOTÃO DE IA)
function montarCurriculoHTML(c, vaga, iaResultado, nomeVagaParaIA) {
    // Checa se a IA já foi rodada. Usamos iaResultado.iaRodada para rastrear isso.
    const isReady = iaResultado.iaRodada;
    const scoreColor = iaResultado.matchScore >= 80 ? '#28a745' : iaResultado.matchScore >= 50 ? '#ffc107' : '#e74c3c';
    
    const requisitosInfo = vaga ? vaga.requisitos : (c.vaga && c.vaga !== 'N/A' ? `Vaga "${c.vaga}" não encontrada na base.` : 'Candidato sem vaga atribuída.');
    const matchScoreDisplay = isReady ? iaResultado.matchScore + '%' : (iaResultado.matchScore === '...' ? '...' : 'N/A');
    const analiseIADisplay = isReady ? iaResultado.analiseIA : 'Clique no botão abaixo para rodar a análise de IA.';
    
    const buttonHtml = `<button class="btn-ghost" onclick="exibirCurriculo(${c.id}, true)" style="background:#00c4cc; color:white; font-weight: bold;">
        Rodar Análise de IA (Gemini)
    </button>`;

    return `<div class="crud-container"><div class="breadcrumb">Candidatos > <a onclick="loadContent('triagem')">Triagem</a> > Detalhes do Candidato</div><h2>Detalhes: ${c.nome}</h2><div class="detail-form-grid">
        <div class="field-group"><label class="field-label">Vaga Atribuída</label><input class="field-value read-only" value="${c.vaga || 'N/A'}" disabled></div>
        <div class="field-group"><label class="field-label">Status Atual</label><input class="field-value read-only" value="${c.status}" disabled></div>
        <div class="field-group"><label class="field-label">Email</label><input class="field-value read-only" value="${c.email}" disabled></div>
        <div class="field-group"><label class="field-label">Telefone</label><input class="field-value read-only" value="${c.telefone}" disabled></div>
    </div>
    
    <div class="analysis-block-ia" style="margin-top:20px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
        <h3 style="text-align: center; color: #00a2ffff; margin-bottom: 15px;">Análise de Match: ${nomeVagaParaIA}</h3>
        
        <div style="text-align: center; margin-bottom: 20px;">
            <p style="font-size: 3em; font-weight: bold; color: ${isReady ? scoreColor : '#6c757d'}; margin: 0;">${matchScoreDisplay}</p>
            <p style="font-size: 0.9em; color: #777;">(Score gerado pelo modelo Gemini)</p>
        </div>
        
        <h4 style="margin-bottom: 5px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">Requisitos Alvo:</h4>
        <p style="font-style: italic; color: #555; font-size: 0.9em;">${requisitosInfo}</p>
        
        <h4 style="margin-bottom: 5px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-top: 15px;">Avaliação da IA:</h4>
        <p style="font-style: italic; color: #555;">${analiseIADisplay}</p>
        
        <div style="text-align:center; margin-top: 15px;" id="iaButtonArea">
            ${isReady ? '' : buttonHtml} 
            ${isReady && c.status !== 'Contratado' ? 
                `<button class="btn-ghost" onclick="moverParaTalentos(${c.id})" style="background:#00c4cc; color:white; border-color:#5bc0de;">Mover para Banco de Talentos</button>` 
                : ''}
        </div>
    </div>
    <hr style="margin-top:20px; margin-bottom: 20px;">
    
    <div class="analysis-block">
        <h3 style="text-align: center;">Análise do RH (Manual)</h3>
        
        <div class="full-width" style="margin-top: 20px;">
            <div class="skills-header">
                <h4 style="margin-bottom: 5px;">Habilidades (Revisão Humana):</h4>
                <button class="btn-ghost edit-skills-btn" onclick="toggleSkillEditMode(${c.id})">Editar Habilidades</button>
            </div>
            
            <div class="skills-list" id="skillsView-${c.id}">
                ${c.cvDetalhe.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
            </div>
            
            <div class="skills-edit-area hidden" id="skillsEdit-${c.id}">
                <textarea id="skillsTextarea-${c.id}" class="field-value" rows="2" placeholder="Separe as habilidades por vírgula (Ex: React, Node.js, Inglês Avançado)">${c.cvDetalhe.skills.join(', ')}</textarea>
                <p style="font-size: 12px; color: #777; margin-top: 5px;">Separe as habilidades com vírgulas.</p>
            </div>
        </div>
        
        <div class="full-width" style="margin-top: 20px;">
            <h4 style="margin-bottom: 5px;">Resumo / Análise RH:</h4>
            <textarea id="analiseRHEdit-${c.id}" class="field-value" rows="4">${c.cvDetalhe.analise}</textarea>
        </div>
    </div>
    <div style="margin-top:20px;">
        <button class="btn-ghost" onclick="salvarAnaliseCurriculo(${c.id})" style="background:#28a745; color:white; border-color:#28a745;">Salvar Análise</button>
        <button class="btn-ghost" onclick="loadContent('triagem')">⬅ Voltar</button>
        <a href="${c.cvUrl}" target="_blank" class="btn-ghost" style="background:#00c4cc; color:white; text-decoration:none; padding:10px; border-color:#00c4cc; margin-left: 10px;">Visualizar CV Original</a>
    </div>
</div>`;
} 

function toggleSkillEditMode(idCandidato) {
  const view = document.getElementById(`skillsView-${idCandidato}`);
  const edit = document.getElementById(`skillsEdit-${idCandidato}`);
  const btn = document.querySelector('.edit-skills-btn');

  if (view.classList.contains('hidden')) {
    view.classList.remove('hidden');
    edit.classList.add('hidden');
    btn.innerHTML = 'Adicionar Habilidades';
  } else {
    view.classList.add('hidden');
    edit.classList.remove('hidden');
    btn.innerHTML = 'Cancelar Edição';
  }
}


function salvarAnaliseCurriculo(idCandidato) {
  const c = curriculos.find(x => x.id === idCandidato);
  if (!c) return alert("Erro: Candidato não encontrado.");

  // Pega os valores da textarea e limpa os espaços
  const novaAnalise = document.getElementById(`analiseRHEdit-${idCandidato}`).value.trim();
  const novasSkillsTexto = document.getElementById(`skillsTextarea-${idCandidato}`).value.trim();

  // Converte o texto de habilidades para um array, separando por vírgula e removendo vazios
  const novasSkills = novasSkillsTexto.split(',').map(s => s.trim()).filter(s => s.length > 0);

  // Atualiza os dados
  c.cvDetalhe.analise = novaAnalise;
  c.cvDetalhe.skills = novasSkills;

  alert("Análise e Habilidades atualizadas com sucesso!");

  // Recarrega a visualização para mostrar as tags atualizadas
  exibirCurriculo(idCandidato);
}

function exibirTalento(id) {
  const t = talentos.find(x => x.id === id);
  const html = `<div class="crud-container"><div class="breadcrumb">Banco de Talento > Detalhes</div><h2>Detalhes do Talento: ${t.nome}</h2><div class="detail-form-grid">
        <div class="field-group"><label class="field-label">Área</label><input class="field-value read-only" value="${t.area}" disabled></div>
        <div class="field-group"><label class="field-label">Origem</label><input class="field-value read-only" value="${t.origem}" disabled></div>
        <div class="field-group full-width"><label class="field-label">Habilidades</label><div class="skills-list">${t.cvDetalhe.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div></div>
        <div class="field-group full-width"><label class="field-label">Resumo</label><textarea class="field-value read-only" rows="4" disabled>${t.cvDetalhe.resumo}</textarea></div>
        </div>
        <div style="margin-top:20px;"><button class="btn-ghost" onclick="loadContent('listaTalentos')">⬅ Voltar</button></div>
    </div>`;
  document.getElementById("mainContent").innerHTML = html;
}

function deletarTalento(id) {
  if (confirm("ATENÇÃO: Este talento será excluído permanentemente do banco. Confirma?")) {
    const index = talentos.findIndex(t => t.id === id);
    if (index !== -1) {
      talentos.splice(index, 1);
      alert("Talento excluído.");
      loadContent('listaTalentos');
    }
  }
}

// INICIALIZAÇÃO DA PÁGINA (EXECUTA NO CARREGAMENTO)

document.addEventListener("DOMContentLoaded", () => {
  // Inicializa menu/submenu
  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".submenu.open").forEach(s => {
        if (s !== btn.nextElementSibling) s.classList.remove("open");
      });
      const submenu = btn.nextElementSibling;
      submenu.classList.toggle("open");
    });
});

// --- FUNÇÃO PARA COMUNICAR COM O BACKEND PYTHON/GEMINI (REINTEGRADA) ---
async function fetchMatchScoreIA(candidatoSkills, vagaRequisitos, nomeVaga) {
    // A URL do seu servidor Python (Flask)
    const apiURL = 'http://127.0.0.1:5000/api/match-score'; 
    
    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                skills: candidatoSkills,
                requisitos: vagaRequisitos,
                nomeVaga: nomeVaga // Parâmetro necessário para o seu app.py
            })
        });

        if (!response.ok) {
            // Se a resposta HTTP falhar (ex: 400 Bad Request)
            const errorData = await response.json().catch(() => ({ analise_ia: `Erro HTTP ${response.status}.` }));
            throw new Error(`Erro ao buscar Match Score. Status: ${response.status}. Detalhe: ${errorData.analise_ia}`);
        }

        const data = await response.json();
        return {
            matchScore: data.match_score || 0,
            analiseIA: data.analise_ia || "Análise da IA não disponível.",
        };

    } catch (error) {
        console.error("Erro ao buscar Match Score da IA:", error);
        return {
            matchScore: 'N/A', // Mude para 'N/A' para indicar que não rodou
            analiseIA: `Falha na conexão com o servidor de IA (Verifique se o 'app.py' está rodando na porta 5000). Erro: ${error.message}`,
        };
    }
}
