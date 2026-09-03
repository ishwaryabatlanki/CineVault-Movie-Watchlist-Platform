const API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;
const API_BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";
const state = {
  hero: null,
  page: 1,
  genre: "",
  minRating: 0,
  sort: "popularity.desc",
  watchlist: JSON.parse(localStorage.getItem("cinevault-watchlist") || "[]"),
  currentModal: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function apiHeaders() {
  return { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json;charset=utf-8" };
}

async function api(path, params = {}) {
  if (!API_TOKEN) throw new Error("TMDB token missing. Add VITE_TMDB_API_TOKEN in your .env file.");
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => v !== "" && v !== null && v !== undefined && url.searchParams.set(k, v));
  const response = await fetch(url, { headers: apiHeaders() });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json();
}

function poster(path, size = "w500") {
  return path ? `${IMG}${size}${path}` : "https://placehold.co/500x750/151515/777?text=No+Poster";
}
function backdrop(path) {
  return path ? `${IMG}original${path}` : "";
}
function year(date) { return date ? date.slice(0,4) : "—"; }
function rating(v) { return Number(v || 0).toFixed(1); }

function saveWatchlist() {
  localStorage.setItem("cinevault-watchlist", JSON.stringify(state.watchlist));
  $("#watchCount").textContent = state.watchlist.length;
}
function isSaved(id) { return state.watchlist.some(m => m.id === id); }

function toggleWatch(movie) {
  const index = state.watchlist.findIndex(m => m.id === movie.id);
  if (index >= 0) {
    state.watchlist.splice(index, 1);
    toast("Removed from your watchlist");
  } else {
    state.watchlist.push(movie);
    toast("Added to your watchlist");
  }
  saveWatchlist();
  renderWatchlist();
  renderCurrentButtons();
  renderMovies();
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function movieCard(movie, index = 0) {
  const saved = isSaved(movie.id);
  return `
    <article class="movie-card" data-id="${movie.id}" style="animation-delay:${Math.min(index,8)*35}ms">
      <div class="poster-wrap">
        <img loading="lazy" src="${poster(movie.poster_path)}" alt="${escapeHtml(movie.title || movie.name)} poster">
        <button class="save-btn ${saved ? "saved" : ""}" data-save="${movie.id}" aria-label="${saved ? "Remove from" : "Add to"} watchlist">${saved ? "✓" : "+"}</button>
        <div class="poster-overlay"><button class="quick-btn" data-open="${movie.id}">→</button></div>
      </div>
      <div class="movie-title">${escapeHtml(movie.title || movie.name)}</div>
      <div class="movie-sub"><span>${year(movie.release_date)}</span><span class="rating">★ ${rating(movie.vote_average)}</span></div>
    </article>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}

function bindMovieEvents(container) {
  container.querySelectorAll("[data-save]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const id = Number(btn.dataset.save);
      const movie = [...state.lastMovies, ...state.watchlist].find(m => m.id === id);
      if (movie) toggleWatch(movie);
    });
  });
  container.querySelectorAll(".movie-card, [data-open]").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-save]")) return;
      const id = Number(card.dataset.id || card.dataset.open);
      const movie = [...state.lastMovies, ...state.watchlist].find(m => m.id === id);
      if (movie) openModal(movie);
    });
  });
}

async function loadHero() {
  try {
    const data = await api("/trending/movie/week");
    state.hero = data.results[0];
    renderHero(state.hero);
  } catch (error) {
    $("#heroTitle").textContent = "Your next favourite movie";
    $("#heroDescription").textContent = "Connect your TMDB API token to unlock live movie discovery.";
    $("#heroMeta").innerHTML = "";
    showStatus(error.message);
  }
}

function renderHero(movie) {
  $("#heroBackdrop").style.backgroundImage = `url("${backdrop(movie.backdrop_path)}")`;
  $("#heroTitle").textContent = movie.title;
  $("#heroMeta").innerHTML = `<span class="rating">★ ${rating(movie.vote_average)}</span><span>${year(movie.release_date)}</span><span>TMDB</span>`;
  $("#heroDescription").textContent = movie.overview || "Discover more about this movie and add it to your personal watchlist.";
  $("#heroWatch").textContent = isSaved(movie.id) ? "✓ In Watchlist" : "+ Add to Watchlist";
  $("#heroDetails").onclick = () => openModal(movie);
  $("#heroWatch").onclick = () => toggleWatch(movie);
}

async function loadRecommendations() {
  const grid = $("#recommendationGrid");
  grid.innerHTML = skeletonRow(6);
  try {
    const data = await api("/movie/popular", { page: 1 });
    state.recommendations = data.results;
    grid.innerHTML = data.results.slice(0, 8).map(movieCard).join("");
    state.lastMovies = data.results;
    bindMovieEvents(grid);
  } catch (error) {
    grid.innerHTML = `<div class="status">${escapeHtml(error.message)}</div>`;
  }
}

function skeletonRow(n) {
  return Array.from({length:n}, () => `<div class="poster-wrap skeleton"></div>`).join("");
}

async function loadDiscover(append = false) {
  const grid = $("#discoverGrid");
  if (!append) {
    state.page = 1;
    grid.innerHTML = Array.from({length:10}, () => `<div class="poster-wrap skeleton"></div>`).join("");
  }
  try {
    const query = getUrlState();
    let data;
    if (query.search) {
      data = await api("/search/movie", { query: query.search, page: state.page, include_adult: false });
      if (query.min_rating > 0) data.results = data.results.filter(m => Number(m.vote_average) >= query.min_rating);
      if (query.genre) data.results = data.results.filter(m => (m.genre_ids || []).includes(Number(query.genre)));
    } else {
      data = await api("/discover/movie", {
        page: state.page,
        with_genres: query.genre,
        "vote_average.gte": query.min_rating,
        sort_by: query.sort,
        include_adult: false,
        language: "en-US"
      });
    }

    if (!append) grid.innerHTML = "";
    state.lastMovies = append ? [...(state.lastMovies || []), ...data.results] : data.results;
    grid.insertAdjacentHTML("beforeend", data.results.map((m,i) => movieCard(m,i)).join(""));
    bindMovieEvents(grid);
    $("#discoverStatus").textContent = `${data.total_results?.toLocaleString() || data.results.length} results`;
    $("#loadMore").style.display = data.total_pages > state.page ? "block" : "none";
  } catch (error) {
    grid.innerHTML = `<div class="status">Unable to load movies. ${escapeHtml(error.message)}</div>`;
  }
}

function getUrlState() {
  const params = new URLSearchParams(location.search);
  state.genre = params.get("genre") || state.genre || "";
  state.minRating = Number(params.get("min_rating") || state.minRating || 0);
  state.sort = params.get("sort") || state.sort;
  return {
    search: params.get("search") || "",
    genre: state.genre,
    min_rating: state.minRating,
    sort: state.sort
  };
}

function updateUrl() {
  const params = new URLSearchParams();
  const search = $("#searchInput").value.trim();
  if (search) params.set("search", search);
  if (state.genre) params.set("genre", state.genre);
  if (state.minRating) params.set("min_rating", state.minRating);
  if (state.sort !== "popularity.desc") params.set("sort", state.sort);
  const next = `${location.pathname}${params.toString() ? "?" + params : ""}#discover`;
  history.pushState({}, "", next);
}

function syncFilters() {
  const data = getUrlState();
  $("#searchInput").value = data.search;
  $("#ratingSlider").value = data.min_rating;
  $("#ratingValue").textContent = `${data.min_rating}+`;
  $("#sortSelect").value = data.sort;
  $$(".pill").forEach(p => p.classList.toggle("active", p.dataset.genre === data.genre));
}

function renderWatchlist() {
  saveWatchlist();
  const grid = $("#watchlistGrid");
  const empty = $("#watchEmpty");
  if (!state.watchlist.length) {
    grid.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  grid.innerHTML = state.watchlist.map(movieCard).join("");
  state.lastMovies = [...(state.lastMovies || []), ...state.watchlist];
  bindMovieEvents(grid);
}

function renderCurrentButtons() {
  if (state.hero) $("#heroWatch").textContent = isSaved(state.hero.id) ? "✓ In Watchlist" : "+ Add to Watchlist";
  if (state.currentModal) $("#modalWatch").textContent = isSaved(state.currentModal.id) ? "✓ In Watchlist" : "+ Add to Watchlist";
}

function openModal(movie) {
  state.currentModal = movie;
  $("#modalImage").style.backgroundImage = `url("${backdrop(movie.backdrop_path) || poster(movie.poster_path, "w780")}")`;
  $("#modalTitle").textContent = movie.title;
  $("#modalMeta").innerHTML = `<span class="rating">★ ${rating(movie.vote_average)}</span><span>${year(movie.release_date)}</span><span>${movie.original_language?.toUpperCase() || "—"}</span>`;
  $("#modalOverview").textContent = movie.overview || "No overview is available for this movie.";
  $("#modalWatch").textContent = isSaved(movie.id) ? "✓ In Watchlist" : "+ Add to Watchlist";
  $("#modalBackdrop").classList.add("open");
  $("#modalBackdrop").setAttribute("aria-hidden", "false");
  $("#modalWatch").onclick = () => toggleWatch(movie);
  $("#modalTrailer").onclick = () => openTrailer(movie.id);
}
async function openTrailer(id) {
  try {
    const data = await api(`/movie/${id}/videos`, { language: "en-US" });
    const trailer = data.results.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
    if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, "_blank", "noopener");
    else toast("No trailer found for this movie");
  } catch { toast("Could not load trailer"); }
}

function closeModal() {
  $("#modalBackdrop").classList.remove("open");
  $("#modalBackdrop").setAttribute("aria-hidden", "true");
}

function showStatus(message) {
  $("#discoverStatus").textContent = message;
}

$("#searchForm").addEventListener("submit", e => {
  e.preventDefault();
  updateUrl();
  syncFilters();
  loadDiscover(false);
  document.querySelector("#discover").scrollIntoView({ behavior: "smooth" });
});
$("#ratingSlider").addEventListener("input", e => {
  state.minRating = Number(e.target.value);
  $("#ratingValue").textContent = `${state.minRating}+`;
});
$("#ratingSlider").addEventListener("change", () => { updateUrl(); loadDiscover(false); });
$("#sortSelect").addEventListener("change", e => { state.sort = e.target.value; updateUrl(); loadDiscover(false); });
$("#genrePills").addEventListener("click", e => {
  const btn = e.target.closest("[data-genre]");
  if (!btn) return;
  state.genre = btn.dataset.genre;
  updateUrl();
  syncFilters();
  loadDiscover(false);
});
$("#loadMore").addEventListener("click", () => { state.page += 1; loadDiscover(true); });
$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", e => { if (e.target === $("#modalBackdrop")) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

$("#menuBtn").addEventListener("click", () => $(".main-nav").classList.toggle("open"));
$$(".nav-link").forEach(link => link.addEventListener("click", () => $(".main-nav").classList.remove("open")));
$$(".text-btn").forEach(btn => btn.addEventListener("click", () => document.getElementById(btn.dataset.scrollTarget)?.scrollIntoView({behavior:"smooth"})));
window.addEventListener("scroll", () => $("#siteHeader").classList.toggle("scrolled", scrollY > 40));
window.addEventListener("popstate", () => { syncFilters(); loadDiscover(false); });

syncFilters();
saveWatchlist();
renderWatchlist();
loadHero();
loadRecommendations();
loadDiscover(false);
