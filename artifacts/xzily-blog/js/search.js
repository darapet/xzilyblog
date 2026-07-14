import { mountLayout, formatDate, qs } from './common.js';
import { icon } from './icons.js';
import { userById, categoryById } from './data.js';
import { store } from './store.js';

mountLayout('');

const input = document.getElementById('searchInput');
const form = document.getElementById('searchForm');
const initial = qs('q') || '';
input.value = initial;
runSearch(initial);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = input.value.trim();
  const url = new URL(window.location.href);
  url.searchParams.set('q', val);
  window.history.replaceState({}, '', url);
  runSearch(val);
});

function runSearch(query) {
  const q = query.trim().toLowerCase();
  const posts = store.getPosts({ status: 'published' });
  const results = q
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (categoryById(p.categoryId)?.name || '').toLowerCase().includes(q))
    : posts;

  document.getElementById('resultCount').textContent = q
    ? `${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
    : `Showing all ${results.length} stories`;

  document.getElementById('resultsGrid').innerHTML = results.map((p, i) => cardHtml(p, i)).join('');
  document.getElementById('resultsEmpty').innerHTML = results.length === 0 ? `
    <div class="empty-state">
      <div class="icon-wrap">${icon('search', 24)}</div>
      <h3>No stories match "${query}"</h3>
      <p>Try a different keyword or tag.</p>
    </div>` : '';
}

function cardHtml(p, i) {
  const author = userById(p.authorId);
  const cat = categoryById(p.categoryId);
  return `
    <div class="card" style="--i:${i}">
      <a class="card-media" href="/article.html?slug=${p.slug}">
        <span class="card-cat">${cat ? cat.name : ''}</span>
        <img src="${p.coverImage}" alt="${p.title}" loading="lazy" />
      </a>
      <div class="card-body">
        <h3><a href="/article.html?slug=${p.slug}">${p.title}</a></h3>
        <p class="card-excerpt">${p.excerpt}</p>
        <div class="card-meta">
          <img class="avatar" src="${author.avatar}" alt="${author.name}" />
          <span>${author.name}</span>
          <span class="sep"></span>
          <span>${formatDate(p.createdAt)}</span>
        </div>
      </div>
    </div>`;
}
