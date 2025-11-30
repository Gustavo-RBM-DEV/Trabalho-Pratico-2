
const API_URL = 'http://localhost:3000';


let allItems = [];
let usuarioLogado = null;
let favoritosUsuario = [];

function carregarUsuario() {
    const usuarioStr = sessionStorage.getItem('usuarioLogado');
    if (usuarioStr) {
        try {
            usuarioLogado = JSON.parse(usuarioStr);
            favoritosUsuario = Array.isArray(usuarioLogado.favoritos) ? usuarioLogado.favoritos : [];
        } catch (e) {
            console.error('Erro ao fazer parse do usuário logado:', e);
            sessionStorage.removeItem('usuarioLogado');
        }
    } else {
        usuarioLogado = null;
        favoritosUsuario = [];
    }
}


function isFavorito(itemId) {
    if (!usuarioLogado) return false;
    return favoritosUsuario.includes(itemId);
}


async function toggleFavorito(itemId, iconElement) {
    if (!usuarioLogado) {
        alert('Você precisa estar logado para marcar favoritos.');
        window.location.href = 'login.html';
        return;
    }

    const isCurrentlyFavorite = isFavorito(itemId);
    let newFavoritos;

    if (isCurrentlyFavorite) {
        newFavoritos = favoritosUsuario.filter(id => id !== itemId);
    } else {
        newFavoritos = [...favoritosUsuario, itemId];
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioLogado.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ favoritos: newFavoritos })
        });

        if (response.ok) {
            usuarioLogado.favoritos = newFavoritos;
            favoritosUsuario = newFavoritos;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            if (newFavoritos.includes(itemId)) {
                iconElement.classList.remove('bi-heart');
                iconElement.classList.add('bi-heart-fill');
            } else {
                iconElement.classList.remove('bi-heart-fill');
                iconElement.classList.add('bi-heart');
            }

            if (document.body.id === 'favoritos-page') {
                loadAndDisplayFavorites();
            }

        } else {
            throw new Error('Falha ao salvar favoritos no servidor.');
        }

    } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
        alert('Erro ao salvar sua preferência de favorito. Tente novamente.');
    }
}


function createFavoriteButton(item, isLarge = false) {
    const isFav = isFavorito(item.id);
    const iconClass = isFav ? 'bi-heart-fill' : 'bi-heart';
    const textClass = isFav ? 'text-danger' : 'text-white-50';
    const fsClass = isLarge ? 'fs-3' : 'fs-5';

    if (!usuarioLogado) {
        return `<i class="bi ${iconClass} ${textClass} ${fsClass}" title="Faça login para favoritar"></i>`;
    }

    return `<i class="bi ${iconClass} ${textClass} ${fsClass}" data-item-id="${item.id}" title="Marcar como Favorito"></i>`;
}


function renderizarCabecalho() {
    const navActions = document.getElementById('main-nav-actions');
    if (!navActions) return; 

    navActions.innerHTML = '';

    if (usuarioLogado && usuarioLogado.admin) {
        navActions.innerHTML += `
            <a href="admin.html" class="btn btn-outline-warning me-2">Gerenciar Conteúdos</a>
        `;
    }

    if (usuarioLogado) {
        navActions.innerHTML += `
            <a href="favoritos.html" class="btn btn-outline-light me-2">Meus Favoritos</a>
            <span class="text-warning me-2 d-none d-md-inline-block">Olá, ${usuarioLogado.login}!</span>
            <button class="btn btn-warning" onclick="handleLogout()">Logout</button>
        `;
    } else {
        navActions.innerHTML += `
            <a href="login.html" class="btn btn-warning">Login / Cadastro</a>
        `;
    }
    
    navActions.innerHTML += `
        <a href="estatisticas.html" class="btn btn-outline-info ms-2">Estatísticas</a>
    `;
}

function handleLogout() {
    sessionStorage.removeItem('usuarioLogado');
    usuarioLogado = null;
    favoritosUsuario = [];
    window.location.reload(); 
}

