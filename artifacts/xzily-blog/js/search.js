import { mountLayout, formatDate, qs, getCatColor } from './common.js';
import { icon } from './icons.js';
import { userById, categoryById, CATEGORIES } from './data.js';
import { store } from './store.js';

await mountLayout('search.html');

const input = document.getElementById('searchInput');
const form = document.getElementById('searchForm');
const initial = qs('q') || '';
input.value = initial;

const allPosts = await store.getPosts({ status: 'published' });

runSearch(initial);
document.getElementById('searchSidebar').innerHTML = sidebarHtml(allPosts);

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
  const results = q
    ? allPosts.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (categoryById(p.categoryId)?.name || '').toLowerCase().includes(q))
    : allPosts;

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
    <div class="mag-card">
      <a class="mag-card-media" href="article.html?slug=${p.slug}">
        <img src="${p.coverImage}" alt="${p.title}" loading="lazy" />
        <span class="cat-pill absolute-pill" style="--cat-color: ${getCatColor(cat?.slug)}">${cat ? cat.name : ''}</span>
      </a>
      <div class="mag-card-body">
        <h3 class="mag-card-title"><a href="article.html?slug=${p.slug}">${p.title}</a></h3>
        <p class="mag-card-excerpt">${p.excerpt}</p>
        <div class="mag-card-meta">
          <span class="author-name">${author.name}</span>
          <span class="sep">-</span>
          <span class="date">${formatDate(p.createdAt)}</span>
        </div>
      </div>
    </div>`;
}

function sidebarHtml(posts) {
  const trending = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
  return `
    <div class="widget">
      <h3 class="widget-title">Trending Now</h3>
      <div class="trending-list">
        ${trending.map((r, i) => `
          <a class="trending-item" href="article.html?slug=${r.slug}">
            <span class="trending-rank">${i + 1}</span>
            <div class="trending-info">
              <h4>${r.title}</h4>
              <div class="trending-meta">${formatDate(r.createdAt)}</div>
            </div>
          </a>`).join('')}
      </div>
    </div>
    <div class="widget">
      <h3 class="widget-title">Categories</h3>
      <div class="cat-list-widget">
        ${CATEGORIES.map((c) => `
          <a class="cat-list-item" href="category.html?slug=${c.slug}">
            <span class="cat-name">${c.name}</span>
            <span class="cat-count">${posts.filter((p) => p.categoryId === c.id).length}</span>
          </a>`).join('')}
      </div>
    </div>`;
}
