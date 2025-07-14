// Este código seria adicionado em um <script> no final do body ou em um arquivo JS separado
document.addEventListener('DOMContentLoaded', () => {
    const tickerContent = document.querySelector('.ticker-content');
    if (!tickerContent) return;

    // Duplicar o conteúdo para rolagem contínua (se não foi feito no HTML)
    tickerContent.innerHTML += tickerContent.innerHTML; 

    let scrollPos = 0;
    const scrollSpeed = 0.5; // Ajuste para a velocidade (pixels por frame/intervalo)

    function animateTicker() {
        scrollPos += scrollSpeed;
        if (scrollPos >= tickerContent.scrollWidth / 2) { // Quando a metade do conteúdo original rolou
            scrollPos = 0; // Volta para o início da primeira cópia
        }
        tickerContent.style.transform = `translateX(-${scrollPos}px)`;
        requestAnimationFrame(animateTicker); // Otimizado para animação do navegador
    }

    animateTicker();

    // Opcional: Pausar ao passar o mouse
    tickerContent.addEventListener('mouseenter', () => {
        tickerContent.style.animationPlayState = 'paused';
    });

    tickerContent.addEventListener('mouseleave', () => {
        tickerContent.style.animationPlayState = 'running';
    });
});