function renderizarCarrossel(items) {
    const carouselInner = document.getElementById('carousel-inner');
    if (!carouselInner) return;

    const destaqueItems = items.filter(item => item.destaque).slice(0, 3);
    let html = '';

    destaqueItems.forEach((item, index) => {
        html += `
            <div class="carousel-item ${index === 0 ? 'active' : ''}" data-bs-interval="5000">
                <a href="detalhes.html?id=${item.id}&type=${item.categoria.toLowerCase()}">
                    <img src="${item.imagem}" class="d-block w-100" alt="${item.titulo}">
                    <div class="carousel-caption d-none d-md-block">
                        <h5>${item.titulo}</h5>
                        <p>${item.descricao}</p>
                    </div>
                </a>
            </div>
        `;
    });
    carouselInner.innerHTML = html || '<p class="text-center text-warning">Nenhum item em destaque encontrado.</p>';
}

function renderizarCards(itemsToRender) {
    const itemCardsContainer = document.getElementById('item-cards');
    const noResultsMessage = document.getElementById('no-results-message') || document.getElementById('mensagem-vazio');

    if (!itemCardsContainer || !noResultsMessage) return;

    if (itemsToRender.length === 0) {
        itemCardsContainer.innerHTML = '';
        noResultsMessage.classList.remove('d-none');
        return;
    }

    noResultsMessage.classList.add('d-none');
    let cardsHTML = '';

    itemsToRender.forEach(item => {
        const favButtonHTML = createFavoriteButton(item);
        const tipo = item.categoria.toLowerCase();
        cardsHTML += `
            <div class="col">
                <div class="card bg-dark border-warning h-100 item-card">
                    <img src="${item.imagem}" class="card-img-top" alt="${item.titulo}" style="height: 200px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start">
                            <h5 class="card-title">${item.titulo}</h5>
                            <button class="btn btn-link p-0 fav-button" data-item-id="${item.id}" onclick="toggleFavorito('${item.id}', this.querySelector('i'))" title="Favoritar">
                                ${favButtonHTML}
                            </button>
                        </div>
                        <p class="card-text">${item.descricao}</p>
                        <a href="detalhes.html?id=${item.id}&type=${tipo}" class="btn btn-outline-warning mt-auto">Ver Detalhes</a>
                    </div>
                </div>
            </div>
        `;
    });

    itemCardsContainer.innerHTML = cardsHTML;
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : ''; 
    
    if (searchTerm === '') {
        renderizarCards(allItems);
        return;
    }

    const filteredItems = allItems.filter(item =>
        item.titulo.toLowerCase().includes(searchTerm) ||
        item.descricao.toLowerCase().includes(searchTerm) ||
        item.categoria.toLowerCase().includes(searchTerm)
    );
    renderizarCards(filteredItems);
}

function handleClearSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    handleSearch(); 
}

function setupSearchListeners() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search-button');
    const searchButton = document.getElementById('search-button');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    if (searchButton) {
        searchButton.addEventListener('click', (e) => e.preventDefault());
    }
    if (clearButton) {
        clearButton.addEventListener('click', handleClearSearch);
    }
}

