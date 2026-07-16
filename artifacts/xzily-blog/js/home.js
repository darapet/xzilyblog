import { mountLayout, formatDate, formatCount, initNotificationPrompt, getCatColor } from './common.js';
import { icon } from './icons.js';
import { store } from './store.js';

await mountLayout('index.html');

const [allPosts, CATEGORIES, AUTHORS, settings] = await Promise.all([
  store.getPosts({ status: 'published' }),
  store.getCategories(),
  store.getAuthors(),
  store.getSettings(),
]);

// Own posts (written by admins/writers) always appear first.
// Auto-imported news (author_id === 'news-bot') follows — or is hidden if
// the admin toggled external news off in Settings.
const ownPosts  = allPosts.filter(p => p.authorId !== 'news-bot');
const newsPosts = settings.externalNewsEnabled
  ? allPosts.filter(p => p.authorId === 'news-bot')
  : [];

ownPosts.sort((a, b)  => new Date(b.createdAt) - new Date(a.createdAt));
newsPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Merge: 1 own post then 2 news posts, repeat — so your posts always lead.
const posts = [];
let oi = 0, ni = 0;
while (oi < ownPosts.length || ni < newsPosts.length) {
  if (oi < ownPosts.length)  posts.push(ownPosts[oi++]);
  if (ni < newsPosts.length) posts.push(newsPosts[ni++]);
  if (ni < newsPosts.length) posts.push(newsPosts[ni++]);
}

const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null;
const userById = (id) => AUTHORS.find((u) => u.id === id) || { name: 'Staff Writer', avatar: 'images/avatar-1.jpg', avatarUrl: 'images/avatar-1.jpg' };
// Featured hero: prefer a manually-marked own post, then first own post, then any post.
const featured = ownPosts.find(p => p.featured) || ownPosts[0] || posts[0];

if (!featured) {
  document.getElementById('heroGrid').innerHTML = '<p style="padding:60px 0;color:var(--text-muted);">No published stories yet. Sign in as an editor to publish the first one.</p>';
} else {
  const otherFeatured = posts.filter((p) => p.id !== featured.id).slice(0, 4);
  document.getElementById('heroGrid').innerHTML = `
    <div class="hero-lead">
      ${featureCardHtml(featured, true)}
    </div>
    <div class="hero-secondary">
      ${otherFeatured.map(p => featureCardHtml(p, false)).join('')}
    </div>
  `;
}

document.getElementById('catGrid').innerHTML = CATEGORIES.map((c) => `
  <a class="cat-list-item" href="category.html?slug=${c.slug}">
    <span class="cat-name">${c.name}</span>
    <span class="cat-count">${posts.filter((p) => p.categoryId === c.id).length}</span>
  </a>`).join('');

document.getElementById('latestGrid').innerHTML = posts.slice(0, 8).map((p, i) => cardHtml(p, i)).join('');

const trending = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
document.getElementById('trendingList').innerHTML = trending.map((p, i) => rowCardHtml(p, i + 1)).join('');

await renderBookmarks();

async function renderBookmarks() {
  const bookmarked = await store.getBookmarkedPosts();
  const header = document.getElementById('bookmarksHeader');
  const grid = document.getElementById('bookmarkGrid');
  if (bookmarked.length === 0) {
    header.style.display = 'none';
    grid.style.display = 'none';
    return;
  }
  header.style.display = '';
  grid.style.display = 'grid'; // because it uses flex or grid
  grid.innerHTML = bookmarked.map((p, i) => cardHtml(p, i)).join('');
}

function featureCardHtml(p, isLead) {
  const cat = categoryById(p.categoryId);
  const isNews = p.authorId === 'news-bot';
  const author = isNews ? null : userById(p.authorId);
  return `
    <a href="article.html?slug=${p.slug}" class="hero-card ${isLead ? 'hero-card-lead' : 'hero-card-sm'}">
      <img src="${p.coverImage}" alt="${escAttr(p.title)}" />
      <div class="hero-overlay">
        <span class="cat-pill" style="--cat-color: ${getCatColor(cat?.slug)}">${cat ? cat.name : ''}</span>
        <h3>${p.title}</h3>
        <div class="hero-meta">
          ${author ? `<span>${author.name}</span><span>&middot;</span>` : ''}
          <span>${formatDate(p.createdAt)}</span>
        </div>
      </div>
    </a>`;
}

function cardHtml(p, i) {
  const cat = categoryById(p.categoryId);
  const isNews = p.authorId === 'news-bot';
  const author = isNews ? null : userById(p.authorId);
  return `
    <div class="mag-card">
      <a class="mag-card-media" href="article.html?slug=${p.slug}">
        <img src="${p.coverImage}" alt="${escAttr(p.title)}" loading="lazy" />
        <span class="cat-pill absolute-pill" style="--cat-color: ${getCatColor(cat?.slug)}">${cat ? cat.name : ''}</span>
      </a>
      <div class="mag-card-body">
        <h3 class="mag-card-title"><a href="article.html?slug=${p.slug}">${p.title}</a></h3>
        <p class="mag-card-excerpt">${p.excerpt}</p>
        <div class="mag-card-meta">
          ${author ? `<span class="author-name">${author.name}</span><span class="sep">-</span>` : ''}
          <span class="date">${formatDate(p.createdAt)}</span>
        </div>
      </div>
    </div>`;
}

function rowCardHtml(p, rank) {
  return `
    <a class="trending-item" href="article.html?slug=${p.slug}">
      <span class="trending-rank">${rank}</span>
      <div class="trending-info">
        <h4>${p.title}</h4>
        <div class="trending-meta">${formatDate(p.createdAt)}</div>
      </div>
    </a>`;
}

function escAttr(str = '') {
  return str.replace(/"/g, '&quot;');
}

initNotificationPrompt();
