
const BASE = "http://localhost:3000";
const ENDPOINTS = {
    consoles: `${BASE}/consoles`,
    jogos: `${BASE}/jogos`,
    noticias: `${BASE}/noticias`
};

let formMode = 'create'; 
let editEntity = null;
let editId = null;

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", "&#039;");
}
function formatContent(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}


async function safeFetchJson(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
        throw new Error(`Erro na requisição para ${url}: ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

async function fetchAllEntities() {
    const [c, j, n] = await Promise.all([
        fetch(ENDPOINTS.consoles).then(r => r.ok ? r.json() : []),
        fetch(ENDPOINTS.jogos).then(r => r.ok ? r.json() : []),
        fetch(ENDPOINTS.noticias).then(r => r.ok ? r.json() : [])
    ]);
    return { consoles: c, jogos: j, noticias: n };
}



function createCarouselItemHtml(item, index) { 
    const urlEntity = 'jogos'; 
    return `
    <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${item.imagem}" class="d-block w-100 carousel-img" alt="${escapeHtml(item.titulo)}" onerror="this.src='assets/img/placeholder.png'">
        <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 rounded p-2">
            <h5>${escapeHtml(item.titulo)}</h5>
            <p>${escapeHtml(item.descricao)}</p>
            <a href="detalhes.html?entity=${urlEntity}&id=${item.id}" class="btn btn-sm btn-warning">Ver Detalhes</a>
        </div>
    </div>
    `;
}

async function montarCarouselJogosDestaque() { 
    try {
        const url = `${ENDPOINTS.jogos}?destaque=true`;
        const jogosDestaque = await safeFetchJson(url);
        
        const container = document.getElementById('carousel-container');
        if (!container) return;

        if (jogosDestaque.length === 0) {
            container.innerHTML = '<p class="text-warning">Nenhum jogo em destaque encontrado.</p>';
            return;
        }

        const indicators = jogosDestaque.map((_, index) => `<button type="button" data-bs-target="#carouselDestaques" data-bs-slide-to="${index}" class="${index === 0 ? 'active' : ''}" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>`).join('');
        const items = jogosDestaque.map(createCarouselItemHtml).join('');

        container.innerHTML = `
        <div id="carouselDestaques" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">${indicators}</div>
            <div class="carousel-inner">${items}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselDestaques" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselDestaques" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>
            </button>
        </div>
        `;
    } catch (error) {
        console.error("Erro ao montar o carrossel:", error);
        const container = document.getElementById('carousel-container');
        if (container) container.innerHTML = `<p class="alert alert-danger">Erro ao carregar destaques: ${error.message}. Verifique o JSONServer.</p>`;
    }
}

function createCardHtml(item, entityName) { 
    const entitySingular = item.categoria; 
    const dateOrYear = item.data ? (item.data.length > 4 ? item.data.substring(0, 4) : item.data) : 'N/A';
    const urlEntity = entityName; 

    return `
    <div class="col">
        <div class="card bg-black border-warning h-100">
            <img src="${item.imagem}" class="card-img-top card-img-custom" alt="${escapeHtml(item.titulo || item.nome)}" onerror="this.src='assets/img/placeholder.png'">
            <div class="card-body">
                <span class="badge bg-warning text-dark mb-2">${escapeHtml(entitySingular)}</span>
                <h5 class="card-title text-warning">${escapeHtml(item.titulo || item.nome)}</h5>
                <p class="card-text">${escapeHtml(item.descricao)}</p>
            </div>
            <div class="card-footer bg-warning border-warning d-flex justify-content-between align-items-center">
                <small class="text-dark">Ano: ${dateOrYear}</small>
                <a href="detalhes.html?entity=${urlEntity}&id=${item.id}" class="btn btn-sm btn-dark">Detalhes</a>
            </div>
        </div>
    </div>
    `;
}

async function montarSecaoCardsUnificados() { 
    try {
        const { consoles, jogos, noticias } = await fetchAllEntities();
        
        const allItems = [
            ...consoles.map(item => ({...item, entityName: 'consoles', categoria: item.categoria || 'Console'})),
            ...jogos.map(item => ({...item, entityName: 'jogos', categoria: item.categoria || 'Jogo'})),
            ...noticias.map(item => ({...item, entityName: 'noticias', categoria: item.categoria || 'Notícia'}))
        ];

        allItems.sort((a, b) => {
            const dateA = a.data ? new Date(a.data) : new Date(0);
            const dateB = b.data ? new Date(b.data) : new Date(0);
            return dateB - dateA;
        });

        const cardsContainer = document.getElementById('cards-unificados');
        if (!cardsContainer) return;

        if (allItems.length === 0) {
            cardsContainer.innerHTML = '<p class="text-warning">Nenhum conteúdo retro encontrado.</p>';
            return;
        }

        const cardsHtml = allItems.map(item => createCardHtml(item, item.entityName)).join('');
        cardsContainer.innerHTML = cardsHtml;
    } catch (error) {
        console.error("Erro ao montar seção de cards:", error);
        const container = document.getElementById('cards-unificados');
        if (container) container.innerHTML = `<p class="alert alert-danger">Erro ao carregar conteúdo: ${error.message}. Verifique o JSONServer.</p>`;
    }
}

async function montarDetalhesItem() { 
    const params = new URLSearchParams(window.location.search);
    const entity = params.get('entity');
    const id = params.get('id');

    const detalhesItemContainer = document.getElementById('detalhes-item');

    if (!entity || !id || !ENDPOINTS[entity]) {
        detalhesItemContainer.innerHTML = '<p class="alert alert-danger">Detalhes não encontrados. Item ou ID inválido na URL.</p>';
        return;
    }

    try {
        const url = `${ENDPOINTS[entity]}/${id}`;
        const item = await safeFetchJson(url);
        
        if (!item || item.id === undefined) {
             detalhesItemContainer.innerHTML = '<p class="alert alert-warning">Item não encontrado na base de dados.</p>';
             return;
        }

        document.title = `${item.titulo || item.nome} - Games Retrô`;

        const detalhesHtml = `
            <div class="row">
                <div class="col-md-5 mb-3">
                    <img src="${item.imagem}" class="img-fluid rounded border border-warning" alt="${escapeHtml(item.titulo || item.nome)}" onerror="this.src='assets/img/placeholder.png'">
                </div>
                <div class="col-md-7">
                    <span class="badge bg-warning text-dark mb-2">${escapeHtml(item.categoria || 'Item')}</span>
                    <h2 class="display-4 text-glow mb-3">${escapeHtml(item.titulo || item.nome)}</h2>
                    <p class="lead">${escapeHtml(item.descricao)}</p>
                    <hr class="border-warning">
                    <p><strong>Ano/Data:</strong> ${escapeHtml(item.data || 'N/A')}</p>
                    <div class="text-light">
                        <p><strong>Conteúdo:</strong></p>
                        <p>${formatContent(item.conteudo || item.descricao)}</p>
                    </div>
                </div>
            </div>
        `;
        detalhesItemContainer.innerHTML = detalhesHtml;

    } catch (error) {
        console.error(`Erro ao buscar detalhes do item ${entity}/${id}:`, error);
        detalhesItemContainer.innerHTML = `<p class="alert alert-danger">Erro ao carregar detalhes: ${error.message}. Verifique o JSONServer.</p>`;
    }
}



function resetAdminForm() {
    formMode = 'create';
    editEntity = null;
    editId = null;
    document.getElementById('admin-form').reset();
    document.getElementById('admin-submit').innerText = 'Salvar';
    document.getElementById('admin-cancel').classList.add('d-none');
    
    const entitySelect = document.getElementById('admin-entity');
    if (entitySelect) entitySelect.value = 'consoles';
    const categoriaSelect = document.getElementById('admin-categoria');
    if (categoriaSelect) categoriaSelect.value = 'Console';
}

async function salvarItem(event) {
 
    event.preventDefault(); 
    
    
    console.log("Formulário submetido! O Fetch POST/PUT será executado agora.");

    const entity = document.getElementById('admin-entity')?.value;
    const titulo = document.getElementById('admin-titulo')?.value.trim();
    const categoria = document.getElementById('admin-categoria')?.value.trim();
    const data = document.getElementById('admin-data')?.value.trim();
    const imagem = document.getElementById('admin-imagem')?.value.trim();
    const descricao = document.getElementById('admin-descricao')?.value.trim();
    const destaque = document.getElementById('admin-destaque')?.checked;
    
    if (!entity || !titulo || !descricao || !data || !imagem || !categoria) {
        alert("Todos os campos obrigatórios (Entidade, Título, Descrição, Data, Imagem, Categoria) devem ser preenchidos.");
        return;
    }

    const itemData = {
        titulo,
        descricao: descricao.split('\n')[0].trim(),
        conteudo: descricao,
        categoria,
        data,
        imagem,
    };
    
    if (entity === 'jogos') {
        itemData.destaque = destaque;
    }

    const url = formMode === 'create' ? ENDPOINTS[entity] : `${ENDPOINTS[editEntity]}/${editId}`;
    const method = formMode === 'create' ? 'POST' : 'PUT';

    try {
        const response = await safeFetchJson(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        
        
        console.log(`Resposta do Servidor:`, response);
        
        alert(`Item ${formMode === 'create' ? 'criado' : 'atualizado'} com sucesso!`);
        resetAdminForm();
        loadAdminTables();

    } catch (error) {
        console.error(`Erro ao ${formMode === 'create' ? 'criar' : 'atualizar'} item:`, error);
        alert(`Erro ao ${formMode === 'create' ? 'criar' : 'atualizar'} item: ${error.message}.`);
    }
}

async function startEdit(entity, id) { 
    try {
        const item = await safeFetchJson(`${ENDPOINTS[entity]}/${id}`);

        formMode = 'edit';
        editEntity = entity;
        editId = id;

        document.getElementById('admin-entity').value = entity;
        document.getElementById('admin-titulo').value = item.titulo || item.nome || '';
        document.getElementById('admin-categoria').value = item.categoria || '';
        document.getElementById('admin-data').value = item.data || ''; 
        document.getElementById('admin-imagem').value = item.imagem || '';
        document.getElementById('admin-descricao').value = item.conteudo || item.descricao || '';
        document.getElementById('admin-destaque').checked = !!item.destaque; 

        document.getElementById('admin-submit').innerText = 'Salvar Edição';
        document.getElementById('admin-cancel').classList.remove('d-none');
        
        document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error(`Erro ao carregar item para edição ${entity}/${id}:`, error);
        alert(`Erro ao carregar item para edição: ${error.message}.`);
    }
}

async function excluirItem(entity, id) { 
    if (!confirm(`Tem certeza que deseja excluir o item ID ${id} de ${entity}?`)) {
        return;
    }

    try {
        await safeFetchJson(`${ENDPOINTS[entity]}/${id}`, { method: 'DELETE' });

        alert('Item excluído com sucesso!');
        loadAdminTables();

    } catch (error) {
        console.error(`Erro ao excluir item ${entity}/${id}:`, error);
        alert(`Erro ao excluir item: ${error.message}.`);
    }
}


function createTableHtml(items, entity) { 
    if (!items || items.length === 0) {
        return '<p class="text-warning">Nenhum registro encontrado.</p>';
    }

    let html = `
    <table class="table table-dark table-striped table-hover table-sm">
        <thead>
            <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Categoria</th>
                <th>Ano/Data</th>
                <th>Destaque</th>
                <th class="text-end">Ações</th>
            </tr>
        </thead>
        <tbody>
    `;

    items.forEach(it => {
        html += `
        <tr>
            <td>${it.id}</td>
            <td>${escapeHtml(it.titulo || it.nome || '')}</td>
            <td>${escapeHtml(it.categoria || 'N/A')}</td>
            <td>${escapeHtml(it.data || 'N/A')}</td>
            <td>${it.destaque ? 'Sim' : '—'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-warning me-2" onclick="startEdit('${entity}', '${it.id}')">Editar</button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirItem('${entity}', '${it.id}')">Excluir</button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    return html;
}

async function loadAdminTables() { 
    try {
        const { consoles, jogos, noticias } = await fetchAllEntities();
        document.getElementById('table-consoles').innerHTML = createTableHtml(consoles, 'consoles');
        document.getElementById('table-jogos').innerHTML = createTableHtml(jogos, 'jogos');
        document.getElementById('table-noticias').innerHTML = createTableHtml(noticias, 'noticias');
    } catch (error) {
        console.error("Erro ao carregar tabelas admin:", error);
        const errorMessage = `<p class="alert alert-danger">Erro ao carregar dados do servidor: ${error.message}. Certifique-se de que o JSONServer está rodando em ${BASE}.</p>`;
        document.getElementById('table-consoles').innerHTML = errorMessage;
        document.getElementById('table-jogos').innerHTML = errorMessage;
        document.getElementById('table-noticias').innerHTML = errorMessage;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Home page
    if (document.body && document.body.id === 'home-page') {
        montarCarouselJogosDestaque();
        montarSecaoCardsUnificados();
    }
    // Detalhes
    if (document.body && document.body.id === 'detalhes-page') {
        montarDetalhesItem();
    }
    // Admin
    if (document.body && document.body.id === 'admin-page') {
        loadAdminTables();
        
      
        const adminForm = document.getElementById('admin-form');
        if (adminForm) {
            console.log("Formulário admin-form encontrado. Anexando listener.");
            adminForm.addEventListener('submit', salvarItem); 
        } else {
            console.error("ERRO CRÍTICO: Não foi possível encontrar o elemento com ID 'admin-form'. Verifique seu admin.html!");
        }
        
        const btnCancel = document.getElementById('admin-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', resetAdminForm);
        }
        
        resetAdminForm();
    }
});

async function montarGraficos() {
  try {
    const { consoles, jogos, noticias } = await fetchAllEntities();

    // Gráfico 1: Itens por categoria
    const ctx1 = document.getElementById('graficoCategorias');
    if (ctx1) {
      new Chart(ctx1, {
        type: 'pie',
        data: {
          labels: ['Consoles', 'Jogos', 'Notícias'],
          datasets: [{
            data: [consoles.length, jogos.length, noticias.length],
            backgroundColor: ['#ffcc00', '#ff6600', '#ff3300'],
            borderColor: '#111',
            borderWidth: 2
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Distribuição de Itens no Sistema',
              color: '#ffc107'
            },
            legend: { labels: { color: '#fff' } }
          }
        }
      });
    }

    // Gráfico 2: Jogos por Ano
    const ctx2 = document.getElementById('graficoJogosPorAno');
    if (ctx2) {
      const contagem = {};
      jogos.forEach(j => {
        const ano = j.data ? j.data.substring(0, 4) : 'N/A';
        contagem[ano] = (contagem[ano] || 0) + 1;
      });

      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: Object.keys(contagem),
          datasets: [{
            label: 'Jogos por Ano',
            data: Object.values(contagem),
            backgroundColor: '#ffc107'
          }]
        },
        options: {
          scales: {
            x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
            y: { ticks: { color: '#fff' }, grid: { color: '#333' } }
          },
          plugins: {
            title: {
              display: true,
              text: 'Quantidade de Jogos por Ano',
              color: '#ffc107'
            },
            legend: { labels: { color: '#fff' } }
          }
        }
      });
    }

  } catch (error) {
    console.error('Erro ao montar gráficos:', error);
    alert('Erro ao carregar dados para os gráficos: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.id === 'estatisticas-page') {
    montarGraficos();
  }
});