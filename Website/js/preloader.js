// Lógica do Preloader
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const body = document.body;

    // Remove a classe 'hidden' do body para exibir o conteúdo
    body.classList.remove('hidden');

    // Adiciona a classe 'hidden' ao preloader para iniciar a transição de opacidade
    preloader.classList.add('hidden');
});

// Fecha o menu se o usuário clicar fora dele
document.addEventListener('click', (event) => {
    const userBox = document.querySelector('.user-box');
    const userMenu = document.getElementById('userMenu');
    if (!userBox.contains(event.target) && userMenu.style.display === 'block') {
        userMenu.style.display = 'none';
    }
});