import { icon } from './icons.js';
import { store } from './store.js';

export function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

export function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export function toast(message, iconName = 'checkCircle') {
  let el = document.querySelector('.mini-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'mini-toast';
    document.body.appendChild(el);
  }
  el.innerHTML = `${icon(iconName, 16)}<span>${escapeHtml(message)}</span>`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2600);
}

export function getCatColor(slug) {
  const colors = {
    technology: '#ba1818',
    business: '#0055a4',
    lifestyle: '#008a00',
    health: '#e65c00',
    culture: '#6c00a2',
    travel: '#009999',
    education: '#a35a00',
    sports: '#1a7a3c'
  };
  return colors[slug] || '#ba1818';
}

export async function renderNavbar(activePath = '', cats = [], siteSettings = {}) {
  // Limit ticker to 5 posts — no need to fetch hundreds just for the headline strip.
  // On the home page these share the same cached promise as the main content fetch.
  const [session, bookmarks, posts] = await Promise.all([
    store.getSession(),
    store.getBookmarkedPosts(),
    store.getPosts({ status: 'published', limit: 100 }),
  ]);
  const brandHtml = siteSettings.logoUrl
    ? `<img src="${siteSettings.logoUrl}" class="brand-logo" alt="${escapeHtml(siteSettings.siteName || 'Home')}" />`
    : `${escapeHtml(siteSettings.siteName || 'THE EDUCATIVE BLOG')}<span class="dot">.</span>`;
  const bookmarkCount = bookmarks.length;

  const mainLinks = [
    ['index.html', 'Home'],
    ['about.html', 'About'],
    ['contact.html', 'Contact']
  ];
  
  const authArea = session
    ? `<a href="#" id="logoutBtn" class="nav-auth-link">${icon('logOut', 15)} ${escapeHtml(session.name.split(' ')[0])}</a>`
    : `<a href="login.html" class="nav-auth-link">SIGN IN</a>`;

  const topPosts = posts.slice(0, 5).map(p => p.title).join(' &nbsp; &bull; &nbsp; ');

  return `
  <div class="top-ticker">
    <div class="container">
      <div class="ticker-content">
        <div class="ticker-label">Flash News</div>
        <div class="ticker-marquee">
          <div class="ticker-track">
            <span>${topPosts}</span>
            <span aria-hidden="true">${topPosts}</span>
          </div>
        </div>
      </div>
      <div class="ticker-date" id="liveDateDisplay"></div>
    </div>
  </div>

  <header class="magazine-header">
    <div class="container">
      <a href="index.html" class="brand">${brandHtml}</a>
      <div class="header-banner" id="headerAdSlot"></div>
    </div>
  </header>

  <nav class="main-nav">
    <div class="container nav-container">
      <div class="nav-links">
        ${mainLinks.map(([href, label]) => `<a href="${href}" class="${isActive(href, activePath) ? 'active' : ''}">${label.toUpperCase()}</a>`).join('')}
      </div>
      <div class="nav-actions">
        <form class="nav-search-form" action="search.html" method="get">
          <input type="search" name="q" placeholder="Search..." aria-label="Search articles" />
          <button type="submit" class="search-btn">${icon('search', 16)}</button>
        </form>
        <a href="index.html#bookmarksHeader" class="icon-link" id="bookmarkNavBtn" title="Bookmarks">
          ${icon('bookmark', 18)}
          ${bookmarkCount ? `<span class="count-badge">${bookmarkCount}</span>` : ''}
        </a>
        ${authArea}
        <button class="icon-btn nav-toggle" id="mobileMenuBtn" aria-label="Open menu">${icon('menu', 18)}</button>
      </div>
    </div>
  </nav>

  <nav class="cat-nav">
    <div class="container">
      <div class="cat-links">
        ${cats.map(c => `<a href="category.html?slug=${c.slug}" class="${activePath.includes('category.html') && qs('slug') === c.slug ? 'active' : ''}">${c.name.toUpperCase()}</a>`).join('')}
      </div>
    </div>
  </nav>
  
  <div class="mobile-drawer" id="mobileDrawer">
    <div class="mobile-drawer-panel">
      <button class="icon-btn mobile-drawer-close" id="mobileMenuClose" aria-label="Close menu">${icon('close', 18)}</button>
      ${mainLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}
      ${cats.map(c => `<a href="category.html?slug=${c.slug}">${c.name}</a>`).join('')}
      ${session ? '' : '<a href="login.html">Sign in</a><a href="register.html">Create account</a>'}
    </div>
  </div>`;
}

