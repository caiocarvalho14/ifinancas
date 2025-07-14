document.addEventListener('DOMContentLoaded', () => {
    const adminButton = document.getElementById('adminButton');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal')); // Cria uma instância do modal
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginErrorMessage = document.getElementById('loginErrorMessage');

    // Listener para o formulário de login (dentro do modal)
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        const username = usernameInput.value;
        const password = passwordInput.value;

        // Lógica de autenticação simples
        if (username === 'admin' && password === 'admin') {
            loginErrorMessage.classList.add('d-none'); // Esconde a mensagem de erro
            loginModal.hide(); // Esconde o modal
            window.location.href = '../admin/admin.html'; // Redireciona para a página de administração
        } else {
            loginErrorMessage.classList.remove('d-none'); // Mostra a mensagem de erro
        }
    });

    // Opcional: Limpar campos e esconder erro quando o modal for fechado
    const modalElement = document.getElementById('loginModal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        loginForm.reset(); // Limpa os campos do formulário
        loginErrorMessage.classList.add('d-none'); // Esconde a mensagem de erro
    });
})