import { icon } from './icons.js';
import { store } from './store.js';

// Auth guard — redirect to writer login if not signed in as a writer.
// Returns the session object on success, null on redirect.
export async function requireWriter() {
  const session = await store.getSession();
  if (!session || (session.role !== 'writer' && !session.isAdmin)) {
    window.location.href = location.pathname.includes('/writer/')
      ? 'login.html'
      : 'writer/login.html';
    return null;
  }
  if (session.status === 'suspended') {
    window.location.href = location.pathname.includes('/writer/')
      ? 'suspended.html'
      : 'writer/suspended.html';
    return null;
  }
  if (session.status === 'restricted') {
    window.location.href = location.pathname.includes('/writer/')
      ? 'restricted.html'
      : 'writer/restricted.html';
    return null;
  }
  return session;
}

export function renderWriterShell(active, session) {
  const nav = [
    ['index.html',  'layoutDashboard', 'Dashboard'],
    ['posts.html',  'fileText',        'My Stories'],
    ['editor.html', 'plus',            'New Story'],
  ];
  return `
    <aside class="admin-sidebar" id="writerSidebar">
      <div class="brand"><span class="brand-mark">X</span>zily<span class="dot">.</span></div>
      <nav class="admin-nav">
        ${nav.map(([href, i, label]) =>
          `<a href="${href}" class="${active === href ? 'active' : ''}">${icon(i, 17)} <span>${label}</span></a>`
        ).join('')}
      </nav>
      <div class="sidebar-foot">
        <div style="margin-bottom:14px;">
          <div style="font-weight:700;color:#fff;">${session.name}</div>
          <div style="opacity:.6;font-size:12.5px;">Writer</div>
        </div>
        <a href="../index.html" style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">${icon('externalLink', 15)} View site</a>
        <a href="#" id="writerLogoutBtn" style="display:flex;align-items:center;gap:8px;">${icon('logOut', 15)} Sign out</a>
      </div>
    </aside>`;
}

export async function mountWriter(active, topbarTitle, topbarSub) {
  const session = await requireWriter();
  if (!session) return null;

  document.getElementById('writer-sidebar-slot').outerHTML = renderWriterShell(active, session);

  const title = document.getElementById('writerTitle');
  const sub   = document.getElementById('writerSub');
  if (title) title.textContent = topbarTitle;
  if (sub)   sub.textContent   = topbarSub || '';

  document.getElementById('writerLogoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await store.logout();
    window.location.href = 'login.html';
  });

  return session;
}
