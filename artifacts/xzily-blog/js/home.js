import { mountLayout, formatDate, formatCount, initNotificationPrompt, getCatColor } from './common.js';
import { icon } from './icons.js';
import { store } from './store.js';

const NEWS_PLACEHOLDER = 'images/news-placeholder.jpg';

// ── Skeleton placeholders shown IMMEDIATELY — zero network requests needed ──
// These render synchronously so the user sees structure right away.
const SKELETON_CARD = `
  <div class="mag-card skeleton-card">
    <div class="mag-card-media skeleton-box"></div>
    <div class="mag-card-body">
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-full"></div>
      <div class="skeleton-line skeleton-line-half"></div>
    </div>
  </div>`;

const SKELETON_HERO_LEAD = `<div class="hero-card hero-card-lead skeleton-box"></div>`;
const SKELETON_HERO_SM   = `<div class="hero-card hero-card-sm skeleton-box" style="height:160px"></div>`;
const SKELETON_ROW       = `<a class="trending-item skeleton-row"><div class="skeleton-line skeleton-line-full" style="height:14px;width:80%"></div></a>`;

document.getElementById('heroGrid').innerHTML = `
  <div class="hero-lead">${SKELETON_HERO_LEAD}</div>
  <div class="hero-secondary">${[1,2,3,4].map(() => SKELETON_HERO_SM).join('')}</div>`;
document.getElementById('latestGrid').innerHTML = [1,2,3,4,5,6].map(() => SKELETON_CARD).join('');
document.getElementById('trendingList').innerHTML = [1,2,3,4,5].map(() => SKELETON_ROW).join('');

// ── Fire ALL data fetches NOW, in parallel with mountLayout ─────────────────
// Fetch own posts and news posts in separate queries so user-written content
// always appears even when the scraper has inserted hundreds of news articles
// (a single limit-100 query would return only the newest news-bot posts).
const ownPostsPromise  = store.getPosts({ status: 'published', excludeAuthor: 'news-bot' });
const newsPostsPromise = store.getPosts({ status: 'published', author: 'news-bot', limit: 200 });
const catsPromise      = store.getCategories();
const authorsPromise   = store.getAuthors();
const settingsPromise  = store.getSettings();

// Mount navbar/footer concurrently — reuses cached promises above
await mountLayout('index.html');

// Render category widget as soon as that tiny table comes back
const CATEGORIES = await catsPromise;
document.getElementById('catGrid').innerHTML = CATEGORIES.map((c) => `
  <a class="cat-list-item" href="category.html?slug=${c.slug}">
    <span class="cat-name">${c.name}</span>
    <span class="cat-count skeleton-count">…</span>
  </a>`).join('');

// Wait for the rest
const [ownPosts, rawNewsPosts, AUTHORS, settings] = await Promise.all([
  ownPostsPromise, newsPostsPromise, authorsPromise, settingsPromise,
]);

// ── Split own posts vs auto-imported news ───────────────────────────────────
const newsPosts = settings.externalNewsEnabled ? rawNewsPosts : [];

// Own posts: newest first
ownPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// ── News priority order ─────────────────────────────────────────────────────
// 1-Sports  2-Education  3-Technology  4-Health  5-Business  6-Culture  7-Lifestyle  8-Travel
const CAT_PRIORITY = { c8: 1, c7: 2, c1: 3, c4: 4, c2: 5, c5: 6, c3: 7, c6: 8 };

function catPriority(p) { return CAT_PRIORITY[p.categoryId] || 9; }