function renderizarDetalhes(item) {
    const detalhesContainer = document.getElementById('detalhes-item');
    if (!detalhesContainer || !item) {
        detalhesContainer.innerHTML = `<div class="alert alert-danger text-center" role="alert">Item não encontrado ou URL inválida.</div>`;
        return;
    }

    const favButtonHTML = createFavoriteButton(item, true); 
    const tipo = item.categoria.toLowerCase();

    detalhesContainer.innerHTML = `
        <div class="card bg-dark border-warning shadow-lg p-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-4 mb-3 mb-md-0">
                        <img src="${item.imagem}" class="img-fluid rounded border border-warning" alt="${item.titulo}">
                    </div>
                    <div class="col-md-8 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h2 class="display-5 text-glow">${item.titulo}</h2>
                            <button id="fav-detail-button" class="btn btn-link p-0" data-item-id="${item.id}" onclick="toggleFavorito('${item.id}', this.querySelector('i'))" title="Favoritar">
                                ${favButtonHTML}
                            </button>
                        </div>
                        
                        <div class="mb-3">
                            <span class="badge bg-warning text-dark me-2">${item.categoria}</span>
                            <span class="badge bg-secondary">${item.data ? new Date(item.data).toLocaleDateString('pt-BR') : 'Data Desconhecida'}</span>
                        </div>

                        <p class="lead text-white-50">${item.descricao}</p>

                        <hr class="border-warning my-3">

                        <div class="text-white-50 mb-2 flex-grow-1">
                            <h4>Conteúdo Completo:</h4>
                            <p>${item.conteudo}</p>
                        </div>
                        <a href="index.html" class="btn btn-outline-warning mt-auto w-100">← Voltar à Home</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadAndDisplayFavorites() {
    const itemCardsContainer = document.getElementById('item-cards'); 
    const mensagemVazio = document.getElementById('mensagem-vazio');
    const titulo = document.querySelector('#lista-favoritos h2');

    if (!itemCardsContainer || !mensagemVazio || !titulo) return;
    
    if (!usuarioLogado) {
        titulo.textContent = 'Acesso Negado';
        itemCardsContainer.innerHTML = '';
        mensagemVazio.innerHTML = 'Você precisa estar logado para ver seus favoritos. <a href="login.html" class="text-warning">Clique aqui para fazer login.</a>';
        mensagemVazio.classList.remove('d-none');
        return;
    }
    
    const favoriteItems = allItems.filter(item => favoritosUsuario.includes(item.id));

    if (favoriteItems.length === 0) {
        titulo.textContent = 'Itens Favoritados'; 
        itemCardsContainer.innerHTML = '';
        mensagemVazio.innerHTML = 'Você ainda não tem itens favoritos. Navegue e adicione alguns!';
        mensagemVazio.classList.remove('d-none');
        return;
    }
    
    titulo.textContent = `Itens Favoritados (${favoriteItems.length})`; 
    mensagemVazio.classList.add('d-none');
    renderizarCards(favoriteItems); 
}

function renderizarResumoDados() {
    const counts = allItems.reduce((acc, item) => {
        const categoria = (item.categoria || '').toLowerCase(); 
        if (categoria.includes('console')) acc.consoles++;
        else if (categoria.includes('jogo')) acc.jogos++;
        else if (categoria.includes('notíci') || categoria.includes('noticia')) acc.noticias++; 
        return acc;
    }, { consoles: 0, jogos: 0, noticias: 0 });

    const totalConsolesEl = document.getElementById('total-consoles');
    const totalJogosEl = document.getElementById('total-jogos');
    const totalNoticiasEl = document.getElementById('total-noticias');

    if (totalConsolesEl) totalConsolesEl.textContent = counts.consoles;
    if (totalJogosEl) totalJogosEl.textContent = counts.jogos;
    if (totalNoticiasEl) totalNoticiasEl.textContent = counts.noticias;
}

function renderizarGraficoCategoriasHome() {
    const canvas = document.getElementById('graficoCategoriasHome');
    // Verifica se a biblioteca Chart.js está carregada
    if (!canvas || typeof Chart === 'undefined') return; 
    
    const ctx = canvas.getContext('2d');
    
    const categoriaCounts = allItems.reduce((acc, item) => {
        const categoria = item.categoria || 'Outros';
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(categoriaCounts);
    const data = Object.values(categoriaCounts);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Itens por Categoria',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)', 
                    'rgba(54, 162, 235, 0.7)', 
                    'rgba(255, 206, 86, 0.7)', 
                    'rgba(75, 192, 192, 0.7)'  
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });
}

function renderizarGraficoCategorias() {
    const ctx = document.getElementById('graficoCategorias')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const categoriaCounts = allItems.reduce((acc, item) => {
        const categoria = item.categoria || 'Outros';
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
    }, {});

    const labels = Object.keys(categoriaCounts);
    const data = Object.values(categoriaCounts);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Itens por Categoria',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                },
                title: {
                    display: true,
                    text: 'Distribuição de Conteúdo por Categoria',
                    color: '#ffc107'
                }
            }
        }
    });
}

function renderizarGraficoJogosPorAno() {
    const ctx = document.getElementById('graficoJogosPorAno')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const jogosPorAno = allItems
        .filter(item => item.categoria.toLowerCase() === 'jogo' && item.data)
        .reduce((acc, item) => {
            const dateMatch = item.data.match(/(\d{4})/);
            const ano = dateMatch ? dateMatch[1] : 'Desconhecido';
            
            acc[ano] = (acc[ano] || 0) + 1;
            return acc;
        }, {});

    const labels = Object.keys(jogosPorAno).sort((a, b) => {
        if (a === 'Desconhecido') return 1;
        if (b === 'Desconhecido') return -1;
        return parseInt(a) - parseInt(b);
    });
    const data = labels.map(ano => jogosPorAno[ano]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade de Jogos',
                data: data,
                backgroundColor: 'rgba(255, 165, 0, 0.8)',
                borderColor: 'rgba(255, 165, 0, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e0e0e0',
                        stepSize: 1 
                    },
                    grid: {
                        color: 'rgba(255, 193, 7, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e0e0e0'
                    },
                    grid: {
                        color: 'rgba(255, 193, 7, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                },
                title: {
                    display: true,
                    text: 'Lançamento de Jogos Clássicos por Ano',
                    color: '#ffc107'
                }
            }
        }
    });
}

function showFeedback(message, isSuccess) {
    const feedbackEl = document.getElementById('form-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = message;
        feedbackEl.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-warning');
        feedbackEl.classList.add(isSuccess ? 'alert-success' : 'alert-danger');
    }
    setTimeout(() => {
        feedbackEl.classList.remove('alert-success', 'alert-danger'); 
        feedbackEl.classList.add('d-none', 'alert-warning');
    }, 5000);
}

function handleClearForm() {
    document.getElementById('admin-form')?.reset();
    document.getElementById('item-id').value = ''; 
    document.getElementById('save-button').textContent = 'Salvar Item'; 
    showFeedback('Formulário limpo e pronto para novo cadastro.', true);
}

async function handleAdminFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('item-id').value;
    const collectionName = document.getElementById('item-tipo').value;
    const titulo = document.getElementById('item-titulo').value;
    const descricao = document.getElementById('item-descricao').value;
    const imagem = document.getElementById('item-imagem').value;
    const data = document.getElementById('item-data').value;
    const conteudo = document.getElementById('item-conteudo').value;
    const destaque = document.getElementById('item-destaque').checked;

    if (!collectionName || !titulo || !descricao || !imagem || !data || !conteudo) {
        showFeedback('Preencha todos os campos obrigatórios!', false);
        return;
    }

    const itemPayload = {
        titulo,
        descricao,
        imagem,
        data,
        conteudo,
        destaque,
    };
    
    let url = `${API_URL}/${collectionName}`;
    let method = 'POST';
    
    if (id) {
        method = 'PUT'; 
        url = `${API_URL}/${collectionName}/${id}`;
        itemPayload.id = id; 
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itemPayload)
        });

        if (response.ok) {
            const action = id ? 'editado' : 'cadastrado';
            showFeedback(`Item ${action} com sucesso!`, true);
            handleClearForm(); 
            await carregarDadosGlobais(); 
            renderizarTabelaAdmin(); 
        } else {
            const errorText = await response.text();
            throw new Error(`Falha no servidor. Status: ${response.status}. Resposta: ${errorText}`);
        }
    } catch (error) {
        showFeedback(`Erro: Não foi possível salvar o item. Verifique se o JSON Server está rodando.`, false);
        console.error('Erro de CRUD:', error);
    }
}


function renderizarTabelaAdmin() {
    const tableBodyConsoles = document.getElementById('table-body-consoles');
    const tableBodyJogos = document.getElementById('table-body-jogos');
    const tableBodyNoticias = document.getElementById('table-body-noticias');

    if (!tableBodyConsoles || !tableBodyJogos || !tableBodyNoticias) return;

    tableBodyConsoles.innerHTML = '';
    tableBodyJogos.innerHTML = '';
    tableBodyNoticias.innerHTML = '';

    allItems.forEach(item => {
        const isDestaque = item.destaque ? 'Sim' : 'Não';
        const itemCategoria = item.categoria.toLowerCase();

        let collectionName;
        if (itemCategoria === 'console') collectionName = 'consoles';
        else if (itemCategoria === 'jogo') collectionName = 'jogos';
        else if (itemCategoria === 'notícia' || itemCategoria === 'noticia') collectionName = 'noticias';
        else return; 

        const rowHTML = `
            <tr>
                <td>${item.id.substring(0, 4)}...</td>
                <td>${item.titulo}</td>
                <td>${item.descricao.substring(0, 50)}...</td>
                <td>${isDestaque}</td>
                <td>
                    <button class="btn btn-sm btn-info me-2" onclick="handleEditItem('${item.id}', '${item.categoria}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="handleDeleteItem('${item.id}', '${collectionName}')">Excluir</button>
                </td>
            </tr>
        `;

        switch (collectionName) {
            case 'consoles':
                tableBodyConsoles.innerHTML += rowHTML;
                break;
            case 'jogos':
                tableBodyJogos.innerHTML += rowHTML;
                break;
            case 'noticias':
                tableBodyNoticias.innerHTML += rowHTML;
                break;
        }
    });
}

function handleEditItem(id, tipo) {
    const item = allItems.find(i => i.id === id && i.categoria.toLowerCase() === tipo.toLowerCase());

    if (!item) {
        showFeedback('Item não encontrado para edição.', false);
        return;
    }

    const collectionName = item.categoria.toLowerCase() + 's'; 

    document.getElementById('item-id').value = item.id;
    document.getElementById('item-tipo').value = collectionName;
    document.getElementById('item-titulo').value = item.titulo;
    document.getElementById('item-descricao').value = item.descricao;
    document.getElementById('item-imagem').value = item.imagem;
    document.getElementById('item-data').value = item.data?.split('T')[0] || ''; 
    document.getElementById('item-conteudo').value = item.conteudo;
    document.getElementById('item-destaque').checked = item.destaque;
    document.getElementById('save-button').textContent = 'Salvar Alterações';

    showFeedback(`Item "${item.titulo}" carregado para edição.`, true);
    document.getElementById('admin-form').scrollIntoView({ behavior: 'smooth' });
}

async function handleDeleteItem(id, collectionName) {
    if (confirm(`Tem certeza que deseja EXCLUIR o item ${id} da coleção ${collectionName}? Essa ação não pode ser desfeita.`)) {
        try {
            const response = await fetch(`${API_URL}/${collectionName}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showFeedback('Item excluído com sucesso! Atualizando lista.', true);
                await carregarDadosGlobais();
                renderizarTabelaAdmin();
            } else {
                const errorText = await response.text();
                throw new Error(`Falha ao excluir item. Status: ${response.status}. Resposta: ${errorText}`);
            }
        } catch (error) {
            showFeedback(`Erro ao excluir item. Consulte o console. Erro: ${error.message}`, false);
            console.error('Erro ao excluir item:', error);
        }
    }
}

