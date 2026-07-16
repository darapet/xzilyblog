import { icon } from './icons.js';
import { store } from './store.js';

// Auth guard -- redirect to admin login if not signed in as admin.
export async function requireAdmin() {
  const session = await store.getSession();
  if (!session || !session.isAdmin) {
    const inAdmin = location.pathname.includes('/admin/');
    window.location.href = inAdmin ? 'login.html' : 'admin/login.html';
    return null;
  }
  return session;
}

export function renderAdminShell(active, session) {
  const nav = [
    ['index.html',          'layoutDashboard', 'Dashboard'],
    ['posts.html',          'fileText',         'Manage Posts'],
    ['editor.html',         'plus',             'New Story'],
    ['comments.html',       'messageCircle',    'Comments'],
    ['subscribers.html',    'usersIcon',        'Subscribers'],
    ['categories.html',     'folder',           'Categories'],
    ['authors.html',        'user',             'Authors'],
    ['writers.html',        'edit',             'Writers'],
    ['writer-reviews.html', 'checkCircle',      'Writer Reviews'],
    ['ads.html',            'barChart',         'Advertisements'],
    ['settings.html',       'settings',         'Settings'],
  ];
  return `
    <aside class="admin-sidebar" id="adminSidebar">
      <div class="brand"><span class="brand-mark">X</span>zily<span class="dot">.</span></div>
      <nav class="admin-nav">
        ${nav.map(([href, i, label]) => `<a href="${href}" class="${active === href ? 'active' : ''}">${icon(i, 17)} ${label}</a>`).join('')}
      </nav>
      <div class="sidebar-foot">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <img class="avatar" src="../images/avatar-1.jpg" alt="${session.name}" />
          <div>
            <div style="font-weight:700;color:#fff;">${session.name}</div>
            <div style="opacity:.6;">Editor</div>
          </div>
        </div>
        <a href="../index.html" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">${icon('externalLink', 15)} View site</a>
        <a href="#" id="adminLogoutBtn" style="display:flex;align-items:center;gap:8px;">${icon('logOut', 15)} Sign out</a>
      </div>
    </aside>`;
}

export async function mountAdmin(active, topbarTitle, topbarSub) {
  const session = await requireAdmin();
  if (!session) return null;
  document.getElementById('admin-sidebar-slot').outerHTML = renderAdminShell(active, session);
  const title = document.getElementById('adminTitle');
  const sub = document.getElementById('adminSub');
  if (title) title.textContent = topbarTitle;
  if (sub) sub.textContent = topbarSub || '';
  document.getElementById('adminLogoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await store.logout();
    window.location.href = 'login.html';
  });
  return session;
}
