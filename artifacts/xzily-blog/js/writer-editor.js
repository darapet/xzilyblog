import { mountWriter } from './writer-common.js';
import { icon } from './icons.js';
import { qs, toast } from './common.js';
import { store } from './store.js';
import { toAdminAsset } from './asset.js';

const TOOLBAR = [
  ['blockFormat'], ['fontSize'], ['divider'],
  ['bold','bold','Bold'], ['italic','italic','Italic'],
  ['underline','underline','Underline'], ['strikeThrough','strikethrough','Strikethrough'],
  ['divider'], ['textColor'], ['highlightColor'], ['divider'],
  ['justifyLeft','alignLeft','Align left'], ['justifyCenter','alignCenter','Align center'],
  ['justifyRight','alignRight','Align right'], ['divider'],
  ['insertUnorderedList','listBullets','Bulleted list'],
  ['insertOrderedList','listNumbers','Numbered list'], ['divider'],
  ['link','link','Insert link'], ['image','image','Insert image'], ['divider'],
  ['undo','undo','Undo'], ['redo','redo','Redo'],
];
const BLOCK_FORMATS = [['P','Paragraph'],['H2','Heading'],['H3','Subheading'],['BLOCKQUOTE','Quote']];
const FONT_SIZES    = [['2','Small'],['3','Normal'],['5','Large'],['7','Huge']];

let coverImageUrl = '';

const session = await mountWriter('editor.html', 'New Story', 'Write a rich-text story.');
if (!session) throw new Error('not authenticated');

await init();

async function init() {
  const editId   = qs('id');
  const existing = editId ? await store.getPostById(editId) : null;

  // Guard: writers can only edit their own posts
  if (existing && session.writerAuthorId && existing.authorId !== session.writerAuthorId) {
    toast('You can only edit your own stories.');
    setTimeout(() => window.location.href = 'posts.html', 1200);
    return;
  }

  const CATEGORIES = await store.getCategories();

  renderToolbar();
  wireToolbar();
  wireCoverUpload();

  const hintIcon = document.querySelector('#coverEmptyHint .icon-wrap');
  if (hintIcon) hintIcon.innerHTML = icon('image', 22);

  document.getElementById('fCategory').innerHTML =
    CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  // Show writer's author name (read-only)
  const authorDisplay = document.getElementById('fAuthorDisplay');
  if (authorDisplay) authorDisplay.textContent = session.name;

  if (existing) {
    document.getElementById('writerTitle').textContent = 'Edit Story';
    document.getElementById('fTitle').value   = existing.title;
    document.getElementById('fExcerpt').value = existing.excerpt;
    document.getElementById('fBody').innerHTML = existing.content;
    coverImageUrl = existing.coverImage;
    setCoverPreview(coverImageUrl);
    document.getElementById('fCategory').value = existing.categoryId;
    document.getElementById('fTags').value     = existing.tags.join(', ');
  }

  document.getElementById('previewBtn').addEventListener('click', () => openPreview(existing));
  document.getElementById('saveDraftBtn').addEventListener('click', () => save('draft', existing));
  document.getElementById('publishBtn').addEventListener('click', () => save('published', existing));
  document.getElementById('aiWriteBtn').addEventListener('click', openAiWriteModal);

  document.getElementById('fBody').addEventListener('input', () => {
    document.getElementById('autosaveNote').innerHTML =
      `${icon('save', 13)} Draft changes not yet saved — click "Save draft" to persist.`;
  });
}

function renderToolbar() {
  document.getElementById('editorToolbar').innerHTML = TOOLBAR.map(t => {
    if (t[0] === 'divider')       return '<div class="divider"></div>';
    if (t[0] === 'blockFormat')   return `<select id="fmtBlock" title="Text style">${BLOCK_FORMATS.map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select>`;
    if (t[0] === 'fontSize')      return `<select id="fmtSize" title="Font size">${FONT_SIZES.map(([v,l]) => `<option value="${v}" ${v==='3'?'selected':''}>${l}</option>`).join('')}</select>`;
    if (t[0] === 'textColor')     return `<label class="color-swatch-btn" title="Text color">${icon('palette',16)}<input type="color" id="fmtTextColor" value="#111111"/></label>`;
    if (t[0] === 'highlightColor') return `<label class="color-swatch-btn" title="Highlight">${icon('highlighter',16)}<input type="color" id="fmtHighlight" value="#fff59d"/></label>`;
    return `<button type="button" data-cmd="${t[0]}" title="${t[2]}">${icon(t[1], 16)}</button>`;
  }).join('');
}

function wireToolbar() {
  const body = document.getElementById('fBody');
  document.querySelectorAll('[data-cmd]').forEach(btn => {
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
  document.getElementById('fmtBlock').addEventListener('change', e => { body.focus(); document.execCommand('formatBlock', false, e.target.value); });
  document.getElementById('fmtSize').addEventListener('change',  e => { body.focus(); document.execCommand('fontSize',    false, e.target.value); });
  document.getElementById('fmtTextColor').addEventListener('input', e => { body.focus(); document.execCommand('foreColor',  false, e.target.value); });
  document.getElementById('fmtHighlight').addEventListener('input',  e => { body.focus(); document.execCommand('hiliteColor', false, e.target.value); });
}

async function insertImageAtCursor() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    toast('Uploading image…');
    try { document.execCommand('insertImage', false, await store.uploadImage(file, 'body')); toast('Image inserted'); }
    catch { toast('Could not upload image'); }
  };
  input.click();
}

