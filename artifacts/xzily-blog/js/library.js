// ═══════════════════════════════════════════════════════
//  Xzily Library — Main Browse Page
// ═══════════════════════════════════════════════════════
import { mountLayout, formatCount, toast } from './common.js';
import { libStore, BOOK_CATEGORIES, getCategoryBySlug } from './library-store.js';

// ── Gutenberg (Project Gutenberg free classics) ──────────
const GUTENDEX = 'https://gutendex.com/books';
const GUTENBERG_TOPIC_MAP = {
  fiction: 'fiction', religion: 'religion', science: 'science',
  history: 'history', business: 'business', 'self-help': 'self-help',
  health: 'health', education: 'education', travel: 'travel',
  philosophy: 'philosophy', children: 'children', law: 'law',
  sports: 'sports', 'emotional-wellbeing': 'psychology',
};

async function searchGutenberg({ keyword = '', category = null, page = 1 } = {}) {
  // Cache results so tab/category switches are instant on revisit (10-min TTL)
  const cacheKey = `__gut_${keyword}_${category || 'all'}_${page}__`;
  const TTL = 10 * 60 * 1000;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < TTL) return data;
    }
  } catch(_) {}

  const params = new URLSearchParams({ languages: 'en', page: String(page) });
  if (keyword) params.set('search', keyword);
  const topic = GUTENBERG_TOPIC_MAP[category] || '';
  if (topic) params.set('topic', topic);
  const res = await fetch(`${GUTENDEX}/?${params}`);
  if (!res.ok) throw new Error('Could not reach Project Gutenberg. Check your connection.');
  const data = await res.json();
  const result = { books: data.results || [], count: data.count || 0, hasNext: !!data.next };

  try { sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })); } catch(_) {}
  return result;
}

// ── State ────────────────────────────────────────────────
let activeTab      = 'classics';   // 'classics' | 'community'
let activeCategory = null;         // null = All
let keyword        = '';
let gutPage        = 1;
let commPage       = 1;
let hasMore        = false;

// ── DOM refs ─────────────────────────────────────────────
const grid         = document.getElementById('booksGrid');
const countEl      = document.getElementById('bookCount');
const sectionTitle = document.getElementById('sectionTitle');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const loadMoreBtn  = document.getElementById('loadMoreBtn');
const searchInput  = document.getElementById('libSearch');

// ── Boot ─────────────────────────────────────────────────
await mountLayout('library.html');
renderGenrePills();
renderSidebarGenres();
await load(true);

// ── Tab switching ─────────────────────────────────────────
document.querySelectorAll('.lib-tab-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (btn.dataset.tab === activeTab) return;
    document.querySelectorAll('.lib-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    gutPage = 1; commPage = 1;
    sectionTitle.textContent = activeTab === 'classics' ? 'Classic Books' : 'Community Library';
    await load(true);
  });
});

// ── Search ────────────────────────────────────────────────
document.getElementById('libSearchBtn').addEventListener('click', doSearch);
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
async function doSearch() {
  keyword = searchInput.value.trim();
  gutPage = 1; commPage = 1;
  await load(true);
}

// ── Load More ─────────────────────────────────────────────
loadMoreBtn.addEventListener('click', () => load(false));

