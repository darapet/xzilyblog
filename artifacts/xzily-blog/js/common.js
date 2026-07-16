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

export async function renderNavbar(activePath = '', cats = []) {
  const [session, bookmarks, posts] = await Promise.all([
    store.getSession(),
    store.getBookmarkedPosts(),
    store.getPosts({ status: 'published' }),
  ]);
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
      <a href="index.html" class="brand">THE EDUCATIVE BLOG<span class="dot">.</span></a>
      <div class="header-banner">
        <span>Advertisement 728x90</span>
      </div>
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
  const name   = s.siteName     || 'The Educative Blog';
  const credit = s.footerCredit || 'Built by Darapet Technology plc';
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
          <a href="index.html" class="brand">${name.toUpperCase()}<span class="dot">.</span></a>
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
  if (navSlot) navSlot.outerHTML = await renderNavbar(activePath, cats);
  if (footSlot) footSlot.outerHTML = renderFooter(siteSettings, cats);
  wireLayoutEvents();
  initReveal();
  return siteSettings; // let callers reuse the already-fetched object
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