async function carregarDadosGlobais() {
    return new Promise(async (resolve, reject) => {
        try {
            const collections = ['consoles', 'jogos', 'noticias'];
            const fetchPromises = collections.map(collection => 
                fetch(`${API_URL}/${collection}`).then(res => res.json())
            );

            const results = await Promise.all(fetchPromises);
            
            allItems = results.flatMap((items, index) => {
                const collectionName = collections[index];
                const categoria = collectionName.slice(0, -1); 
                return items.map(item => ({ 
                    ...item, 
                    categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1)
                }));
            });
            
            allItems.sort((a, b) => new Date(b.data) - new Date(a.data)); 
            
            resolve(allItems);
        } catch (error) {
            console.error('Erro ao carregar dados globais:', error);
            if (document.getElementById('item-cards')) {
                document.getElementById('item-cards').innerHTML = 
                '<p class="text-center text-danger">Não foi possível carregar os dados. Certifique-se de que o JSON Server está rodando (http://localhost:3000).</p>';
            }
            reject(error);
        }
    });
}


function iniciarHomePage() {
    carregarUsuario();
    renderizarCabecalho();
    carregarDadosGlobais().then(items => {
        renderizarCarrossel(items);
        renderizarCards(items);
        // CORREÇÃO: Chamadas de estatísticas para a Home Page
        renderizarGraficoCategoriasHome(); 
        renderizarResumoDados();          
    }).catch(error => {
        console.error('Falha ao iniciar Home Page:', error);
        alert('Não foi possível carregar o conteúdo principal. Verifique o JSON Server.');
    });
    setupSearchListeners();
}

