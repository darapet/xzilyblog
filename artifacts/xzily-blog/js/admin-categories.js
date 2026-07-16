import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('categories.html', 'Categories', 'Manage the topic categories shown across the site.');
if (session) await init();

let editingId = null;

async function init() {
  await render();
  document.getElementById('addCatBtn').addEventListener('click', () => openModal());
  document.getElementById('catModalCancel').addEventListener('click', closeModal);
  document.getElementById('catModalSave').addEventListener('click', save);
  document.getElementById('catModal').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  // Auto-slug from name
  document.getElementById('mCatName').addEventListener('input', () => {
    if (!editingId) {
      document.getElementById('mCatSlug').value = document.getElementById('mCatName').value
        .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  });
}

async function render() {
  const cats = await store.getCategories();
  document.getElementById('catTableBody').innerHTML = cats.map((c) => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td><code style="font-size:12px;color:var(--text-muted);">${c.slug}</code></td>
      <td style="font-size:13px;color:var(--text-muted);">${c.description || '—'}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-edit="${c.id}" title="Edit">${icon('edit', 15)}</button>
          <button class="icon-btn" data-delete="${c.id}" title="Delete">${icon('trash', 15)}</button>
        </div>
      </td>
    </tr>`).join('');

  document.getElementById('catEmpty').innerHTML = cats.length === 0
    ? `<div class="empty-state"><div class="icon-wrap">${icon('folder', 24)}</div><h3>No categories yet</h3><p>Add one above to get started.</p></div>`
    : '';

  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = cats.find((c) => c.id === btn.dataset.edit);
      if (cat) openModal(cat);
    });
  });
  document.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this category? Posts in it will lose their category label.')) return;
      await store.deleteCategory(btn.dataset.delete);
      toast('Category deleted');
      await render();
    });
  });
}

function openModal(cat = null) {
  editingId = cat ? cat.id : null;
  document.getElementById('catModalTitle').textContent = cat ? 'Edit category' : 'Add category';
  document.getElementById('mCatName').value = cat?.name || '';
  document.getElementById('mCatSlug').value = cat?.slug || '';
  document.getElementById('mCatDesc').value = cat?.description || '';
  document.getElementById('catModalError').style.display = 'none';
  document.getElementById('catModal').style.display = 'flex';
  document.getElementById('mCatName').focus();
}

function closeModal() {
  document.getElementById('catModal').style.display = 'none';
}

async function save() {
  const name = document.getElementById('mCatName').value.trim();
  const slug = document.getElementById('mCatSlug').value.trim();
  const description = document.getElementById('mCatDesc').value.trim();
  const errEl = document.getElementById('catModalError');
  if (!name) { errEl.textContent = 'Name is required.'; errEl.style.display = ''; return; }
  errEl.style.display = 'none';
  const btn = document.getElementById('catModalSave');
  btn.disabled = true;
  try {
    if (editingId) {
      await store.updateCategory(editingId, { name, slug, description });
      toast('Category updated');
    } else {
      await store.createCategory({ name, slug, description });
      toast('Category added');
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
