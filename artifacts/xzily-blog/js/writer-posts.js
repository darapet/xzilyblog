import { mountWriter } from './writer-common.js';
import { icon } from './icons.js';
import { formatDate, formatCount, toast } from './common.js';

import { store } from './store.js';

const session = await mountWriter('posts.html', 'My Stories', 'All the stories you have written.');
if (!session) throw new Error('not authenticated');

let currentStatus = 'all';
let allPosts = [];

await render();

document.querySelectorAll('#statusTabs button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('#statusTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentStatus = btn.dataset.status;
    renderTable();
  });
});

async function render() {
  allPosts = await store.getMyPosts();
  renderTable();
}

function renderTable() {
  const posts = currentStatus === 'all'
    ? allPosts
    : allPosts.filter(p => p.status === currentStatus);

  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const empty = document.getElementById('postsEmpty');
  const table = document.getElementById('postsTable');

  if (posts.length === 0) {
    table.style.display = 'none';
    empty.innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('fileText', 24)}</div>
        <h3>No stories here</h3>
        <p><a href="editor.html">Write one now</a></p>
      </div>`;
    return;
  }

  empty.innerHTML = '';
  table.style.display = '';

  document.getElementById('postsTableBody').innerHTML = posts.map(p => `
    <tr>
      <td class="table-post-title">
        <div><div class="t">${p.title}</div><div class="c">${p.readingTime} min read</div></div>
      </td>
      <td>—</td>
      <td><span class="status-pill ${p.status}">${p.status}</span></td>
      <td>${formatCount(p.views || 0)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>
        <div class="row-actions">
          <a class="icon-btn" href="editor.html?id=${p.id}" title="Edit">${icon('edit', 15)}</a>
          <a class="icon-btn" href="../article.html?slug=${p.slug}&preview=1" target="_blank" rel="noopener" title="Preview">${icon('eye', 15)}</a>
          <button class="icon-btn" data-toggle="${p.id}" title="Toggle publish">${icon(p.status === 'published' ? 'bellOff' : 'checkCircle', 15)}</button>
          <button class="icon-btn" data-delete="${p.id}" title="Delete">${icon('trash', 15)}</button>
        </div>
      </td>
    </tr>`).join('');

  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const p = allPosts.find(x => x.id === btn.dataset.toggle);
      if (!p) return;
      await store.updatePost(p.id, { status: p.status === 'published' ? 'draft' : 'published' });
      toast('Status updated');
      await render();
    });
  });

  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this story permanently?')) return;
      await store.deletePost(btn.dataset.delete);
      toast('Story deleted');
      await render();
    });
  });
}