function isActive(href, activePath) {
  const path = href.split('?')[0];
  return activePath === path || (activePath === '' && path === 'index.html');
}

export function renderFooter(s = {}, cats = []) {
  const name    = s.siteName     || 'The Educative Blog';
  const credit  = s.footerCredit || 'Built by Darapet Technology plc';
  const brandHtml = s.logoUrl
    ? `<img src="${s.logoUrl}" class="brand-logo" alt="${escapeHtml(name)}" />`
    : `${escapeHtml(name.toUpperCase())}<span class="dot">.</span>`;
  const socials = [
    s.twitterUrl         && `<a href="${s.twitterUrl}" target="_blank" rel="noopener" aria-label="X / Twitter">${icon('x', 16)}</a>`,
    s.fbUrl              && `<a href="${s.fbUrl}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook', 16)}</a>`,
    s.instagramUrl       && `<a href="${s.instagramUrl}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram', 16)}</a>`,
    s.whatsappNumber     && `<a href="https://wa.me/${s.whatsappNumber.replace(/\D/g,'')}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp', 16)}</a>`,
    s.whatsappChannelUrl && `<a href="${s.whatsappChannelUrl}" target="_blank" rel="noopener" aria-label="WhatsApp Channel">${icon('whatsapp', 16)}<sup style="font-size:9px;margin-left:1px;">ch</sup></a>`,
  ].filter(Boolean).join('') || [
    `<a href="#" aria-label="X / Twitter">${icon('x', 16)}</a>`,
    `<a href="#" aria-label="Facebook">${icon('facebook', 16)}</a>`,
    `<a href="#" aria-label="Instagram">${icon('instagram', 16)}</a>`,
  ].join('');

  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="brand">${brandHtml}</a>
          <p>Your trusted source for insightful stories, practical knowledge, and fresh perspectives on education, technology, business, lifestyle, health, travel, culture, and more.</p>
          <div class="footer-social">${socials}</div>
        </div>
        <div>
          <h5>Sections</h5>
          <ul>
            ${cats.map((c) => `<li><a href="category.html?slug=${c.slug}">${c.name}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h5>Company</h5>
          <ul>
            <li><a href="about.html">About ${name}</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="admin/login.html">Editor Login</a></li>
          </ul>
        </div>
        <div>
          <h5>Legal</h5>
          <ul>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms of Service</a></li>
            <li><a href="cookies.html">Cookie Policy</a></li>
            <li><a href="disclaimer.html">Disclaimer</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</span>
        <span>${credit}</span>
      </div>
    </div>
  </footer>`;
}

export async function mountLayout(activePath) {
  const navSlot = document.getElementById('site-navbar');
  const footSlot = document.getElementById('site-footer');
  // Fetch site settings so footer socials/credit/name come from the DB.
  // Use a short-lived module-level cache so multiple calls per page don't
  // re-fetch (about.js needs them too and calls getSettings separately).
  const [siteSettings, cats] = await Promise.all([
    store.getSettings().catch(() => ({})),
    store.getCategories().catch(() => []),
  ]);
  if (navSlot) navSlot.outerHTML = await renderNavbar(activePath, cats, siteSettings);
  if (footSlot) footSlot.outerHTML = renderFooter(siteSettings, cats);
  applyTheme(siteSettings);
  applyFavicon(siteSettings.faviconUrl);
  wireLayoutEvents();
  initReveal();
  mountHeaderAds().catch(() => {});
  return siteSettings; // let callers reuse the already-fetched object
}

function applyTheme(s = {}) {
  const root = document.documentElement;
  if (s.themeAccent) { root.style.setProperty('--primary',       s.themeAccent); root.style.setProperty('--primary-hover', s.themeAccent); }
  if (s.themeBg)     root.style.setProperty('--light-bg',    s.themeBg);
  if (s.themeInk)    root.style.setProperty('--text-main',   s.themeInk);
}

function applyFavicon(url) {
  if (!url) return;
  let link = document.querySelector('link[rel~="icon"]');
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = url;
}

function wireLayoutEvents() {
  const d = document.getElementById('liveDateDisplay');
  if (d) {
    const updateTime = () => {
      const now = new Date();
      d.textContent = now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  const menuBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (menuBtn && drawer) {
    menuBtn.addEventListener('click', () => drawer.classList.add('open'));
  }
  if (closeBtn && drawer) {
    closeBtn.addEventListener('click', () => drawer.classList.remove('open'));
  }
  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) drawer.classList.remove('open');
    });
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await store.logout();
      toast('Signed out');
      setTimeout(() => window.location.href = 'index.html', 500);
    });
  }
  wireNewsletterForms();
}


