import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { formatDate, formatCount, toast } from './common.js';
import { categoryById } from './data.js';
import { store } from './store.js';
import { toAdminAsset } from './asset.js';

const session = await mountAdmin('posts.html', 'Manage Posts', 'Edit, publish, or delete stories.');
let currentStatus = 'all';

if (session) {
  await render();
  document.querySelectorAll('#statusTabs button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('#statusTabs button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.dataset.status;
      await render();
    });
  });
}

async function render() {
  const posts = (await store.getPosts({ status: currentStatus })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('postsTableBody').innerHTML = posts.map((p) => {
    const cat = categoryById(p.categoryId);
    return `
    <tr>
      <td class="table-post-title">
        <img src="${toAdminAsset(p.coverImage)}" alt="" />
        <div><div class="t">${p.title}</div><div class="c">${p.readingTime} min read</div></div>
      </td>
      <td>${cat ? cat.name : '—'}</td>
      <td><span class="status-pill ${p.status}">${p.status}</span></td>
      <td>${formatCount(p.views)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>
        <div class="row-actions">
          <a class="icon-btn" href="editor.html?id=${p.id}" title="Edit">${icon('edit', 15)}</a>
          <button class="icon-btn" data-toggle="${p.id}" title="Toggle publish">${icon(p.status === 'published' ? 'bellOff' : 'checkCircle', 15)}</button>
          <button class="icon-btn" data-delete="${p.id}" title="Delete">${icon('trash', 15)}</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('postsEmpty').innerHTML = posts.length === 0 ? `
    <div class="empty-state">
      <div class="icon-wrap">${icon('fileText', 24)}</div>
      <h3>No stories here yet</h3>
      <p><a href="editor.html">Write your first story</a></p>
    </div>` : '';

  document.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const p = await store.getPostById(btn.dataset.toggle);
      await store.updatePost(p.id, { status: p.status === 'published' ? 'draft' : 'published' });
      toast('Status updated');
      await render();
    });
  });
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this story permanently?')) return;
      await store.deletePost(btn.dataset.delete);
      toast('Story deleted');
      await render();
    });
  });
}
