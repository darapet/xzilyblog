import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { formatDate, escapeHtml, toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('comments.html', 'Comments', 'Moderate reader comments across all stories.');
if (session) await render();

async function render() {
  const comments = (await store.allComments()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const rows = await Promise.all(comments.map(async (c) => {
    const post = await store.getPostById(c.postId);
    return `
    <tr>
      <td>${escapeHtml(c.authorName || 'Guest Reader')}</td>
      <td style="max-width:340px;">${escapeHtml(c.content)}</td>
      <td>${post ? post.title : '—'}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><button class="icon-btn" data-delete="${c.id}" title="Delete">${icon('trash', 15)}</button></td>
    </tr>`;
  }));
  document.getElementById('commentsTableBody').innerHTML = rows.join('');

  document.getElementById('commentsEmpty').innerHTML = comments.length === 0
    ? `<div class="empty-state"><div class="icon-wrap">${icon('messageCircle', 24)}</div><h3>No comments yet</h3></div>`
    : '';

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await store.deleteComment(btn.dataset.delete);
      toast('Comment removed');
      await render();
    });
  });
}