// ── Genre pills ───────────────────────────────────────────
function renderGenrePills() {
  const wrap = document.getElementById('genrePills');
  const all  = [{ slug: null, name: 'All Books', icon: '📚' }, ...BOOK_CATEGORIES];
  wrap.innerHTML = all.map(g =>
    `<button class="lib-genre-pill${g.slug === activeCategory ? ' active' : ''}" data-cat="${g.slug ?? ''}">${g.icon} ${g.name}</button>`
  ).join('');
  wrap.addEventListener('click', async e => {
    const pill = e.target.closest('.lib-genre-pill');
    if (!pill) return;
    wrap.querySelectorAll('.lib-genre-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategory = pill.dataset.cat || null;
    gutPage = 1; commPage = 1;
    await load(true);
  });
}

function renderSidebarGenres() {
  const ul = document.getElementById('sidebarGenres');
  if (!ul) return;
  ul.innerHTML = BOOK_CATEGORIES.map(g =>
    `<li><a href="#" data-cat="${g.slug}">${g.icon} ${g.name}<span>→</span></a></li>`
  ).join('');
  ul.addEventListener('click', e => {
    const a = e.target.closest('a[data-cat]');
    if (!a) return;
    e.preventDefault();
    activeCategory = a.dataset.cat;
    document.querySelectorAll('.lib-genre-pill').forEach(p =>
      p.classList.toggle('active', (p.dataset.cat || null) === activeCategory)
    );
    load(true);
  });
}

// ── Main load function ────────────────────────────────────
async function load(reset) {
  if (reset) showSkeleton();
  loadMoreBtn.disabled = true;

  try {
    if (activeTab === 'classics') {
      const page = reset ? 1 : gutPage;
      const { books, count, hasNext } = await searchGutenberg({ keyword, category: activeCategory, page });
      if (reset) gutPage = 2; else gutPage++;
      hasMore = hasNext;
      countEl.textContent = count ? `${formatCount(count)} books` : '';
      renderGutenbergGrid(books, reset);
    } else {
      const page = reset ? 1 : commPage;
      const books = await libStore.getBooks({
        category: activeCategory,
        search:   keyword || null,
        status:   'published',
         limit:    200,
      });
      if (reset) commPage = 2; else commPage++;
       hasMore = books.length === 200;
      countEl.textContent = books.length ? `${books.length}+ books` : '';
      renderCommunityGrid(books, reset);
    }
  } catch (err) {
    grid.innerHTML = emptyState('⚠️', 'Could not load books', err.message);
    toast(err.message);
  }

  loadMoreWrap.hidden = !hasMore;
  loadMoreBtn.disabled = false;
}

// ── Gutenberg cards ───────────────────────────────────────
function renderGutenbergGrid(books, reset) {
  if (!books.length && reset) {
    grid.innerHTML = emptyState('📭', 'No classics found', 'Try a different genre or search term.');
    return;
  }
  const html = books.map(gutenbergCard).join('');
  if (reset) {
    grid.innerHTML = `<div class="lib-grid">${html}</div>`;
  } else {
    grid.querySelector('.lib-grid')?.insertAdjacentHTML('beforeend', html);
  }
  wireCards();
}

function gutenbergCard(b) {
  const cover   = (b.formats || {})['image/jpeg'] || '';
  const authors = (b.authors || []).map(a => a.name).join(', ') || 'Unknown';
  const dl      = formatCount(b.download_count || 0);
  return `
  <div class="lib-book-card" data-type="gutenberg" data-id="${b.id}" tabindex="0" role="button" aria-label="${esc(b.title)}">
    ${cover
      ? `<img class="lib-book-thumb" src="${cover}" alt="${esc(b.title)}" loading="lazy" onerror="this.style.display='none'" />`
      : `<div class="lib-book-thumb-placeholder"><span class="lib-book-thumb-placeholder-icon">📖</span>${esc(b.title.slice(0, 40))}</div>`
    }
    <div class="lib-book-info">
      <span class="lib-book-genre-badge">Classic</span>
      <p class="lib-book-title">${esc(b.title)}</p>
      <p class="lib-book-author">${esc(authors)}</p>
      <div class="lib-book-meta"><span>⬇ ${dl} downloads</span></div>
    </div>
  </div>`;
}

// ── Community cards ───────────────────────────────────────
function renderCommunityGrid(books, reset) {
  if (!books.length && reset) {
    grid.innerHTML = emptyState('📭', 'No books yet',
      activeCategory ? 'No books in this category yet.' : 'Be the first to upload a book!')
      + `<div style="text-align:center;margin-top:20px;">
           <a href="library-upload.html" class="btn btn-primary">Upload a Book</a>
         </div>`;
    return;
  }
  const html = books.map(communityCard).join('');
  if (reset) {
    grid.innerHTML = `<div class="lib-grid">${html}</div>`;
  } else {
    grid.querySelector('.lib-grid')?.insertAdjacentHTML('beforeend', html);
  }
  wireCards();
}

function communityCard(b) {
  const cat = getCategoryBySlug(b.category);
  return `
  <div class="lib-book-card" data-type="community" data-id="${b.id}" tabindex="0" role="button" aria-label="${esc(b.title)}">
    ${b.coverUrl
      ? `<img class="lib-book-thumb" src="${esc(b.coverUrl)}" alt="${esc(b.title)}" loading="lazy" onerror="this.style.display='none'" />`
      : `<div class="lib-book-thumb-placeholder"><span class="lib-book-thumb-placeholder-icon">${cat.icon}</span>${esc(b.title.slice(0, 40))}</div>`
    }
    <div class="lib-book-info">
      <span class="lib-book-genre-badge">${esc(cat.name)}</span>
      <p class="lib-book-title">${esc(b.title)}</p>
      <p class="lib-book-author">by ${esc(b.authorName || 'Unknown')}</p>
      <div class="lib-book-meta">
        <span>❤ ${formatCount(b.likesCount)}</span>
        <span>👁 ${formatCount(b.views)}</span>
        <span>💬 ${formatCount(b.commentsCount)}</span>
      </div>
    </div>
  </div>`;
}

// ── Card click → read page ────────────────────────────────
function wireCards() {
  grid.querySelectorAll('.lib-book-card').forEach(card => {
    const go = () => {
      const { type, id } = card.dataset;
      if (type === 'gutenberg') {
        window.location.href = `library-read.html?type=gutenberg&id=${id}`;
      } else {
        window.location.href = `library-read.html?id=${id}`;
      }
    };
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
}

// ── Skeleton loader ───────────────────────────────────────
function showSkeleton() {
  grid.innerHTML = `<div class="lib-skeleton-grid">
    ${Array(12).fill(`
      <div class="lib-skeleton-card">
        <div class="lib-skeleton-thumb"></div>
        <div class="lib-skeleton-body">
          <div class="lib-skeleton-line"></div>
          <div class="lib-skeleton-line short"></div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── Helpers ───────────────────────────────────────────────
function emptyState(icon, title, sub = '') {
  return `<div class="lib-empty">
    <div class="lib-empty-icon">${icon}</div>
    <p class="lib-empty-title">${title}</p>
    ${sub ? `<p class="lib-empty-sub">${sub}</p>` : ''}
  </div>`;
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
