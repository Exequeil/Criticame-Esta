// --- BUSCADOR Y APIS ---
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

async function fetchMoviesFromAPI(query) {
    try {
        const targetUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}`;
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

async function fetchGamesFromAPI(query) {
    try {
        const targetUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`;
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

function displayResults(items, type) {
    resultsContainer.innerHTML = '';
    items.forEach(item => {
        const title = type === 'movie' ? item.title : item.name;
        const poster = type === 'movie' 
            ? (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450?text=Sin+Imagen')
            : (item.background_image || 'https://via.placeholder.com/300x450?text=Sin+Imagen');
        const rating = item.vote_average ? item.vote_average.toFixed(1) : (item.rating || 'N/A');
        const overview = item.overview || item.description_raw || "Sin descripción disponible.";

        const card = document.createElement('div');
        card.classList.add('critique-card');
        card.innerHTML = `
            <div class="card-img-box" style="cursor: pointer;" onclick='openDetailView(${JSON.stringify(title)}, ${JSON.stringify(poster)}, ${JSON.stringify(rating)}, ${JSON.stringify(overview)})'>
                <img src="${poster}" alt="${title}">
                <div class="score-badge"><i class="fa-solid fa-star"></i> ${rating}</div>
            </div>
            <div class="card-content">
                <h3 style="cursor: pointer;" onclick='openDetailView(${JSON.stringify(title)}, ${JSON.stringify(poster)}, ${JSON.stringify(rating)}, ${JSON.stringify(overview)})'>${title}</h3>
                <button class="btn-review" onclick="openReviewModal('${title.replace(/'/g, "\\'")}')">Escribir Crítica</button>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

// --- GESTIÓN DE USUARIOS (Almacén D1) ---
let dbUsers = JSON.parse(localStorage.getItem('criticame_users')) || [];
let loggedUser = localStorage.getItem('criticame_logged_user') || null;

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('regUser').value.trim();
        const pass = document.getElementById('regPass').value.trim();
        const name = document.getElementById('regName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const regStatus = document.getElementById('regStatus');

        if (dbUsers.some(u => u.user === user)) {
            regStatus.style.color = 'var(--primary-red)';
            regStatus.textContent = 'Error: El nombre de usuario ya existe en la base de datos.';
            return;
        }

        dbUsers.push({ user, pass, name, lastName, phone, email });
        localStorage.setItem('criticame_users', JSON.stringify(dbUsers));

        regStatus.style.color = '#10b981';
        regStatus.textContent = '¡Registro guardado con éxito! Redirigiendo...';
        registerForm.reset();
        setTimeout(() => switchView('viewLogin'), 1200);
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('loginUser').value.trim();
        const pass = document.getElementById('loginPass').value.trim();
        const loginStatus = document.getElementById('loginStatus');

        const foundUser = dbUsers.find(u => u.user === user && u.pass === pass);
        if (foundUser) {
            loggedUser = user;
            localStorage.setItem('criticame_logged_user', loggedUser);
            loginStatus.style.color = '#10b981';
            loginStatus.textContent = `¡Bienvenido, ${foundUser.name}! Acceso concedido.`;
            loginForm.reset();
            setTimeout(() => {
                switchView('viewCatalog');
                updateNavUI();
            }, 1000);
        } else {
            loginStatus.style.color = 'var(--primary-red)';
            loginStatus.textContent = 'Error: Usuario o contraseña incorrectos.';
        }
    });
}

function updateNavUI() {
    const navControls = document.getElementById('navControls');
    if (loggedUser) {
        navControls.innerHTML = `
            <button onclick="switchView('viewCatalog')" class="nav-btn" id="btnCatalog">Catálogo</button>
            <button onclick="switchView('viewHallOfFame')" class="nav-btn" id="btnHallOfFame">Sala de la Fama</button>
            <span style="display:flex; align-items:center; color: var(--accent-color); font-weight:bold; padding: 0 0.5rem;"><i class="fa-solid fa-user-check"></i> &nbsp;${loggedUser}</span>
            <button onclick="logout()" class="nav-btn" style="border-color: var(--primary-red); color: var(--primary-red);">Cerrar Sesión</button>
        `;
    }
}

function logout() {
    loggedUser = null;
    localStorage.removeItem('criticame_logged_user');
    location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
    if (loggedUser) updateNavUI();
});

// --- CONTROL DE VISTAS Y CRÍTICAS ---
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if(viewId === 'viewCatalog') document.getElementById('btnCatalog').classList.add('active');
    if(viewId === 'viewHallOfFame') document.getElementById('btnHallOfFame').classList.add('active');
    if(viewId === 'viewLogin') document.getElementById('btnLoginNav').classList.add('active');
    if(viewId === 'viewRegister') document.getElementById('btnRegisterNav').classList.add('active');

    if (viewId === 'viewHallOfFame') {
        renderHallOfFame();
    }
}

// Base de datos de críticas con soporte para Likes, Dislikes y Comentarios
let dbReviews = JSON.parse(localStorage.getItem('criticame_reviews')) || {
    "The Batman": [
        { id: "rev_1", user: "Sacchi", stars: 5, text: "Muy buena", likes: 3, dislikes: 0, votedUsers: {}, comments: [] }
    ]
};

let currentItemTitle = '';
let currentItemPoster = '';
let currentItemRating = '';
let currentItemOverview = '';

function openDetailView(title, poster, rating, overview) {
    currentItemTitle = title;
    if (poster) currentItemPoster = poster;
    if (rating) currentItemRating = rating;
    if (overview) currentItemOverview = overview;

    const detailContent = document.getElementById('detailContent');
    const reviews = dbReviews[currentItemTitle] || [];
    
    let reviewsHTML = '';
    if (reviews.length === 0) {
        reviewsHTML = '<p style="color: var(--text-muted);">Aún no hay críticas registradas para esta obra. ¡Sé el primero en escribir una!</p>';
    } else {
        reviews.forEach(rev => {
            const starIcons = '⭐'.repeat(rev.stars);
            let commentsHTML = '';
            if (rev.comments && rev.comments.length > 0) {
                rev.comments.forEach(c => {
                    commentsHTML += `<div class="comment-item"><strong>@${c.user}:</strong> ${c.text}</div>`;
                });
            }

            reviewsHTML += `
                <div class="review-item" id="${rev.id}">
                    <div class="review-header">
                        <span class="review-user"><i class="fa-solid fa-user"></i> ${rev.user}</span>
                        <span class="review-stars">${starIcons} (${rev.stars}/5)</span>
                    </div>
                    <p style="margin-bottom: 0.8rem; color: var(--text-main);">${rev.text}</p>
                    
                    <div class="review-actions">
                        <button class="btn-vote" onclick="voteReview('${currentItemTitle}', '${rev.id}', 'like')">
                            <i class="fa-solid fa-thumbs-up"></i> ${rev.likes || 0}
                        </button>
                        <button class="btn-vote" onclick="voteReview('${currentItemTitle}', '${rev.id}', 'dislike')">
                            <i class="fa-solid fa-thumbs-down"></i> ${rev.dislikes || 0}
                        </button>
                    </div>

                    <div class="comments-container">
                        <small style="color: var(--text-muted);">Comentarios de la comunidad:</small>
                        <div id="comments-list-${rev.id}">
                            ${commentsHTML}
                        </div>
                        <div class="comment-form">
                            <input type="text" id="comment-input-${rev.id}" placeholder="Escribe un comentario...">
                            <button onclick="addComment('${currentItemTitle}', '${rev.id}')">Comentar</button>
                        </div>
                    </div>
                    <small style="color: var(--text-muted); font-size: 0.75rem; display:block; margin-top:0.5rem;">Publicado el ${rev.date || 'Reciente'}</small>
                </div>
            `;
        });
    }

    detailContent.innerHTML = `
        <div class="detail-header">
            <img src="${currentItemPoster}" alt="${currentItemTitle}" class="detail-img">
            <div class="detail-info">
                <h2>${currentItemTitle}</h2>
                <p><strong>Puntuación Promedio API:</strong> ⭐ ${currentItemRating}</p>
                <p><strong>Sinopsis:</strong> ${currentItemOverview}</p>
                <button class="btn-submit" style="width: 200px;" onclick="openReviewModal('${currentItemTitle.replace(/'/g, "\\'")}')">Escribir mi Crítica</button>
            </div>
        </div>
        <div class="reviews-section">
            <h3>Críticas de la Comunidad</h3>
            ${reviewsHTML}
        </div>
    `;

    switchView('viewDetail');
}

// Sistema de Votación (Likes y Dislikes)
function voteReview(title, reviewId, type) {
    if (!loggedUser) {
        alert('Debes iniciar sesión para votar en las críticas.');
        switchView('viewLogin');
        return;
    }

    const reviews = dbReviews[title];
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    if (!review.votedUsers) review.votedUsers = {};

    if (review.votedUsers[loggedUser] === type) {
        alert('Ya has votado de esta manera en esta crítica.');
        return;
    }

    // Ajustar conteo previo si ya había votado otra cosa
    if (review.votedUsers[loggedUser] === 'like') review.likes--;
    if (review.votedUsers[loggedUser] === 'dislike') review.dislikes--;

    // Registrar nuevo voto
    if (type === 'like') review.likes++;
    if (type === 'dislike') review.dislikes++;

    review.votedUsers[loggedUser] = type;
    localStorage.setItem('criticame_reviews', JSON.stringify(dbReviews));
    openDetailView(currentItemTitle);
}

// Sistema de Comentarios
function addComment(title, reviewId) {
    if (!loggedUser) {
        alert('Debes iniciar sesión para comentar.');
        switchView('viewLogin');
        return;
    }

    const input = document.getElementById(`comment-input-${reviewId}`);
    const text = input.value.trim();
    if (!text) return;

    const reviews = dbReviews[title];
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    if (!review.comments) review.comments = [];
    review.comments.push({ user: loggedUser, text: text });

    localStorage.setItem('criticame_reviews', JSON.stringify(dbReviews));
    openDetailView(currentItemTitle);
}

// Cálculo y Renderizado de la Sala de la Fama
function renderHallOfFame() {
    const hofContainer = document.getElementById('hallOfFameContent');
    let userScores = {};

    // Sumar todos los likes acumulados por usuario en todas las críticas de todas las obras
    for (let movie in dbReviews) {
        dbReviews[movie].forEach(rev => {
            if (!userScores[rev.user]) userScores[rev.user] = { likes: 0, reviewsCount: 0 };
            userScores[rev.user].likes += (rev.likes || 0) - (rev.dislikes || 0); // Puntaje neto
            userScores[rev.user].reviewsCount++;
        });
    }

    let bestUser = null;
    let maxScore = -999;

    for (let user in userScores) {
        if (userScores[user].likes > maxScore) {
            maxScore = userScores[user].likes;
            bestUser = user;
        }
    }

    if (!bestUser || maxScore < 0) {
        hofContainer.innerHTML = '<p style="color: var(--text-muted); margin-top: 1rem;">Aún no hay suficientes votos positivos para coronar a un miembro en la Sala de la Fama. ¡Empiecen a dar likes!</p>';
        return;
    }

    hofContainer.innerHTML = `
        <div class="hof-winner-card">
            <i class="fa-solid fa-crown" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
            <h3>@${bestUser}</h3>
            <p>Es el crítico supremo de la comunidad con un balance de <strong>${maxScore} Puntos Positivos (Likes)</strong>.</p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Críticas publicadas: ${userScores[bestUser].reviewsCount}</p>
        </div>
    `;
}

const reviewModal = document.getElementById('reviewModal');
const closeModal = document.querySelector('.close-modal');

function openReviewModal(itemTitle) {
    if (!loggedUser) {
        alert('Acceso denegado: Debes iniciar sesión con una cuenta registrada para poder publicar una crítica.');
        switchView('viewLogin');
        return;
    }

    if (itemTitle) currentItemTitle = itemTitle;
    document.getElementById('modalSubTitle').innerText = `Estás reseñando: ${currentItemTitle}`;
    document.getElementById('critiqueUserDisplay').value = loggedUser; 
    reviewModal.style.display = 'block';
}

closeModal.onclick = function() {
    reviewModal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == reviewModal) {
        reviewModal.style.display = 'none';
    }
}

document.getElementById('critiqueForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const stars = parseInt(document.getElementById('critiqueStars').value);
    const textInput = document.getElementById('critiqueText');
    const text = textInput.value.trim();

    if (!dbReviews[currentItemTitle]) {
        dbReviews[currentItemTitle] = [];
    }

    const newReviewId = 'rev_' + Date.now();
    dbReviews[currentItemTitle].unshift({
        id: newReviewId,
        user: loggedUser,
        stars: stars,
        text: text,
        likes: 0,
        dislikes: 0,
        votedUsers: {},
        comments: [],
        date: new Date().toISOString().split('T')[0]
    });

    localStorage.setItem('criticame_reviews', JSON.stringify(dbReviews));

    alert('¡Crítica publicada con éxito en el sistema!');
    reviewModal.style.display = 'none';
    textInput.value = '';

    if (document.getElementById('viewDetail').classList.contains('active')) {
        openDetailView(currentItemTitle);
    }
});