function iniciarAdminPage() {
    carregarUsuario(); 
    renderizarCabecalho();

    const adminContent = document.getElementById('admin-content');
    const accessDenied = document.getElementById('access-denied');
    const adminForm = document.getElementById('admin-form');
    const clearButton = document.getElementById('clear-form-button');

    if (usuarioLogado && usuarioLogado.admin) {
        accessDenied?.classList.add('d-none');
        adminContent?.classList.remove('d-none');
        
        if (adminForm) {
            adminForm.addEventListener('submit', handleAdminFormSubmit);
        }
        if (clearButton) {
            clearButton.addEventListener('click', handleClearForm);
        }

        carregarDadosGlobais().then(() => {
             renderizarTabelaAdmin(); 
        }).catch(error => {
            console.error('Falha ao carregar Admin Page:', error);
            showFeedback('Não foi possível carregar os dados. Verifique o JSON Server.', false);
        });
    } else {
        accessDenied?.classList.remove('d-none');
        adminContent?.classList.add('d-none');
    }
}


function iniciarDetalhesPage() {
    carregarUsuario();
    renderizarCabecalho();

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const itemType = urlParams.get('type');

    if (itemId && itemType) {
        carregarDadosGlobais().then(() => {
            const item = allItems.find(i => i.id === itemId && i.categoria.toLowerCase() === itemType.toLowerCase());

            if (item) {
                renderizarDetalhes(item); 
            } else {
                const detalhesItem = document.getElementById('detalhes-item');
                if (detalhesItem) detalhesItem.innerHTML = `<div class="alert alert-warning text-center" role="alert">Item com ID ${itemId} não encontrado.</div>`;
            }
        });
    } else {
        const detalhesItem = document.getElementById('detalhes-item');
        if (detalhesItem) detalhesItem.innerHTML = `<div class="alert alert-danger text-center" role="alert">ID do item não especificado.</div>`;
    }
}


function iniciarFavoritosPage() {
    carregarUsuario();
    renderizarCabecalho();
    carregarDadosGlobais().then(() => {
        loadAndDisplayFavorites(); 
    }).catch(error => {
        console.error('Falha ao iniciar Favoritos Page:', error);
        alert('Não foi possível carregar o conteúdo. Verifique o JSON Server.');
    });
}


function iniciarEstatisticasPage() {
    carregarUsuario();
    renderizarCabecalho();
    carregarDadosGlobais().then(() => {
        renderizarGraficoCategorias();
        renderizarGraficoJogosPorAno();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const pageId = document.body.id;

    switch (pageId) {
        case 'home-page':
            iniciarHomePage();
            break;
        case 'admin-page':
            iniciarAdminPage();
            break;
        case 'detalhes-page':
            iniciarDetalhesPage();
            break;
        case 'favoritos-page':
            iniciarFavoritosPage();
            break;
        case 'estatisticas-page':
            iniciarEstatisticasPage();
            break;
        case 'login-page':
            break;
        default:
            console.log("Página desconhecida ou sem inicialização específica.");
    }
});