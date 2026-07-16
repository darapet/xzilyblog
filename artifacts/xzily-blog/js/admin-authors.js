import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('authors.html', 'Authors', 'Manage the editorial team shown on article pages and the About page.');
if (session) await init();

let editingId = null;
let pendingPhotoFile = null;

async function init() {
  await render();
  document.getElementById('addAuthorBtn').addEventListener('click', () => openModal());
  document.getElementById('authorModalCancel').addEventListener('click', closeModal);
  document.getElementById('authorModalSave').addEventListener('click', save);
  document.getElementById('authorModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  // Photo upload zone
  const zone = document.getElementById('authorPhotoZone');
  const fileInput = document.getElementById('authorPhotoInput');
  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
  zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('drag'); if (e.dataTransfer.files[0]) handlePhotoFile(e.dataTransfer.files[0]); });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handlePhotoFile(fileInput.files[0]); });
}

function handlePhotoFile(file) {
  pendingPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('authorPhotoPreview').src = e.target.result;
    document.getElementById('authorPhotoPreview').style.display = '';
    document.getElementById('authorPhotoHint').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

async function render() {
  const authors = await store.getAuthors();
  document.getElementById('authorTableBody').innerHTML = authors.map((a) => `
    <tr>
      <td class="table-post-title">
        <img src="${a.avatarUrl || a.avatar || 'images/avatar-1.jpg'}" alt="${a.name}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />
        <div><div class="t">${a.name}</div></div>
      </td>
      <td style="font-size:13px;">${a.role || '—'}</td>
      <td style="font-size:13px;color:var(--text-muted);">${a.email || '—'}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-edit="${a.id}" title="Edit">${icon('edit', 15)}</button>
          <button class="icon-btn" data-delete="${a.id}" title="Delete">${icon('trash', 15)}</button>
        </div>
      </td>
    </tr>`).join('');

  document.getElementById('authorEmpty').innerHTML = authors.length === 0
    ? `<div class="empty-state"><div class="icon-wrap">${icon('user', 24)}</div><h3>No authors yet</h3><p>Add the editorial team above.</p></div>`
    : '';

  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const author = authors.find((a) => a.id === btn.dataset.edit);
      if (author) openModal(author);
    });
  });
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this author? Posts assigned to them will keep the author ID but the name may no longer resolve.')) return;
      await store.deleteAuthor(btn.dataset.delete);
      toast('Author deleted');
      await render();
    });
  });
}

function openModal(author = null) {
  editingId = author ? author.id : null;
  pendingPhotoFile = null;
  document.getElementById('authorModalTitle').textContent = author ? 'Edit author' : 'Add author';
  document.getElementById('mAName').value  = author?.name  || '';
  document.getElementById('mARole').value  = author?.role  || '';
  document.getElementById('mAEmail').value = author?.email || '';
  document.getElementById('mABio').value   = author?.bio   || '';
  const preview = document.getElementById('authorPhotoPreview');
  const hint = document.getElementById('authorPhotoHint');
  if (author?.avatarUrl || author?.avatar) {
    preview.src = author.avatarUrl || author.avatar;
    preview.style.display = '';
    hint.style.display = 'none';
  } else {
    preview.src = '';
    preview.style.display = 'none';
    hint.style.display = '';
  }
  document.getElementById('authorModalError').style.display = 'none';
  document.getElementById('authorModal').style.display = 'flex';
  document.getElementById('mAName').focus();
}

function closeModal() {
  document.getElementById('authorModal').style.display = 'none';
}

async function save() {
  const name  = document.getElementById('mAName').value.trim();
  const role  = document.getElementById('mARole').value.trim();
  const email = document.getElementById('mAEmail').value.trim();
  const bio   = document.getElementById('mABio').value.trim();
  const errEl = document.getElementById('authorModalError');
  if (!name) { errEl.textContent = 'Name is required.'; errEl.style.display = ''; return; }
  errEl.style.display = 'none';
  const btn = document.getElementById('authorModalSave');
  btn.disabled = true;
  try {
    let avatarUrl = editingId ? (store._authorsCache?.find((a) => a.id === editingId)?.avatarUrl || '') : '';
    if (pendingPhotoFile) {
      avatarUrl = await store.uploadImage(pendingPhotoFile, 'avatars');
    }
    if (editingId) {
      await store.updateAuthor(editingId, { name, role, email, bio, avatarUrl });
      toast('Author updated');
    } else {
      await store.createAuthor({ name, role, email, bio, avatarUrl });
      toast('Author added');
    }
    closeModal();
    await render();
  } catch (err) {
    errEl.textContent = err.message || 'Could not save.';
    errEl.style.display = '';
  } finally {
    btn.disabled = false;
  }
}
