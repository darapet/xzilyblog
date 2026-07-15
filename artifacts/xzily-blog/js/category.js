import { mountLayout, formatDate, qs, getCatColor } from './common.js';
import { icon } from './icons.js';
import { categoryBySlug, userById, CATEGORIES } from './data.js';
import { store } from './store.js';

mountLayout('category.html');

const slug = qs('slug');
const cat = categoryBySlug(slug);

if (!cat) {
  document.getElementById('catTitle').textContent = 'Category not found';
  document.getElementById('catGrid').innerHTML = '';
} else {
  document.getElementById('pageTitle').textContent = `${cat.name} — Xzily`;
  document.getElementById('catCrumb').textContent = cat.name;
  document.getElementById('catTitle').textContent = cat.name;
  document.getElementById('catDesc').textContent = cat.description;

  const posts = store.getPosts({ status: 'published' }).filter((p) => p.categoryId === cat.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById('catGrid').innerHTML = posts.map((p, i) => cardHtml(p, i, cat)).join('');
  if (posts.length === 0) {
    document.getElementById('catEmpty').innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('fileText', 24)}</div>
        <h3>No stories yet in ${cat.name}</h3>
        <p>Check back soon.</p>
      </div>`;
  }
}

document.getElementById('catSidebar').innerHTML = sidebarHtml();

function cardHtml(p, i, cat) {
  const author = userById(p.authorId);
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

function sidebarHtml() {
  const trending = [...store.getPosts({ status: 'published' })].sort((a, b) => b.views - a.views).slice(0, 5);
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
            <span class="cat-count">${store.getPosts({ status: 'published' }).filter((p) => p.categoryId === c.id).length}</span>
          </a>`).join('')}
      </div>
    </div>
    <div class="widget newsletter-widget">
      <h3 class="widget-title">Subscribe</h3>
      <p>Never miss a story. Get our weekly newsletter.</p>
      <form class="newsletter-form" style="margin-top: 15px;">
        <input type="email" placeholder="Email address" required />
        <button class="btn btn-primary btn-block" type="submit" style="margin-top: 10px;">Sign Up</button>
      </form>
    </div>`;
}