const TMDB_API_KEY = 'e3ddb32a1b6baf0585362ece104c17bd';
const RAWG_API_KEY = '2d09364631804da480e6ebc795aa1af6';

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const contentTypeSelect = document.getElementById('contentType');
const resultsContainer = document.getElementById('resultsContainer');

if (searchButton) searchButton.addEventListener('click', executeSearch);
if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });

function executeSearch() {
    const query = searchInput.value.trim();
    const type = contentTypeSelect.value;
    if (query === '') return;

    switchView('viewSearch');
    document.getElementById('resultsTitle').innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> Resultados para "${query}"`;
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
            resultsContainer.innerHTML = `<p class="welcome-message">No se encontraron películas en TMDB para "${query}".</p>`;
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
            resultsContainer.innerHTML = `<p class="welcome-message">No se encontraron videojuegos en RAWG para "${query}".</p>`;
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
        const rating = item.vote_average ? item.vote_average.toFixed(1) : (item.rating ? item.rating.toFixed(1) : 'N/A');
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
                <button class="btn-review" onclick="openReviewModal('${title.replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i> Escribir Crítica</button>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}

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
            regStatus.style.color = 'var(--brand-red)';
            regStatus.textContent = 'Error: El usuario ya está registrado.';
            return;
        }

        dbUsers.push({ user, pass, name, lastName, phone, email, avatar: '' });
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
            loginStatus.textContent = `¡Bienvenido, ${foundUser.name}!`;
            loginForm.reset();
            setTimeout(() => {
                switchView('viewCatalog');
                updateNavUI();
            }, 1000);
        } else {
            loginStatus.style.color = 'var(--brand-red)';
            loginStatus.textContent = 'Error: Usuario o contraseña incorrectos.';
        }
    });
}

function getUserAvatar(username) {
    const userObj = dbUsers.find(u => u.user === username);
    return userObj && userObj.avatar ? userObj.avatar : null;
}

function saveProfileAvatar() {
    const fileInput = document.getElementById('avatarFileInput');
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            const userObj = dbUsers.find(u => u.user === loggedUser);
            if (userObj) {
                userObj.avatar = base64Image;
                localStorage.setItem('criticame_users', JSON.stringify(dbUsers));
                // Eliminado el alert() de actualización de foto para que sea fluido
                renderUserProfile();
                updateNavUI();
            }
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        alert('Por favor selecciona una imagen primero.');
    }
}

function updateNavUI() {
    const navControls = document.getElementById('navControls');
    if (loggedUser) {
        const avatar = getUserAvatar(loggedUser);
        const avatarHTML = avatar 
            ? `<img src="${avatar}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;">` 
            : `<i class="fa-solid fa-user-check"></i>`;

        navControls.innerHTML = `
            <button onclick="switchView('viewCatalog')" class="nav-btn" id="btnCatalog"><i class="fa-solid fa-house"></i> Inicio</button>
            <button onclick="switchView('viewHallOfFame')" class="nav-btn" id="btnHallOfFame"><i class="fa-solid fa-trophy"></i> Sala de la Fama</button>
            <div onclick="switchView('viewProfile')" style="display:flex; align-items:center; color: var(--accent-color); font-weight:bold; padding: 0.3rem 0.7rem; background: #20222c; border: 1px solid var(--accent-color); border-radius: 6px; cursor: pointer; gap: 8px;" title="Ver mi perfil">
                ${avatarHTML} <span>${loggedUser}</span>
            </div>
            <button onclick="logout()" class="nav-btn" style="border-color: var(--brand-red); color: var(--brand-red);"><i class="fa-solid fa-right-from-bracket"></i> Salir</button>
        `;
    }
}

function logout() {
    loggedUser = null;
    localStorage.removeItem('criticame_logged_user');
    location.reload();
}

function getStarIcons(score) {
    const numScore = parseFloat(score) || 0;
    const fullStars = Math.floor(numScore / 2);
    const hasHalfStar = (numScore % 2) >= 1;
    let starsHTML = '⭐'.repeat(fullStars);
    if (hasHalfStar) starsHTML += '✨';
    return starsHTML !== '' ? starsHTML : '❌';
}

function calculateCommunityAverage(title) {
    const reviews = dbReviews[title] || [];
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, rev) => acc + (parseFloat(rev.stars) || 0), 0);
    return (sum / reviews.length).toFixed(1);
}

function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(viewId === 'viewCatalog' && document.getElementById('btnCatalog')) {
        document.getElementById('btnCatalog').classList.add('active');
    }
    if(viewId === 'viewHallOfFame' && document.getElementById('btnHallOfFame')) {
        document.getElementById('btnHallOfFame').classList.add('active');
    }

    if (viewId === 'viewHallOfFame') renderHallOfFame();
    if (viewId === 'viewProfile') renderUserProfile();
}

let dbReviews = JSON.parse(localStorage.getItem('criticame_reviews')) || {
    "Dune: Parte Dos": [
        { id: "rev_1", user: "Sacchi", stars: 10, text: "Excelente fotografía y sonido.", likes: 4, dislikes: 0, votedUsers: {}, comments: [] }
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
    const communityAvg = calculateCommunityAverage(currentItemTitle);
    
    let reviewsHTML = reviews.length === 0 
        ? '<p style="color: var(--text-muted);">Aún no hay críticas registradas para esta obra. ¡Sé el primero en opinar!</p>'
        : reviews.map(rev => {
            const userAvatar = getUserAvatar(rev.user);
            const avatarDisplay = userAvatar 
                ? `<img src="${userAvatar}" class="review-avatar">` 
                : `<i class="fa-solid fa-user"></i>`;

            return `
                <div class="review-item" id="${rev.id}">
                    <div class="review-header">
                        <span class="review-user">${avatarDisplay} @${rev.user}</span>
                        <span style="color: var(--accent-color); font-weight: bold;">
                            ${getStarIcons(rev.stars)} <span>${rev.stars}/10</span>
                        </span>
                    </div>
                    <p style="margin-bottom: 0.8rem; color: var(--text-main);">${rev.text}</p>
                    <div class="review-actions">
                        <button class="btn-vote" onclick="voteReview('${currentItemTitle}', '${rev.id}', 'like')"><i class="fa-solid fa-thumbs-up"></i> ${rev.likes || 0}</button>
                        <button class="btn-vote" onclick="voteReview('${currentItemTitle}', '${rev.id}', 'dislike')"><i class="fa-solid fa-thumbs-down"></i> ${rev.dislikes || 0}</button>
                    </div>
                    <div class="comments-container">
                        ${(rev.comments || []).map(c => `<div class="comment-item"><strong>@${c.user}:</strong> ${c.text}</div>`).join('')}
                        <div class="comment-form">
                            <input type="text" id="comment-input-${rev.id}" placeholder="Escribe un comentario...">
                            <button onclick="addComment('${currentItemTitle}', '${rev.id}')">Comentar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    detailContent.innerHTML = `
        <div class="detail-header">
            <img src="${currentItemPoster}" alt="${currentItemTitle}" class="detail-img">
            <div class="detail-info">
                <h2>${currentItemTitle}</h2>
                <p><strong>Puntuación API Oficial:</strong> ⭐ ${currentItemRating} / 10</p>
                <p><strong>Promedio Comunidad Criticame Esta:</strong> 
                    <span style="color: var(--accent-color); font-size: 1.1rem; font-weight: bold;">
                        ${communityAvg ? `⭐ ${communityAvg} / 10 (${reviews.length} reseñas)` : 'Sin reseñas aún'}
                    </span>
                </p>
                <p><strong>Sinopsis:</strong> ${currentItemOverview}</p>
                <button class="btn-submit" style="width: 220px;" onclick="openReviewModal('${currentItemTitle.replace(/'/g, "\\'")}')"><i class="fa-solid fa-pen"></i> Escribir Crítica</button>
            </div>
        </div>
        <div class="reviews-section">
            <h3>Críticas de la Comunidad</h3>
            ${reviewsHTML}
        </div>
    `;

    switchView('viewDetail');
}

