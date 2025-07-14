document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('post-form');
    const clearButton = document.getElementById('clear-btn');
    const saveButton = form.querySelector('button[type="submit"]');
    const dateInput = document.getElementById('post-date');

    // Novos elementos para o campo de imagem
    const imageUrlInput = document.getElementById('post-image-url');
    const imagePreviewDisplay = document.getElementById('image-preview-display');

    // IMPORTANTE: Substitua pela URL do seu App da Web do Google Apps Script
    // Esta URL parece ser a sua implantação mais recente. Mantenha-a se estiver correta.
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzxF0ox5X0ILiQfWsaoTz_7mc-soPDCJc-Czg1PgD-1PYuVjQbAxgHl4nRJTil8bCT7aw/exec";

    // Define a data atual no campo de data ao carregar a página
    if (dateInput) {
        // Formata a data para YYYY-MM-DD para compatibilidade com input type="date"
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    // Função para atualizar a pré-visualização da imagem
    const updateImagePreview = () => {
        const url = imageUrlInput.value.trim();
        imagePreviewDisplay.innerHTML = ''; // Limpa o conteúdo anterior

        if (url) {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                imagePreviewDisplay.appendChild(img);
            };
            img.onerror = () => {
                imagePreviewDisplay.innerHTML = `<span>URL inválida ou imagem não carregada.</span>`;
            };
        } else {
            imagePreviewDisplay.innerHTML = `<span>Pré-visualização</span>`;
        }
    };

    // Adiciona o listener para atualizar a pré-visualização ao digitar
    imageUrlInput.addEventListener('input', updateImagePreview);

    // Adiciona o listener para atualizar a pré-visualização ao carregar, caso já tenha URL
    // Isso é útil se você estiver editando um post existente e a URL já esteja lá
    updateImagePreview(); 

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        saveButton.disabled = true;
        saveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...`;

        const formData = new FormData(form);

        // O FormData já coleta automaticamente o campo 'url_imagem'
        // Mas se precisar ver, você pode fazer:
        // console.log("URL da Imagem enviada:", formData.get('url_imagem'));

        try {
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.result === "success") {
                alert('Post salvo com sucesso na planilha!');
                form.reset();
                // Redefine a data e limpa a pré-visualização após o reset do formulário
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                dateInput.value = `${year}-${month}-${day}`;
                updateImagePreview(); // Limpa a visualização
            } else {
                throw new Error(data.message || 'Ocorreu um erro desconhecido ao salvar.');
            }
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            alert(`Falha ao salvar o post: ${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Salvar Post';
        }
    });

    clearButton.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja limpar todos os campos?")) {
            form.reset();
            // Redefine a data e limpa a pré-visualização após o reset do formulário
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            dateInput.value = `${year}-${month}-${day}`;
            updateImagePreview(); // Limpa a visualização
        }
    });
});