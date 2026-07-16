import { mountWriter } from './writer-common.js';
import { icon } from './icons.js';
import { formatDate, formatCount, toast } from './common.js';
import { store } from './store.js';

const session = await mountWriter('index.html', 'My Dashboard', '');
if (!session) throw new Error('not authenticated');

document.getElementById('writerSub').textContent = `Welcome back, ${session.name.split(' ')[0]}!`;

const posts = await store.getMyPosts();

// Stats
const published = posts.filter(p => p.status === 'published');
const drafts    = posts.filter(p => p.status === 'draft');
const views     = posts.reduce((s, p) => s + (p.views || 0), 0);

document.getElementById('statTotal').textContent     = posts.length;
document.getElementById('statPublished').textContent = published.length;
document.getElementById('statDrafts').textContent    = drafts.length;
document.getElementById('statViews').textContent     = formatCount(views);

// Recent posts (up to 5)
const recent = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

if (recent.length === 0) {
  document.getElementById('recentPostsEmpty').innerHTML = `
    <div class="empty-state">
      <div class="icon-wrap">${icon('fileText', 24)}</div>
      <h3>No stories yet</h3>
      <p><a href="editor.html">Write your first story</a></p>
    </div>`;
} else {
  const table = document.getElementById('recentTable');
  table.style.display = '';
  document.getElementById('recentBody').innerHTML = recent.map(p => `
    <tr>
      <td class="table-post-title"><div><div class="t">${p.title}</div><div class="c">${p.readingTime} min read</div></div></td>
      <td><span class="status-pill ${p.status}">${p.status}</span></td>
      <td>${formatCount(p.views || 0)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td><a class="icon-btn" href="editor.html?id=${p.id}" title="Edit">${icon('edit', 15)}</a></td>
    </tr>`).join('');
}