function renderUserProfile() {
    if (!loggedUser) return;
    document.getElementById('profileUsername').innerText = `@${loggedUser}`;

    const avatarImg = document.getElementById('profileAvatarImg');
    const avatarIcon = document.getElementById('profileAvatarIcon');
    const userAvatar = getUserAvatar(loggedUser);

    if (userAvatar) {
        avatarImg.src = userAvatar;
        avatarImg.style.display = 'block';
        avatarIcon.style.display = 'none';
    } else {
        avatarImg.style.display = 'none';
        avatarIcon.style.display = 'block';
    }

    const reviewsContainer = document.getElementById('userReviewsContainer');
    const commentsContainer = document.getElementById('userCommentsContainer');

    let userReviewsHTML = '';
    let userCommentsHTML = '';
    let reviewCount = 0;
    let commentCount = 0;

    for (let title in dbReviews) {
        dbReviews[title].forEach(rev => {
            if (rev.user === loggedUser) {
                reviewCount++;
                userReviewsHTML += `
                    <div class="review-item">
                        <div class="review-header">
                            <span style="color: var(--accent-color); font-weight: bold;"><i class="fa-solid fa-film"></i> ${title}</span>
                            <span>${getStarIcons(rev.stars)} (${rev.stars}/10)</span>
                        </div>
                        <p style="color: var(--text-main); margin-top: 0.5rem;">${rev.text}</p>
                        <small style="color: var(--text-muted); display: block; margin-top: 0.4rem;">👍 ${rev.likes || 0} Likes | 👎 ${rev.dislikes || 0} Dislikes</small>
                    </div>
                `;
            }

            if (rev.comments && rev.comments.length > 0) {
                rev.comments.forEach(c => {
                    if (c.user === loggedUser) {
                        commentCount++;
                        userCommentsHTML += `
                            <div class="comment-item" style="margin-bottom: 0.5rem; padding: 0.8rem; background: #20222c; border-radius: 6px;">
                                <small style="color: var(--accent-color); display:block; margin-bottom: 0.3rem;">En la obra: <strong>${title}</strong></small>
                                <span style="color: var(--text-main);">${c.text}</span>
                            </div>
                        `;
                    }
                });
            }
        });
    }

    reviewsContainer.innerHTML = reviewCount > 0 ? userReviewsHTML : '<p style="color: var(--text-muted);">Aún no has publicado ninguna crítica.</p>';
    commentsContainer.innerHTML = commentCount > 0 ? userCommentsHTML : '<p style="color: var(--text-muted);">Aún no has hecho ningún comentario.</p>';
}

