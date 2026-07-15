import { mountLayout, formatDate, qs } from './common.js';
import { icon } from './icons.js';
import { categoryBySlug, userById } from './data.js';
import { store } from './store.js';

mountLayout('');

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

  document.getElementById('catGrid').innerHTML = posts.map((p, i) => cardHtml(p, i)).join('');
  if (posts.length === 0) {
    document.getElementById('catEmpty').innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('fileText', 24)}</div>
        <h3>No stories yet in ${cat.name}</h3>
        <p>Check back soon.</p>
      </div>`;
  }
}

function cardHtml(p, i) {
  const author = userById(p.authorId);
  return `
    <div class="card" style="--i:${i}">
      <a class="card-media" href="article.html?slug=${p.slug}">
        <img src="${p.coverImage}" alt="${p.title}" loading="lazy" />
      </a>
      <div class="card-body">
        <h3><a href="article.html?slug=${p.slug}">${p.title}</a></h3>
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
