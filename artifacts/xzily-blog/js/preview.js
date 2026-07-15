// Renders an unsaved draft from the editor exactly like a real article page,
// without touching the database (no view count, no comments/likes yet since
// the post may not even be saved). Data comes from sessionStorage, written
// by admin-editor.js right before it opens this tab.
import { mountLayout, formatDate, escapeHtml, getCatColor } from './common.js';
import { icon } from './icons.js';
import { userById, categoryById } from './data.js';

await mountLayout('preview.html');

const raw = sessionStorage.getItem('xzily_preview_draft');
const draft = raw ? JSON.parse(raw) : null;

renderBanner();

if (!draft) {
  document.getElementById('articleRoot').innerHTML = `
    <div class="empty-state">
      <div class="icon-wrap">${icon('alertTriangle', 26)}</div>
      <h3>Nothing to preview</h3>
      <p>Open the story editor and click "Preview" to see your story here.</p>
    </div>`;
  document.getElementById('articleSidebar').innerHTML = '';
} else {
  render(draft);
}

function renderBanner() {
  document.getElementById('previewBanner').outerHTML = `
    <div class="preview-banner" id="previewBanner">
      <span>${icon('eye', 15)} You're previewing this story as an admin — it hasn't been saved this way yet.</span>
      <button class="btn btn-outline btn-sm" id="closePreviewBtn">${icon('close', 14)} Close preview</button>
    </div>`;
  document.getElementById('closePreviewBtn').addEventListener('click', () => window.close());
}

function render(p) {
  const author = userById(p.authorId) || { name: 'Staff Writer', avatar: 'images/avatar-1.jpg', bio: '' };
  const cat = categoryById(p.categoryId);
  document.title = `${p.title || 'Untitled story'} — Preview`;

  document.getElementById('articleRoot').innerHTML = `
    <div class="article-header">
      <div class="breadcrumb">
        <span>PREVIEW</span> ${icon('chevronRight', 12)}
        <span style="color:${getCatColor(cat ? cat.slug : '')};">${cat ? cat.name : 'Uncategorized'}</span>
      </div>
      <h1>${escapeHtml(p.title || 'Untitled story')}</h1>
      <p class="article-subtitle">${escapeHtml(p.excerpt || '')}</p>

      <div class="article-meta-bar">
        <div class="author-info">
          <img src="${author.avatar}" alt="${escapeHtml(author.name)}" />
          <div>
            <div class="author-name">${escapeHtml(author.name)}</div>
            <div class="publish-date">${formatDate(new Date().toISOString())} &middot; ${p.readingTime || 1} MIN READ</div>
          </div>
        </div>
      </div>
    </div>

    <img class="article-cover" src="${p.coverImage || 'images/cover-1.jpg'}" alt="${escapeHtml(p.title || '')}" />

    <div class="article-body">
      ${p.content || '<p style="color:var(--text-muted);">Nothing written yet.</p>'}
    </div>

    <div class="article-tags">
      ${(p.tags || []).map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
    </div>
  `;

  document.getElementById('articleSidebar').innerHTML = `
    <div class="widget">
      <h3 class="widget-title">Preview mode</h3>
      <p style="font-size:13px;color:var(--text-muted);">Comments, likes, and related stories are hidden while previewing an unsaved draft. Save or publish the story to see it live.</p>
    </div>`;
}