function isFootball(p) {
  const txt = (p.title + ' ' + (p.excerpt || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
  return /football|soccer|premier league|fifa|uefa|champions league|world cup|bundesliga|la liga|serie a|epl|fa cup/.test(txt);
}

newsPosts.sort((a, b) => {
  const pa = catPriority(a), pb = catPriority(b);
  if (pa !== pb) return pa - pb;
  // Within sports, football articles rise to the top
  if (a.categoryId === 'c8' && b.categoryId === 'c8') {
    const af = isFootball(a) ? 0 : 1;
    const bf = isFootball(b) ? 0 : 1;
    if (af !== bf) return af - bf;
  }
  return new Date(b.createdAt) - new Date(a.createdAt);
});

// ── Merge: 1 own post then 2 news, repeat ──────────────────────────────────
const posts = [];
let oi = 0, ni = 0;
while (oi < ownPosts.length || ni < newsPosts.length) {
  if (oi < ownPosts.length)  posts.push(ownPosts[oi++]);
  if (ni < newsPosts.length) posts.push(newsPosts[ni++]);
  if (ni < newsPosts.length) posts.push(newsPosts[ni++]);
}

const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null;
const userById     = (id) => AUTHORS.find((u) => u.id === id)
  || { name: 'Staff Writer', avatar: 'images/avatar-1.jpg', avatarUrl: 'images/avatar-1.jpg' };

// ── Hero section ────────────────────────────────────────────────────────────
const featured = ownPosts.find(p => p.featured) || ownPosts[0] || posts[0];
if (!featured) {
  document.getElementById('heroGrid').innerHTML =
    '<p style="padding:60px 0;color:var(--text-muted);">No published stories yet. Sign in as an editor to publish the first one.</p>';
} else {
  const otherFeatured = posts.filter(p => p.id !== featured.id).slice(0, 4);
  document.getElementById('heroGrid').innerHTML = `
    <div class="hero-lead">${featureCardHtml(featured, true)}</div>
    <div class="hero-secondary">${otherFeatured.map(p => featureCardHtml(p, false)).join('')}</div>`;
}

// ── Latest grid ─────────────────────────────────────────────────────────────
document.getElementById('latestGrid').innerHTML = posts.slice(0, 8).map((p, i) => cardHtml(p, i)).join('');

// ── Trending ────────────────────────────────────────────────────────────────
const trending = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
document.getElementById('trendingList').innerHTML = trending.map((p, i) => rowCardHtml(p, i + 1)).join('');

// ── Category widget counts (now we have posts) ──────────────────────────────
document.getElementById('catGrid').innerHTML = CATEGORIES.map((c) => `
  <a class="cat-list-item" href="category.html?slug=${c.slug}">
    <span class="cat-name">${c.name}</span>
    <span class="cat-count">${posts.filter(p => p.categoryId === c.id).length}</span>
  </a>`).join('');

await renderBookmarks();

// ── Bookmark section ────────────────────────────────────────────────────────
async function renderBookmarks() {
  const bookmarked = await store.getBookmarkedPosts();
  const header = document.getElementById('bookmarksHeader');
  const grid   = document.getElementById('bookmarkGrid');
  if (bookmarked.length === 0) {
    header.style.display = 'none';
    grid.style.display   = 'none';
    return;
  }
  header.style.display = '';
  grid.style.display   = 'grid';
  grid.innerHTML = bookmarked.map((p, i) => cardHtml(p, i)).join('');
}

// ── Card renderers ──────────────────────────────────────────────────────────

function newsImg(p, cls = '') {
  const isNews  = p.authorId === 'news-bot';
  const src     = p.coverImage || (isNews ? NEWS_PLACEHOLDER : '');
  const onErr   = isNews ? `onerror="this.onerror=null;this.src='${NEWS_PLACEHOLDER}'"` : `onerror="this.style.display='none'"`;
  return src ? `<img src="${src}" alt="${escAttr(p.title)}" ${cls ? `class="${cls}"` : ''} loading="lazy" ${onErr} />` : '';
}

function featureCardHtml(p, isLead) {
  const cat    = categoryById(p.categoryId);
  const isNews = p.authorId === 'news-bot';
  const author = isNews ? null : userById(p.authorId);
  const src    = p.coverImage || (isNews ? NEWS_PLACEHOLDER : '');
  const onErr  = isNews
    ? `onerror="this.onerror=null;this.src='${NEWS_PLACEHOLDER}'"`
    : `onerror="this.style.display='none'"`;
  return `
    <a href="article.html?slug=${p.slug}" class="hero-card ${isLead ? 'hero-card-lead' : 'hero-card-sm'}">
      ${src ? `<img src="${src}" alt="${escAttr(p.title)}" ${onErr} />` : ''}
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
  const cat    = categoryById(p.categoryId);
  const isNews = p.authorId === 'news-bot';
  const author = isNews ? null : userById(p.authorId);
  return `
    <div class="mag-card">
      <a class="mag-card-media" href="article.html?slug=${p.slug}">
        ${newsImg(p)}
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

function escAttr(str = '') { return str.replace(/"/g, '&quot;'); }

initNotificationPrompt();
