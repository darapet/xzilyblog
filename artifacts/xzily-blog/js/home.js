import { mountLayout, formatDate, formatCount, initNotificationPrompt } from './common.js';
import { icon } from './icons.js';
import { CATEGORIES, userById, categoryById } from './data.js';
import { store } from './store.js';

mountLayout('/index.html');

const posts = store.getPosts({ status: 'published' }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
const featured = posts.find((p) => p.featured) || posts[0];

document.getElementById('heroFeature').innerHTML = featured ? featureCardHtml(featured) : '';
document.getElementById('statPosts').textContent = posts.length;
document.getElementById('statCategories').textContent = CATEGORIES.length;

document.getElementById('catGrid').innerHTML = CATEGORIES.map((c) => `
  <a class="cat-chip" href="/category.html?slug=${c.slug}">
    ${icon(c.icon, 26)}
    <h4>${c.name}</h4>
    <span>${store.getPosts({ status: 'published' }).filter((p) => p.categoryId === c.id).length} stories</span>
  </a>`).join('');

document.getElementById('latestGrid').innerHTML = posts.slice(0, 6).map((p, i) => cardHtml(p, i)).join('');

const trending = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
document.getElementById('trendingList').innerHTML = trending.map((p, i) => rowCardHtml(p, i + 1)).join('');

renderBookmarks();

function renderBookmarks() {
  const bookmarked = store.getBookmarkedPosts();
  const section = document.getElementById('bookmarks');
  const grid = document.getElementById('bookmarkGrid');
  if (bookmarked.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';
  grid.innerHTML = bookmarked.map((p, i) => cardHtml(p, i)).join('');
}

function featureCardHtml(p) {
  const cat = categoryById(p.categoryId);
  const author = userById(p.authorId);
  return `
    <a href="/article.html?slug=${p.slug}" style="display:block;height:100%;">
      <img src="${p.coverImage}" alt="${escAttr(p.title)}" />
      <div class="overlay">
        <span class="tag-pill">${cat ? cat.name : ''}</span>
        <h3>${p.title}</h3>
        <div class="meta">
          <img class="avatar" src="${author.avatar}" alt="${escAttr(author.name)}" style="width:22px;height:22px;" />
          <span>${author.name}</span>
          <span>&middot;</span>
          <span>${p.readingTime} min read</span>
        </div>
      </div>
    </a>`;
}

function cardHtml(p, i) {
  const cat = categoryById(p.categoryId);
  const author = userById(p.authorId);
  return `
    <div class="card" style="--i:${i}">
      <a class="card-media" href="/article.html?slug=${p.slug}">
        <span class="card-cat">${cat ? cat.name : ''}</span>
        <img src="${p.coverImage}" alt="${escAttr(p.title)}" loading="lazy" />
      </a>
      <div class="card-body">
        <h3><a href="/article.html?slug=${p.slug}">${p.title}</a></h3>
        <p class="card-excerpt">${p.excerpt}</p>
        <div class="card-meta">
          <img class="avatar" src="${author.avatar}" alt="${escAttr(author.name)}" />
          <span>${author.name}</span>
          <span class="sep"></span>
          <span>${formatDate(p.createdAt)}</span>
          <span class="sep"></span>
          <span>${icon('clock', 14)} ${p.readingTime}m</span>
        </div>
      </div>
    </div>`;
}

function rowCardHtml(p, rank) {
  const author = userById(p.authorId);
  return `
    <a class="row-card" href="/article.html?slug=${p.slug}">
      <span class="rank">${rank}</span>
      <span class="thumb"><img src="${p.coverImage}" alt="${escAttr(p.title)}" /></span>
      <div class="info">
        <h4>${p.title}</h4>
        <div class="meta-line">
          <span>${author.name}</span>
          <span>&middot;</span>
          <span>${icon('eye', 13)} ${formatCount(p.views)}</span>
          <span>&middot;</span>
          <span>${icon('heart', 13)} ${formatCount(p.likes)}</span>
        </div>
      </div>
    </a>`;
}

function escAttr(str = '') {
  return str.replace(/"/g, '&quot;');
}

initNotificationPrompt();
