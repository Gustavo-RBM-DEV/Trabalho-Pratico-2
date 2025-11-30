// URL base do JSON Server
const API_URL = 'http://localhost:3000';

/**
 * Função utilitária para gerar um UUID (Identificador Único Universal) simples
 * @returns {string} Um novo UUID.
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Realiza o login do usuário.
 */
async function handleLogin(event) {
  event.preventDefault();
  const login = document.getElementById('login-email').value;
  const senha = document.getElementById('login-senha').value;
  const feedback = document.getElementById('login-feedback');
  feedback.classList.add('d-none');

  try {
    // 1. Buscar usuário por login ou email
    const response = await fetch(`${API_URL}/usuarios?q=${login}`);
    if (!response.ok) throw new Error('Erro ao buscar usuários.');
    
    const usuarios = await response.json();
    const usuario = usuarios.find(u => (u.login === login || u.email === login) && u.senha === senha);

    if (usuario) {
      // 2. Login bem-sucedido: Salvar no sessionStorage e redirecionar
      sessionStorage.setItem('usuarioLogado', JSON.stringify(usuario));
      window.location.href = 'index.html'; // Redireciona para a Home
    } else {
      // 3. Login falhou
      feedback.textContent = 'Login ou senha inválidos.';
      feedback.classList.remove('d-none');
    }

  } catch (error) {
    console.error('Erro no processo de login:', error);
    feedback.textContent = 'Erro ao conectar com o servidor. Tente novamente mais tarde.';
    feedback.classList.remove('d-none');
  }
}

/**
 * Realiza o cadastro de um novo usuário.
 */
async function handleCadastro(event) {
  event.preventDefault();
  const nome = document.getElementById('cadastro-nome').value;
  const email = document.getElementById('cadastro-email').value;
  const login = document.getElementById('cadastro-login').value;
  const senha = document.getElementById('cadastro-senha').value;
  const feedback = document.getElementById('cadastro-feedback');
  feedback.classList.add('d-none');

  try {
    // 1. Verificar se o login ou email já existem
    const checkResponse = await fetch(`${API_URL}/usuarios?login=${login}&email=${email}`);
    const existingUsers = await checkResponse.json();
    
    // Verifica se algum usuário já tem o mesmo login OU o mesmo email
    const loginExists = existingUsers.some(u => u.login === login);
    const emailExists = existingUsers.some(u => u.email === email);

    if (loginExists) {
      feedback.textContent = 'O login escolhido já está em uso.';
      feedback.classList.remove('d-none');
      return;
    }

    if (emailExists) {
      feedback.textContent = 'O email escolhido já está em uso.';
      feedback.classList.remove('d-none');
      return;
    }

    // 2. Criar novo objeto de usuário
    const novoUsuario = {
      id: uuidv4(),
      nome,
      email,
      login,
      senha,
      admin: false, // Novos usuários não são administradores por padrão
      favoritos: [] // Começa sem favoritos
    };

    // 3. Enviar para o JSON Server
    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novoUsuario)
    });

    if (response.ok) {
      // 4. Cadastro bem-sucedido: Login automático e redirecionamento
      sessionStorage.setItem('usuarioLogado', JSON.stringify(novoUsuario));
      alert('Cadastro realizado com sucesso! Você está logado.');
      window.location.href = 'index.html';
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro desconhecido ao cadastrar.');
    }

  } catch (error) {
    console.error('Erro no processo de cadastro:', error);
    feedback.textContent = `Falha no cadastro: ${error.message}`;
    feedback.classList.remove('d-none');
  }
}

// Associa os listeners de evento aos formulários
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const cadastroForm = document.getElementById('cadastro-form');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', handleCadastro);
  }
});