// ── Rotating header banner ads ────────────────────────────────────────────────
async function mountHeaderAds() {
  const slot = document.getElementById('headerAdSlot');
  if (!slot) return;
  let ads = [];
  try { ads = await store.getActiveAds('sidebar'); } catch (_) { return; }
  if (!ads.length) { slot.style.display = 'none'; return; }

  let current = 0;

  function buildSlide(ad) {
    const wrap = document.createElement('div');
    wrap.className = 'had-slide';
    const dest = ad.linkUrl || null;
    const hasText = ad.title || ad.body;

    if (ad.videoUrl) {
      // Video — full banner
      const vid = document.createElement('video');
      vid.src = ad.videoUrl; vid.autoplay = true; vid.muted = true;
      vid.loop = true; vid.playsInline = true;
      vid.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      wrap.appendChild(vid);
    } else if (ad.imageUrl && hasText) {
      // Image + text side by side
      wrap.classList.add('had-combo');
      const imgBox = document.createElement('div');
      imgBox.className = 'had-combo-img';
      const img = document.createElement('img');
      img.src = ad.imageUrl; img.alt = ad.title || '';
      imgBox.appendChild(img);
      const textBox = document.createElement('div');
      textBox.className = 'had-combo-text';
      if (ad.title) {
        const t = document.createElement('strong');
        t.textContent = ad.title;
        textBox.appendChild(t);
      }
      if (ad.body) {
        const b = document.createElement('p');
        b.textContent = ad.body;
        textBox.appendChild(b);
      }
      wrap.appendChild(imgBox);
      wrap.appendChild(textBox);
    } else if (ad.imageUrl) {
      // Image only — full banner
      const img = document.createElement('img');
      img.src = ad.imageUrl; img.alt = ad.title || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      wrap.appendChild(img);
    } else {
      // Text-only — scrolling marquee
      wrap.classList.add('had-text');
      const inner = document.createElement('div');
      inner.className = 'had-text-inner';
      const t = document.createElement('strong');
      t.textContent = ad.title || '';
      inner.appendChild(t);
      if (ad.body) {
        const b = document.createElement('span');
        b.textContent = ' — ' + ad.body;
        inner.appendChild(b);
      }
      wrap.appendChild(inner);
    }

    if (dest) {
      wrap.style.cursor = 'pointer';
      wrap.addEventListener('click', () => window.open(dest, '_blank', 'noopener'));
    }
    return wrap;
  }

  function showSlide(idx) {
    const next = buildSlide(ads[idx]);
    next.classList.add('had-enter');
    const old = slot.querySelector('.had-slide');
    if (old) { old.classList.add('had-exit'); setTimeout(() => old.remove(), 420); }
    slot.appendChild(next);
    requestAnimationFrame(() => requestAnimationFrame(() => next.classList.remove('had-enter')));
  }

  showSlide(0);
  if (ads.length > 1) setInterval(() => { current = (current + 1) % ads.length; showSlide(current); }, 6000);
}

export function wireNewsletterForms() {
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    if (form._wired) return;
    form._wired = true;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && input.value) {
        try {
          await store.addSubscriber(input.value.trim());
          toast('Subscribed! Welcome to The Educative Blog.');
          input.value = '';
        } catch {
          toast('Could not subscribe — try again.');
        }
      }
    });
  });
}

export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || targets.length === 0) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  targets.forEach((t) => io.observe(t));
}

export function initNotificationPrompt() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'default') return;
  if (sessionStorage.getItem('xzily_notif_dismissed')) return;

  const el = document.createElement('div');
  el.className = 'notif-toast';
  el.innerHTML = `
    <div class="icon-wrap">${icon('bell', 18)}</div>
    <h4>Stay in the loop</h4>
    <p>Get a real browser notification when The Educative Blog publishes a new story.</p>
    <div class="actions">
      <button class="btn btn-primary" id="notifAllow">Allow</button>
      <button class="btn btn-outline" id="notifDismiss">Not now</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  el.querySelector('#notifDismiss').addEventListener('click', () => {
    sessionStorage.setItem('xzily_notif_dismissed', '1');
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  });
  el.querySelector('#notifAllow').addEventListener('click', async () => {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      store.setNotificationOptIn(true);
      new Notification('The Educative Blog', { body: "You're subscribed to new-story alerts.", icon: 'favicon.svg' });
      toast('Notifications enabled');
    }
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  });
}