function wireCoverUpload() {
  const zone  = document.getElementById('coverUploadZone');
  const input = document.getElementById('coverFileInput');
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', async e => { e.preventDefault(); zone.classList.remove('drag'); const f = e.dataTransfer.files[0]; if (f) await handleCoverFile(f); });
  input.addEventListener('change', async () => { const f = input.files[0]; if (f) await handleCoverFile(f); });
}

async function handleCoverFile(file) {
  toast('Uploading cover image…');
  try { coverImageUrl = await store.uploadImage(file, 'covers'); setCoverPreview(coverImageUrl); toast('Cover uploaded'); }
  catch { toast('Could not upload cover image'); }
}

function setCoverPreview(url) {
  const img   = document.getElementById('coverPreview');
  const empty = document.getElementById('coverEmptyHint');
  if (url) { img.src = toAdminAsset(url); img.style.display = ''; if (empty) empty.style.display = 'none'; }
  else      { img.style.display = 'none'; if (empty) empty.style.display = ''; }
}

function openPreview(existing) {
  const draft = {
    title:       document.getElementById('fTitle').value.trim(),
    excerpt:     document.getElementById('fExcerpt').value.trim(),
    content:     document.getElementById('fBody').innerHTML.trim(),
    coverImage:  coverImageUrl || (existing?.coverImage) || 'images/cover-1.jpg',
    categoryId:  document.getElementById('fCategory').value,
    tags:        document.getElementById('fTags').value.split(',').map(t => t.trim()).filter(Boolean),
    authorId:    session.writerAuthorId || '',
    readingTime: Math.max(1, Math.round(document.getElementById('fBody').innerText.trim().split(/\s+/).length / 200)),
  };
  sessionStorage.setItem('xzily_preview_draft', JSON.stringify(draft));
  window.open('../preview.html', '_blank');
}

function openAiWriteModal() {
  const overlay = document.createElement('div');
  overlay.className = 'ai-write-modal';
  overlay.innerHTML = `
    <div class="ai-write-card">
      <h3>${icon('sparkle', 18)} AI Write</h3>
      <p>Describe what the story should be about. This replaces the title, excerpt, and body with a generated draft.</p>
      <textarea id="aiTopicInput" placeholder="e.g. Why remote teams still struggle with async communication"></textarea>
      <div class="error" id="aiWriteError" style="display:none;"></div>
      <div class="ai-write-actions">
        <button class="btn btn-outline" id="aiWriteCancel">Cancel</button>
        <button class="btn btn-primary" id="aiWriteGenerate">Generate</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('aiTopicInput').focus();
  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('aiWriteCancel').addEventListener('click', close);
  document.getElementById('aiWriteGenerate').addEventListener('click', async () => {
    const topic  = document.getElementById('aiTopicInput').value.trim();
    const errEl  = document.getElementById('aiWriteError');
    const genBtn = document.getElementById('aiWriteGenerate');
    errEl.style.display = 'none';
    if (!topic) { errEl.textContent = 'Describe a topic first.'; errEl.style.display = ''; return; }
    genBtn.disabled = true; genBtn.textContent = 'Writing…';
    try {
      const draft = await store.aiWrite(topic);
      document.getElementById('fTitle').value    = draft.title;
      document.getElementById('fExcerpt').value  = draft.excerpt;
      document.getElementById('fBody').innerHTML = draft.bodyHtml;
      document.getElementById('autosaveNote').innerHTML = `${icon('save',13)} Draft not yet saved — click "Save draft".`;
      toast('AI draft ready — review before publishing'); close();
    } catch (err) {
      errEl.textContent = err?.message || 'Could not generate a draft.';
      errEl.style.cssText = 'display:block;color:#c62828;font-size:12.5px;margin-top:10px;';
      toast(err?.message || 'AI Write failed');
      genBtn.disabled = false; genBtn.textContent = 'Generate';
    }
  });
}

async function save(status, existing) {
  const title      = document.getElementById('fTitle').value.trim();
  const excerpt    = document.getElementById('fExcerpt').value.trim();
  const content    = document.getElementById('fBody').innerHTML.trim();
  const coverImage = coverImageUrl || 'images/cover-1.jpg';
  const categoryId = document.getElementById('fCategory').value;
  const tags       = document.getElementById('fTags').value.split(',').map(t => t.trim()).filter(Boolean);
  const authorId   = session.writerAuthorId || '';

  if (!title) { toast('Give your story a title first'); return; }
  if (!authorId) { toast('Your author profile is not set up yet — contact your editor.'); return; }

  try {
    if (existing) {
      await store.updatePost(existing.id, { title, excerpt, content, coverImage, categoryId, tags, authorId, status });
    } else {
      await store.createPost({ title, excerpt, content, coverImage, categoryId, tags, authorId, status });
    }
    toast(status === 'published' ? 'Story published!' : 'Draft saved');
    setTimeout(() => window.location.href = 'posts.html', 500);
  } catch (err) {
    toast('Could not save story — ' + (err.message || 'unknown error'));
  }
}
