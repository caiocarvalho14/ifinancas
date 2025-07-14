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
                    .replace(/-+$/, '');
            };

            const parseDateForDisplay = (dateString) => {
                if (!dateString || typeof dateString !== 'string') return 'Data desconhecida';

                const partsDate = dateString.match(/(\d{4})-(\d{2})-(\d{2})/); // Formato YYYY-MM-DD do input type="date"
                const partsDateTime = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/); // Formato DD/MM/YYYY

                let date;
                if (partsDate) {
                    date = new Date(partsDate[1], partsDate[2] - 1, partsDate[3]);
                } else if (partsDateTime) {
                    date = new Date(partsDateTime[3], partsDateTime[2] - 1, partsDateTime[1]);
                } else {
                    return 'Data inválida';
                }

                if (isNaN(date.getTime())) {
                    return 'Data inválida';
                }
                
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                return date.toLocaleDateString('pt-BR', options);
            };

            const urlParams = new URLSearchParams(window.location.search);
            const postSlug = urlParams.get('titulo'); 
            const contentContainer = document.getElementById('post-content');
            const loadingState = document.getElementById('loading-state');

            if (!postSlug) {
                if(loadingState) loadingState.remove();
                contentContainer.innerHTML = `<div class="col-lg-8"><div class="alert alert-warning" role="alert"><strong>URL inválida:</strong> Nenhum post foi especificado. Por favor, verifique o link.</div></div>`;
                return;
            }

            // ATENÇÃO: Substitua por sua URL de planilha de publicação CSV REAL
            const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQinF35CmNFHuIleJkxG5UeruF0nDeTRtj1JhnxwPWHN6G3FlD-4e6LVSFOHJtdtVWAEILyuiPDVlgQ/pub?gid=0&single=true&output=csv'; // SUA URL AQUI

            fetch(sheetUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Não foi possível carregar os dados da planilha. Verifique o link e as permissões.');
                    return response.text();
                })
                .then(csvText => {
                    const rows = csvText.trim().split(/\r?\n/);
                    
                    // Remove aspas duplas e espaços extras dos cabeçalhos
                    const headers = rows.shift().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    
                    const getIndex = (name) => headers.findIndex(header => header.toLowerCase() === name.toLowerCase());
                    const indices = {
                        dataehora: getIndex('dataehora'), // Timestamp de criação
                        titulo: getIndex('titulo'),
                        subtitulo: getIndex('subtitulo'),
                        categoria: getIndex('categoria'),
                        autor: getIndex('autor'),
                        data: getIndex('data'), // Data do formulário (YYYY-MM-DD)
                        conteudo: getIndex('conteudo'),
                        url_imagem: getIndex('url_imagem') // <--- NOVO: Índice para a URL da imagem
                    };

                    let postFound = false;
                    for (const rowStr of rows) {
                        const row = rowStr.match(/(?:[^,"]+|"[^"]*")+/g);
                        if (!row) continue; // Pula linhas mal formatadas
                        
                        const cleanedRow = row.map(item => item.trim().replace(/^"|"$/g, ''));
                        
                        const titleFromSheet = (indices.titulo !== -1 && cleanedRow[indices.titulo]) ? cleanedRow[indices.titulo].trim() : '';
                        
                        if (slugify(titleFromSheet) === postSlug) {
                            const getData = (index) => (index !== -1 && cleanedRow[index]) ? cleanedRow[index] : '';
                            
                            const postTitle = getData(indices.titulo);
                            const postSubtitle = getData(indices.subtitulo);
                            const postCategory = getData(indices.categoria);
                            const postAuthor = getData(indices.autor);
                            const postDate = parseDateForDisplay(getData(indices.data)); // Usa a data do formulário (coluna 'data')
                            const postContent = getData(indices.conteudo);
                            const postImageUrl = getData(indices.url_imagem);
                            const defaultPostImageUrl = 'https://www.consultoriarr.com.br/wp-content/uploads/2023/05/Qual-e-a-diferenca-entre-contabilidade-e-financas.jpeg'; // Imagem padrão para post individual

                            const postHtml = `
                                <div class="col-lg-8">
                                    <article>
                                        <header class="mb-4 text-center">
                                            <span class="post-category-tag">${postCategory || 'Geral'}</span>
                                            <h1 class="fw-bolder mb-1">${postTitle || 'Título Indisponível'}</h1>
                                            <p class="lead text-muted">${postSubtitle || 'Subtítulo Indisponível'}</p>
                                            <div class="post-info-text mb-4">
                                                ${postDate} - por ${postAuthor || 'Autor Desconhecido'}
                                            </div>
                                        </header>
                                        <figure class="mb-4">
                                            <img class="img-fluid rounded post-header-image" 
                                                 src="${postImageUrl || defaultPostImageUrl}" 
                                                 alt="${postTitle || 'Imagem do Post'}"
                                                 onerror="this.onerror=null;this.src='${defaultPostImageUrl}';"
                                            >
                                        </figure>
                                        <section class="mb-5">
                                            <p class="fs-5 lh-base">${postContent || 'Conteúdo do post indisponível.'}</p>
                                        </section>
                                    </article>
                                </div>`;
                            
                            contentContainer.innerHTML = postHtml;
                            document.title = `${postTitle} - iFinanças`;
                            postFound = true;
                            break;
                        }
                    }

                    if(loadingState) loadingState.remove(); // Remove o estado de carregamento
                    if (!postFound) {
                        contentContainer.innerHTML = `<div class="col-lg-8"><div class="alert alert-danger" role="alert"><strong>Erro 404:</strong> O post que você está procurando não foi encontrado.</div></div>`;
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    if(loadingState) loadingState.remove(); // Remove o estado de carregamento
                    contentContainer.innerHTML = `<div class="col-lg-8"><div class="alert alert-danger" role="alert"><strong>Falha na operação:</strong> ${error.message}<br>Verifique se o ID da planilha está correto e se ela está publicada para a web como CSV.</div></div>`;
                });
        });