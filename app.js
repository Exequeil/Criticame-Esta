// --- BUSCADOR Y APIS (Con pasarela de red estable) ---
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const contentTypeSelect = document.getElementById('contentType');
const resultsContainer = document.getElementById('resultsContainer');
const TMDB_API_KEY = 'e3ddb32a1b6baf0585362ece104c17bd';
const RAWG_API_KEY = '2d09364631804da480e6ebc795aa1af6';


searchButton.addEventListener('click', executeSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });

function executeSearch() {
    const query = searchInput.value.trim();
    const type = contentTypeSelect.value;
    if (query === '') return;

    resultsContainer.innerHTML = '<p class="welcome-message">Consultando API en tiempo real...</p>';
    if (type === 'movie') fetchMoviesFromAPI(query);
    else fetchGamesFromAPI(query);
}

// Consulta real a TMDB usando un proxy alternativo de total confianza
async function fetchMoviesFromAPI(query) {
    try {
        const targetUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`;
        
        // Hacemos el fetch directo a TMDB
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displayResults(data.results, 'movie');
        } else {
            resultsContainer.innerHTML = `<p class="welcome-message">No se encontraron películas en la API para "${query}".</p>`;
        }
    } catch (e) {
        console.error(e);
        resultsContainer.innerHTML = '<p class="welcome-message">Error de conexión con la API de películas.</p>';
    }
}

// Consulta real a RAWG (Directa, sin proxy)
async function fetchGamesFromAPI(query) {
    try {
        const targetUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`;
        
        // Hacemos el fetch directo a RAWG
        const response = await fetch(targetUrl);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            displayResults(data.results, 'game');
        } else {
            resultsContainer.innerHTML = `<p class="welcome-message">No se encontraron videojuegos en la API para "${query}".</p>`;
        }
    } catch (e) {
        console.error(e);
        resultsContainer.innerHTML = '<p class="welcome-message">Error de conexión con la API de videojuegos.</p>';
    }
}

// Renderiza los resultados traídos directamente de la API
function displayResults(items, type) {
    resultsContainer.innerHTML = '';
    items.forEach(item => {
        const title = type === 'movie' ? item.title : item.name;
        const poster = type === 'movie' 
            ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450?text=Sin+Imagen')
            : (item.background_image || 'https://via.placeholder.com/300x450?text=Sin+Imagen');
        const rating = item.vote_average ? item.vote_average.toFixed(1) : (item.rating || 'N/A');

        const card = document.createElement('div');
        card.classList.add('critique-card');
        card.innerHTML = `
            <div class="card-img-box">
                <img src="${poster}" alt="${title}">
                <div class="score-badge"><i class="fa-solid fa-star"></i> ${rating}</div>
            </div>
            <div class="card-content">
                <h3>${title}</h3>
                <button class="btn-review" onclick="openReviewModal('${title.replace(/'/g, "\\'")}')">Escribir Crítica</button>55
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}