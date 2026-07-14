import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { formatDate, escapeHtml, toast } from './common.js';
import { store } from './store.js';

const session = mountAdmin('/admin/comments.html', 'Comments', 'Moderate reader comments across all stories.');
if (session) render();

function render() {
  const comments = store.allComments().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  document.getElementById('commentsTableBody').innerHTML = comments.map((c) => {
    const author = store.userById(c.authorId) || { name: c.authorName || 'Guest Reader' };
    const post = store.getPostById(c.postId);
    return `
    <tr>
      <td>${escapeHtml(author.name)}</td>
      <td style="max-width:340px;">${escapeHtml(c.content)}</td>
      <td>${post ? post.title : '—'}</td>
      <td>${formatDate(c.createdAt)}</td>
      <td><button class="icon-btn" data-delete="${c.id}" title="Delete">${icon('trash', 15)}</button></td>
    </tr>`;
  }).join('');

  document.getElementById('commentsEmpty').innerHTML = comments.length === 0
    ? `<div class="empty-state"><div class="icon-wrap">${icon('messageCircle', 24)}</div><h3>No comments yet</h3></div>`
    : '';

  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.deleteComment(btn.dataset.delete);
      toast('Comment removed');
      render();
    });
  });
}
