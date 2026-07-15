import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { formatCount, timeAgo } from './common.js';
import { store } from './store.js';
import { toAdminAsset } from './asset.js';

const session = await mountAdmin('index.html', 'Dashboard', '');
if (session) {
  const sub = document.getElementById('adminSub');
  if (sub) sub.textContent = `Welcome back, ${session.name || ''}.`;
  await render();
}

async function render() {
  const posts = await store.getPosts({ status: 'all' });
  const published = posts.filter((p) => p.status === 'published');
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  const subscribers = (await store.getSubscribers()).length;

  document.getElementById('statGrid').innerHTML = [
    ['fileText', published.length, 'Published stories', '+' + posts.filter((p) => p.status === 'draft').length + ' drafts'],
    ['eye', formatCount(totalViews), 'Total views', ''],
    ['heart', formatCount(totalLikes), 'Total likes', ''],
    ['usersIcon', subscribers, 'Newsletter subscribers', ''],
  ].map(([i, val, label, delta]) => `
    <div class="stat-card">
      <div class="top-row">
        <span class="icon-wrap">${icon(i, 18)}</span>
        ${delta ? `<span class="delta">${delta}</span>` : ''}
      </div>
      <b>${val}</b>
      <span class="label">${label}</span>
    </div>`).join('');

  const top = [...published].sort((a, b) => b.views - a.views).slice(0, 6);
  document.querySelector('#topPostsTable tbody').innerHTML = top.map((p) => `
    <tr>
      <td class="table-post-title"><img src="${toAdminAsset(p.coverImage)}" alt="" /><div><div class="t">${p.title}</div></div></td>
      <td>${formatCount(p.views)}</td>
      <td>${formatCount(p.likes)}</td>
    </tr>`).join('') || `<tr><td colspan="3" style="color:var(--ink-400);">No stories yet.</td></tr>`;

  const comments = (await store.allComments()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  document.getElementById('activityFeed').innerHTML = comments.map((c) => `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <span class="icon-wrap" style="width:32px;height:32px;background:var(--red-50);color:var(--red-700);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${icon('messageCircle', 14)}</span>
      <div>
        <div style="font-size:13.5px;"><strong>${c.authorName || 'Guest'}</strong> commented</div>
        <div style="font-size:13px;color:var(--ink-600);">"${c.content.slice(0, 70)}${c.content.length > 70 ? '…' : ''}"</div>
        <div style="font-size:11.5px;color:var(--ink-400);margin-top:2px;">${timeAgo(c.createdAt)}</div>
      </div>
    </div>`).join('') || '<p style="color:var(--ink-400);font-size:13.5px;">No activity yet.</p>';
}
