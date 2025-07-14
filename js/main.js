document.addEventListener('DOMContentLoaded', () => {
    const slugify = (text) => {
        if (!text) return '';
        const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
        const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrssssssttuuuuuuuuuwxyyzzz------'
        const p = new RegExp(a.split('').join('|'), 'g')

        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(p, c => b.charAt(a.indexOf(c)))
            .replace(/&/g, '-and-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '')
    };

    const parseBrazilianDate = (brazilianDate) => {
        if (!brazilianDate || typeof brazilianDate !== 'string') return null;
        // Tenta parsear "DD/MM/YYYY HH:mm:ss" ou "YYYY-MM-DD"
        const partsDateTime = brazilianDate.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
        if (partsDateTime) {
            return new Date(`${partsDateTime[3]}-${partsDateTime[2]}-${partsDateTime[1]}T${partsDateTime[4]}:${partsDateTime[5]}:${partsDateTime[6]}`);
        }
        const partsDate = brazilianDate.match(/(\d{4})-(\d{2})-(\d{2})/); // Para o formato YYYY-MM-DD do input type="date"
        if (partsDate) {
            return new Date(`${partsDate[1]}-${partsDate[2]}-${partsDate[3]}T00:00:00`); // Assume 00:00:00 se for apenas data
        }
        return null;
    };


    const timeAgo = (dateString) => {
        const date = parseBrazilianDate(dateString);

        if (!date || isNaN(date.getTime())) {
            return `Data inválida`;
        }

        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 0) {
            return `em breve`; // Para datas futuras
        }
        if (seconds < 60) {
            return `agora mesmo`;
        }

        let interval = seconds / 31536000; // Anos
        if (interval >= 1) {
            const years = Math.floor(interval);
            return `há ${years} ${years === 1 ? 'ano' : 'anos'}`;
        }
        interval = seconds / 2592000; // Meses
        if (interval >= 1) {
            const months = Math.floor(interval);
            return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
        }
        interval = seconds / 86400; // Dias
        if (interval >= 1) {
            const days = Math.floor(interval);
            return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
        }
        interval = seconds / 3600; // Horas
        if (interval >= 1) {
            const hours = Math.floor(interval);
            return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        }

        const minutes = Math.floor(seconds / 60); // Minutos
        return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    };

    // ATENÇÃO: Substitua por sua URL de planilha de publicação CSV REAL
    // Certifique-se de que a planilha esteja publicada para a web como CSV.
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQinF35CmNFHuIleJkxG5UeruF0nDeTRtj1JhnxwPWHN6G3FlD-4e6LVSFOHJtdtVWAEILyuiPDVlgQ/pub?gid=0&single=true&output=csv'; // SUA URL AQUI
    const container = document.getElementById('cards-container'); // Certifique-se que você tem um elemento com este ID no seu HTML

    // Adiciona um estado de carregamento inicial
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2 text-muted">Carregando posts...</p>
            </div>
        `;
    }


    fetch(sheetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar a planilha. Verifique o link e as permissões de compartilhamento.');
            }
            return response.text();
        })
        .then(csvText => {
            console.log("--- Conteúdo CSV Bruto ---");
            console.log(csvText);

            const rows = csvText.trim().split(/\r?\n/);
            console.log("Linhas de CSV (após split):", rows);

            if (rows.length <= 1) { // Apenas o cabeçalho ou planilha vazia
                if (container) {
                    container.innerHTML = '<p class="text-center text-muted col-12">Nenhum post encontrado na planilha.</p>';
                }
                return;
            }

            // Remove a primeira linha (cabeçalho) e remove aspas duplas e espaços extras
            const headers = rows.shift().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            console.log("Cabeçalhos da planilha:", headers);

            const getIndex = (name) => headers.findIndex(header => header.toLowerCase() === name.toLowerCase());

            // Mapeia os índices das colunas da sua planilha
            const indices = {
                dataehora: getIndex('dataehora'),
                titulo: getIndex('titulo'),
                subtitulo: getIndex('subtitulo'),
                categoria: getIndex('categoria'),
                autor: getIndex('autor'),
                data: getIndex('data'), // Data do formulário YYYY-MM-DD
                conteudo: getIndex('conteudo'),
                url_imagem: getIndex('url_imagem') // <--- NOVO: Índice para a URL da imagem
            };
            console.log("Índices das colunas:", indices);

            const cardsHtml = rows.map((rowStr, index) => {
                console.log(`\n--- Processando Linha ${index + 1} (Dados): ---`);
                console.log("Linha bruta:", rowStr);

                // Regex robusta para dividir a linha, tratando vírgulas dentro de aspas duplas
                const row = rowStr.match(/(?:[^,"]+|"[^"]*")+/g);

                if (!row) {
                    console.warn(`Linha ${index + 1} não pôde ser parseada. Pulando. Linha: "${rowStr}"`);
                    return ''; // Retorna string vazia se a linha estiver vazia ou mal formatada
                }

                // Garante que cada item da linha tenha as aspas removidas e esteja limpo
                const cleanedRow = row.map(item => item.trim().replace(/^"|"$/g, ''));
                console.log("Linha parseada (cleanedRow):", cleanedRow);
                const getData = (idx) => {
                    const value = (idx !== -1 && cleanedRow[idx]) ? cleanedRow[idx] : '';
                    console.log(`  - Campo ${headers[idx] || 'N/A'} (índice ${idx}): "${value}"`);
                    return value;
                };
                const postTitle = getData(indices.titulo);
                const postSlug = slugify(postTitle);
                const timeSincePost = timeAgo(getData(indices.dataehora)); // Usa dataehora para o cálculo de tempo
                const imageUrl = getData(indices.url_imagem);
                const defaultImageUrl = 'https://www.consultoriarr.com.br/wp-content/uploads/2023/05/Qual-e-a-diferenca-entre-contabilidade-e-financas.jpeg'; // Imagem padrão caso não haja URL ou erro

                // Verifica se há dados essenciais para criar o card
                if (!postTitle || postTitle === 'N/A' || !postSlug) {
                    console.warn(`Dados insuficientes para criar o card na linha ${index + 1}. Título: "${postTitle}". Pulando.`);
                    return '';
                }
                return `
                    <div class="col-lg-4 col-md-6 mb-4 d-flex align-items-stretch">
                        <div class="card h-100 w-100 shadow-sm">
                            <img 
                                src="${imageUrl || defaultImageUrl}" 
                                class="card-img-top" 
                                alt="${postTitle || 'Miniatura do post'}" 
                                onerror="this.onerror=null;this.src='${defaultImageUrl}';" 
                                style="height: 180px; object-fit: cover;"
                            >
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${postTitle || 'Título Indisponível'}</h5>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="badge bg-primary text-white fw-normal">${getData(indices.categoria) || 'Sem Categoria'}</span>
                                    <small class="text-muted">${timeSincePost}</small>
                                </div>
                                <p class="card-text flex-grow-1">${getData(indices.subtitulo) || 'Subtítulo Indisponível'}</p>
                                <a href="pages/post.html?titulo=${postSlug}" class="btn btn-primary mt-auto align-self-start">LER MAIS</a>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (container) {
                container.innerHTML = cardsHtml || '<p class="text-center text-muted col-12">Nenhum post válido encontrado na planilha.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar posts:', error);
            if (container) {
                container.innerHTML = `<div class="col-12"><div class="alert alert-danger" role="alert"><strong>Falha ao carregar posts:</strong> ${error.message}<br>Verifique se o ID da planilha está correto e se ela está publicada para a web como CSV.</div></div>`;
            }
        });


        // 
    // ... SEU CÓDIGO EXISTENTE PARA SLUGIFY, PARSEDATE, TIMEAGO, TICKERS ...
    // Certifique-se de que este código esteja dentro do seu DOMContentLoaded listener.

    // --- Nova Funcionalidade de Login ---
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
            window.location.href = 'admin/admin.html'; // Redireciona para a página de administração
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
});