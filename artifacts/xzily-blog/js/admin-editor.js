import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { qs, toast } from './common.js';
import { CATEGORIES, USERS } from './data.js';
import { store } from './store.js';
import { toAdminAsset } from './asset.js';

const session = await mountAdmin('editor.html', 'New Story', 'Write a lightweight rich-text story.');
if (session) await init();

const TOOLBAR = [
  ['bold', 'bold', 'Bold'],
  ['italic', 'italic', 'Italic'],
  ['underline', 'underline', 'Underline'],
  ['divider'],
  ['h2', 'code', 'Heading'],
  ['quote', 'quote', 'Quote'],
  ['divider'],
  ['insertUnorderedList', 'listBullets', 'Bulleted list'],
  ['insertOrderedList', 'listNumbers', 'Numbered list'],
  ['divider'],
  ['undo', 'undo', 'Undo'],
  ['redo', 'redo', 'Redo'],
];

async function init() {
  const editId = qs('id');
  const existing = editId ? await store.getPostById(editId) : null;

  document.getElementById('editorToolbar').innerHTML = TOOLBAR.map((t) =>
    t[0] === 'divider' ? '<div class="divider"></div>' : `<button type="button" data-cmd="${t[0]}" title="${t[2]}">${icon(t[1], 16)}</button>`
  ).join('');

  document.getElementById('fCategory').innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('fAuthor').innerHTML = USERS.map((u) => `<option value="${u.id}">${u.name}</option>`).join('');

  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('fBody').focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'h2') {
        document.execCommand('formatBlock', false, 'H2');
      } else if (cmd === 'quote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      } else {
        document.execCommand(cmd, false, null);
      }
    });
  });

  if (existing) {
    document.getElementById('adminTitle').textContent = 'Edit Story';
    document.getElementById('fTitle').value = existing.title;
    document.getElementById('fExcerpt').value = existing.excerpt;
    document.getElementById('fBody').innerHTML = existing.content;
    document.getElementById('fCover').value = existing.coverImage;
    document.getElementById('coverPreview').src = toAdminAsset(existing.coverImage);
    document.getElementById('fCategory').value = existing.categoryId;
    document.getElementById('fTags').value = existing.tags.join(', ');
    document.getElementById('fAuthor').value = existing.authorId;
  }

  document.getElementById('fCover').addEventListener('input', (e) => {
    if (e.target.value) document.getElementById('coverPreview').src = e.target.value;
  });

  document.getElementById('saveDraftBtn').addEventListener('click', () => save('draft', existing));
  document.getElementById('publishBtn').addEventListener('click', () => save('published', existing));

  let autosaveTimer = null;
  document.getElementById('fBody').addEventListener('input', () => {
    const note = document.getElementById('autosaveNote');
    note.innerHTML = `${icon('save', 13)} Draft changes not yet saved — click "Save draft" to persist.`;
    clearTimeout(autosaveTimer);
  });
}

async function save(status, existing) {
  const title = document.getElementById('fTitle').value.trim();
  const excerpt = document.getElementById('fExcerpt').value.trim();
  const content = document.getElementById('fBody').innerHTML.trim();
  const coverImage = document.getElementById('fCover').value.trim() || 'images/cover-1.jpg';
  const categoryId = document.getElementById('fCategory').value;
  const tags = document.getElementById('fTags').value.split(',').map((t) => t.trim()).filter(Boolean);
  const authorId = document.getElementById('fAuthor').value;

  if (!title) {
    toast('Give your story a title first');
    return;
  }

  try {
    if (existing) {
      await store.updatePost(existing.id, { title, excerpt, content, coverImage, categoryId, tags, authorId, status });
    } else {
      await store.createPost({ title, excerpt, content, coverImage, categoryId, tags, authorId, status });
    }
    toast(status === 'published' ? 'Story published' : 'Draft saved');
    setTimeout(() => (window.location.href = 'posts.html'), 500);
  } catch (err) {
    toast('Could not save story');
  }
}