function voteReview(title, reviewId, type) {
    if (!loggedUser) { alert('Debes iniciar sesión para votar.'); switchView('viewLogin'); return; }
    const review = dbReviews[title].find(r => r.id === reviewId);
    if (!review) return;
    if (!review.votedUsers) review.votedUsers = {};
    if (review.votedUsers[loggedUser] === type) return;

    if (review.votedUsers[loggedUser] === 'like') review.likes--;
    if (review.votedUsers[loggedUser] === 'dislike') review.dislikes--;

    if (type === 'like') review.likes = (review.likes || 0) + 1;
    if (type === 'dislike') review.dislikes = (review.dislikes || 0) + 1;

    review.votedUsers[loggedUser] = type;
    localStorage.setItem('criticame_reviews', JSON.stringify(dbReviews));
    openDetailView(currentItemTitle);
}

function addComment(title, reviewId) {
    if (!loggedUser) { alert('Debes iniciar sesión para comentar.'); switchView('viewLogin'); return; }
    const input = document.getElementById(`comment-input-${reviewId}`);
    const text = input.value.trim();
    if (!text) return;

    const review = dbReviews[title].find(r => r.id === reviewId);
    if (!review.comments) review.comments = [];
    review.comments.push({ user: loggedUser, text: text });

    localStorage.setItem('criticame_reviews', JSON.stringify(dbReviews));
    openDetailView(currentItemTitle);
}

function renderHallOfFame() {
    const hofContainer = document.getElementById('hallOfFameContent');
    let userScores = {};

    for (let movie in dbReviews) {
        dbReviews[movie].forEach(rev => {
            if (!userScores[rev.user]) userScores[rev.user] = { likes: 0, count: 0 };
            userScores[rev.user].likes += (rev.likes || 0) - (rev.dislikes || 0);
            userScores[rev.user].count++;
        });
    }

    let bestUser = null, maxScore = -999;
    for (let u in userScores) {
        if (userScores[u].likes > maxScore) { maxScore = userScores[u].likes; bestUser = u; }
    }

    if (!bestUser || maxScore <= 0) {
        hofContainer.innerHTML = '<p style="color: var(--text-muted); margin-top: 1rem;">Aún no hay votos suficientes para la Sala de la Fama.</p>';
        return;
    }

    hofContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, #20222c, #14151a); border: 2px solid var(--accent-color); padding: 2rem; border-radius: 12px; margin-top: 1rem;">
            <i class="fa-solid fa-crown" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--accent-color); font-size: 1.8rem;">@${bestUser}</h3>
            <p style="margin-top:0.5rem;">Puntaje acumulado: <strong>${maxScore} Likes Netos</strong></p>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Total de críticas: ${userScores[bestUser].count}</p>
        </div>
    `;
}

const reviewModal = document.getElementById('reviewModal');
const closeModal = document.querySelector('.close-modal');

function openReviewModal(itemTitle) {
    if (!loggedUser) { alert('Debes iniciar sesión para publicar una crítica.'); switchView('viewLogin'); return; }
    if (itemTitle) currentItemTitle = itemTitle;
    document.getElementById('modalSubTitle').innerText = `Estás reseñando: ${currentItemTitle}`;
    document.getElementById('critiqueUserDisplay').value = loggedUser; 
    reviewModal.style.display = 'block';
}

if (closeModal) closeModal.onclick = () => reviewModal.style.display = 'none';
window.onclick = (e) => { if (e.target == reviewModal) reviewModal.style.display = 'none'; };

document.getElementById('critiqueForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const stars = parseInt(document.getElementById('critiqueStars').value);
    const text = document.getElementById('critiqueText').value.trim();

    if (!dbReviews[currentItemTitle]) dbReviews[currentItemTitle] = [];
    dbReviews[currentItemTitle].unshift({
        id: 'rev_' + Date.now(),
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
    reviewModal.style.display = 'none';
    document.getElementById('critiqueText').value = '';
    
    if (document.getElementById('viewDetail').classList.contains('active')) openDetailView(currentItemTitle);
});

window.addEventListener('DOMContentLoaded', () => {
    if (loggedUser) updateNavUI();
});