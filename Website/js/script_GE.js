let vagas = [
    { id: 1, titulo: "Dev Frontend", status: "Aberta", descricao: "Atuação com React, SPA, REST.", gestor: "Maria", salarioMax: "R$ 8.000", beneficios: "VT, VR (R$ 40), Plano Saúde", responsavelRS: "Gustavo (RH)", requisitos: "React 3 anos, Node.js, Inglês Avançado" },
    { id: 2, titulo: "Analista RH", status: "Em análise", descricao: "Pipeline de recrutamento e seleção.", gestor: "João", salarioMax: "N/A", beneficios: "N/A", responsavelRS: "N/A", requisitos: "Experiência em triagem, Conhecimento CLT" },
    { id: 3, titulo: "Designer UI/UX", status: "Fechada", descricao: "Pesquisa, prototipação e UI kits.", gestor: "Ana", salarioMax: "R$ 6.000", beneficios: "VT, VR (R$ 35)", responsavelRS: "Júlia (RH)", requisitos: "Figma, Adobe XD, Portfólio" }
];

let curriculos = [
    { id: 1, nome: "Maria Silva", vaga: "Dev Frontend", status: "Contratado", email: "maria@email.com", telefone: "(11) 98765-4321", cvUrl: "link_cv_maria.pdf", cvDetalhe: {skills: ["React", "Node.js", "JavaScript", "UX/UI"], analise: "Maria possui forte experiência com React e Node.js. (CONTRATADA, 01/09)"}},
    { id: 2, nome: "João Souza", vaga: "Analista RH", status: "Entrevista Técnica", email: "joao@email.com", telefone: "(11) 99999-8888", cvUrl: "link_cv_joao.pdf", cvDetalhe: {skills: ["Recrutamento", "Onboarding", "Gestão de Pessoas"], analise: "João tem sólida experiência em recrutamento. Próxima etapa: Entrevista Técnica."}},
    { id: 3, nome: "Pedro Rocha", vaga: "Dev Frontend", status: "Em Contato", email: "pedro@email.com", telefone: "(11) 97777-6666", cvUrl: "link_cv_pedro.pdf", cvDetalhe: {skills: ["HTML", "CSS", "Angular"], analise: "Pedro possui experiência com desenvolvimento web, mas sua principal habilidade é Angular, não React. Baixa aderência aos requisitos técnicos da vaga."}},
    { id: 4, nome: "Ana Costa", vaga: "Dev Frontend", status: "Novo", email: "ana@email.com", telefone: "(11) 95555-4444", cvUrl: "link_cv_ana.pdf", cvDetalhe: {skills: ["React", "Redux", "TypeScript", "Node.js"], analise: "Ana é uma candidata ideal, com experiência em tecnologias adicionais. Atribuir entrevista urgente."}}
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

function getVagaMetrics(titulo) {
    const ativos = curriculos.filter(c => c.vaga === titulo && (c.status === "Novo" || c.status === "Em Contato" || c.status === "Entrevista Técnica"));
    const novos = ativos.filter(c => c.status === "Novo").length;
    const emContato = ativos.filter(c => c.status === "Em Contato" || c.status === "Entrevista Técnica").length;
    const totalContratados = curriculos.filter(c => c.vaga === titulo && c.status === "Contratado").length;
    
    return { totalAtivos: ativos.length, novos, emContato, totalContratados };
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

function loadContent(page) {
  let html = "";
  const mainContent = document.getElementById("mainContent");
  const vagasAbertas = vagas.filter(v => v.status === 'Aberta');
  fecharModalCustom();

  if (page === "listarVagas") {
    html = `
      <div class="crud-container">
        <div class="breadcrumb">Vagas > Listar</div>
        <h2>Listar Vagas</h2>
        <div class="filter-box">
          <input type="text" id="searchVagas" placeholder="Buscar por Título/Gestor/Responsável..." onkeyup="filterCards('vagaCard','searchVagas')">
          <select id="filterVagas" onchange="filterCardByStatus()">
            <option value="">Todos os Status</option>
            <option value="Aberta">Abertas</option>
            <option value="Em análise">Em Análise</option>
            <option value="Fechada">Fechadas</option>
          </select>
        </div>
        <div class="card-grid" id="vagaCard">
          ${vagas.map(v => {
            const metrics = getVagaMetrics(v.titulo);
            const temCandidatos = metrics.totalAtivos > 0 || metrics.totalContratados > 0;
            return `
              <div class="card status-${v.status.toLowerCase().replace(/ /g, '-')}" data-status="${v.status}">
                <div>
                  <h3>${v.titulo}</h3>
                  <p><strong>Gestor:</strong> ${v.gestor || "N/A"}</p>
                  <p><strong>Responsável R&S:</strong> ${v.responsavelRS || "Aguardando RH"}</p>
                  ${v.status === 'Aberta' ? `<hr style="margin: 5px 0;">
                    <p style="font-size: 13px; color: #2c3e50;">
                      <strong style="color: ${metrics.novos > 0 ? '#dc3545' : '#3498db'};">Novos CVs: ${metrics.novos}</strong> | 
                      <strong style="color: #9b59b6;">Em Contato/Entrevista: ${metrics.emContato}</strong>
                      ${metrics.totalContratados > 0 ? `| <strong style="color: #28a745;">CONTRATADOS: ${metrics.totalContratados}</strong>` : ''}
                    </p>` : `<p><strong>Status:</strong> ${v.status}</p>`}
                </div>
                <div class="action-icons">
                  <img title="Editar detalhes RH" onclick="editarDetalhesVagaRH(${v.id})" class="icon-cards" src="../img/edit-icon.png" alt="">
                  <img  title="Ver detalhes da vaga" onclick="verDetalhesVagaGestor(${v.id})" class="icon-cards" src="../img/inspecionar-icon.png" alt="">
                  ${v.status === 'Aberta' && temCandidatos ? 
                    `<button class="btn-ghost" title="Ver Candidatos Atribuídos" style="background:#00c4cc; color:white; border-color:#007bff; margin-left: 10px;" onclick="listarCandidatosPorVaga('${v.titulo}', ${v.id})">
                      Candidatos (${metrics.totalAtivos + metrics.totalContratados})
                    </button>` 
                    : ''}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>`;
  }

  if (page === "curriculos") {
    const candidatosTriagem = curriculos.filter(c => c.status === "Novo" || c.status === "Em Contato");
    
    html = `
      <div class="crud-container">
        <div class="breadcrumb">Candidatos > Curriculos</div>
        <h2>Triagem de Currículos</h2>
        <div class="filter-box">
          <input type="text" id="searchCurriculos" placeholder="Buscar Candidato/Vaga..." onkeyup="filterCards('triagemCardGrid','searchCurriculos')">
          <select id="filterStatusCurriculo" onchange="filterCards('triagemCardGrid','filterStatusCurriculo', 'data-status')">
            <option value="">Todos</option>
            <option value="Novo">Novo</option>
            <option value="Em Contato">Em Contato</option>
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
                  <img title="Exibir curriculo" onclick="exibirCurriculo(${c.id})" class="icon-cards" src="../img/inspecionar-icon.png" alt=">
                  <img title="Excluir candidato" onclick="deletarCurriculo(${c.id})" class="icon-cards" src="../img/lixo-icon.png" alt="">
              </div>
            </div>
          `).join("")}
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
        listarCandidatosPorVaga(tituloVaga, v.id);
    } else {
         // Se não encontrar a vaga, volta para a lista principal
        loadContent('listarVagas'); 
    }
}

// INICIALIZAÇÃO DA PÁGINA (EXECUTA NO CARREGAMENTO)

document.addEventListener("DOMContentLoaded", () => {
    // Lógica para fechar submenus quando outro é clicado e alternar o clique
    document.querySelectorAll(".menu-item").forEach(btn => {
      btn.addEventListener("click", () => {
        // Fecha outros submenus abertos
        document.querySelectorAll(".submenu.open").forEach(s => {
             if (s !== btn.nextElementSibling) s.classList.remove("open");
        });
        // Alterna o submenu atual
        const submenu = btn.nextElementSibling;
        submenu.classList.toggle("open");
      });
    });
});