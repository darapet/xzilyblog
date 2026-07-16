import { mountLayout } from './common.js';
import { store } from './store.js';

// mountLayout now returns the already-fetched settings — reuse them.
const settings = await mountLayout('about.html');

// About text
if (settings?.aboutText) {
  const aboutEl = document.getElementById('aboutText');
  if (aboutEl) aboutEl.innerHTML = settings.aboutText
    .split(/\n\n+/)
    .map((p) => `<p style="font-size:16.5px;color:var(--ink-800);line-height:1.8;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

// Stats
if (settings) {
  const stats = [
    ['statReaders',  settings.statsReaders,  'Monthly readers'],
    ['statStories',  settings.statsStories,  'Stories published'],
    ['statSections', settings.statsSections, 'Editorial sections'],
    ['statWriters',  settings.statsWriters,  'Staff writers'],
  ];
  for (const [id, val, label] of stats) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<b>${val}</b><span>${label}</span>`;
  }
}

// Team — loaded from Supabase authors table (Phase 2) for now falls back to
// static data so the page keeps working.
let teamMembers = [];
try {
  teamMembers = await store.getAuthors();
} catch (_) {
  const { USERS } = await import('./data.js');
  teamMembers = USERS;
}
document.getElementById('teamGrid').innerHTML = teamMembers.map((u) => `
  <div class="team-card">
    <img src="${u.avatar || u.avatarUrl || 'images/avatar-1.jpg'}" alt="${u.name}" />
    <h4>${u.name}</h4>
    <span>${(u.bio || u.role || '').split('.')[0]}${(u.bio || u.role || '').includes('.') ? '.' : ''}</span>
  </div>`).join('');
