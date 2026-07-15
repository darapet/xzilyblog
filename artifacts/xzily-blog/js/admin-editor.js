import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { qs, toast } from './common.js';
import { CATEGORIES, USERS } from './data.js';
import { store } from './store.js';
import { toAdminAsset } from './asset.js';

const session = await mountAdmin('editor.html', 'New Story', 'Write a rich-text story.');
if (session) await init();

const TOOLBAR = [
  ['bold', 'bold', 'Bold'],
  ['italic', 'italic', 'Italic'],
  ['underline', 'underline', 'Underline'],
  ['divider'],
  ['blockFormat'],
  ['fontSize'],
  ['divider'],
  ['insertUnorderedList', 'listBullets', 'Bulleted list'],
  ['insertOrderedList', 'listNumbers', 'Numbered list'],
  ['divider'],
  ['link', 'link', 'Insert link'],
  ['image', 'image', 'Insert image'],
  ['divider'],
  ['undo', 'undo', 'Undo'],
  ['redo', 'redo', 'Redo'],
];

const BLOCK_FORMATS = [
  ['P', 'Paragraph'],
  ['H2', 'Heading'],
  ['H3', 'Subheading'],
  ['BLOCKQUOTE', 'Quote'],
];

const FONT_SIZES = [
  ['2', 'Small'],
  ['3', 'Normal'],
  ['5', 'Large'],
  ['7', 'Huge'],
];

let coverImageUrl = '';

async function init() {
  const editId = qs('id');
  const existing = editId ? await store.getPostById(editId) : null;

  renderToolbar();

  document.getElementById('fCategory').innerHTML = CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('fAuthor').innerHTML = USERS.map((u) => `<option value="${u.id}">${u.name}</option>`).join('');

  wireToolbar();
  wireCoverUpload();
  const hintIcon = document.querySelector('#coverEmptyHint .icon-wrap');
  if (hintIcon) hintIcon.innerHTML = icon('image', 22);

  if (existing) {
    document.getElementById('adminTitle').textContent = 'Edit Story';
    document.getElementById('fTitle').value = existing.title;
    document.getElementById('fExcerpt').value = existing.excerpt;
    document.getElementById('fBody').innerHTML = existing.content;
    coverImageUrl = existing.coverImage;
    setCoverPreview(coverImageUrl);
    document.getElementById('fCategory').value = existing.categoryId;
    document.getElementById('fTags').value = existing.tags.join(', ');
    document.getElementById('fAuthor').value = existing.authorId;
  }

  document.getElementById('saveDraftBtn').addEventListener('click', () => save('draft', existing));
  document.getElementById('publishBtn').addEventListener('click', () => save('published', existing));

  document.getElementById('fBody').addEventListener('input', () => {
    const note = document.getElementById('autosaveNote');
    note.innerHTML = `${icon('save', 13)} Draft changes not yet saved — click "Save draft" to persist.`;
  });
}

function renderToolbar() {
  const html = TOOLBAR.map((t) => {
    if (t[0] === 'divider') return '<div class="divider"></div>';
    if (t[0] === 'blockFormat') {
      return `<select id="fmtBlock" title="Text style">${BLOCK_FORMATS.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`;
    }
    if (t[0] === 'fontSize') {
      return `<select id="fmtSize" title="Font size">${FONT_SIZES.map(([v, l]) => `<option value="${v}" ${v === '3' ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    }
    return `<button type="button" data-cmd="${t[0]}" title="${t[2]}">${icon(t[1], 16)}</button>`;
  }).join('');
  document.getElementById('editorToolbar').innerHTML = html;
}

function wireToolbar() {
  const body = document.getElementById('fBody');

  document.querySelectorAll('[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      body.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'link') {
        const url = window.prompt('Link URL (https://...)');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd === 'image') {
        await insertImageAtCursor();
      } else {
        document.execCommand(cmd, false, null);
      }
    });
  });

  document.getElementById('fmtBlock').addEventListener('change', (e) => {
    body.focus();
    document.execCommand('formatBlock', false, e.target.value);
  });
  document.getElementById('fmtSize').addEventListener('change', (e) => {
    body.focus();
    document.execCommand('fontSize', false, e.target.value);
  });
}

async function insertImageAtCursor() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    toast('Uploading image…');
    try {
      const url = await store.uploadImage(file, 'body');
      document.execCommand('insertImage', false, url);
      toast('Image inserted');
    } catch (err) {
      toast('Could not upload image');
    }
  };
  input.click();
}

function wireCoverUpload() {
  const zone = document.getElementById('coverUploadZone');
  const input = document.getElementById('coverFileInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('drag');
    const file = e.dataTransfer.files[0];
    if (file) await handleCoverFile(file);
  });
  input.addEventListener('change', async () => {
    const file = input.files[0];
    if (file) await handleCoverFile(file);
  });
}

async function handleCoverFile(file) {
  toast('Uploading cover image…');
  try {
    coverImageUrl = await store.uploadImage(file, 'covers');
    setCoverPreview(coverImageUrl);
    toast('Cover image uploaded');
  } catch (err) {
    toast('Could not upload cover image');
  }
}

function setCoverPreview(url) {
  const img = document.getElementById('coverPreview');
  const empty = document.getElementById('coverEmptyHint');
  if (url) {
    img.src = toAdminAsset(url);
    img.style.display = '';
    if (empty) empty.style.display = 'none';
  } else {
    img.style.display = 'none';
    if (empty) empty.style.display = '';
  }
}

async function save(status, existing) {
  const title = document.getElementById('fTitle').value.trim();
  const excerpt = document.getElementById('fExcerpt').value.trim();
  const content = document.getElementById('fBody').innerHTML.trim();
  const coverImage = coverImageUrl || 'images/cover-1.jpg';
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
