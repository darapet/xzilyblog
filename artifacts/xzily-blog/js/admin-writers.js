import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('writers.html', 'Writers', 'Manage writer accounts — suspend, restrict, or restore access.');
if (session) await init();

let targetProfileId = null;
let targetName = '';
let requirements = []; // array of { title, method }

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await render();

  // Suspend modal
  document.getElementById('addReqBtn').addEventListener('click', addRequirement);
  document.getElementById('suspendCancel').addEventListener('click', () => closeModal('suspendModal'));
  document.getElementById('suspendConfirm').addEventListener('click', confirmSuspend);
  document.getElementById('suspendModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('suspendModal');
  });

  // Restrict modal
  document.getElementById('restrictCancel').addEventListener('click', () => closeModal('restrictModal'));
  document.getElementById('restrictConfirm').addEventListener('click', confirmRestrict);
  document.getElementById('restrictModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal('restrictModal');
  });
}

// ── Render table ──────────────────────────────────────────────────────────────
async function render() {
  const writers = await store.getWriters();
  const tbody = document.getElementById('writerTableBody');

  if (!writers.length) {
    document.getElementById('writerEmpty').innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('usersIcon', 24)}</div>
        <h3>No writers yet</h3>
        <p>Writers appear here once they register via the writer registration page.</p>
      </div>`;
    tbody.innerHTML = '';
    return;
  }

  document.getElementById('writerEmpty').innerHTML = '';

  tbody.innerHTML = writers.map((w) => {
    const statusBadge = statusTag(w.status);
    const actions = actionsFor(w);
    const joined = w.created_at ? new Date(w.created_at).toLocaleDateString() : '—';
    return `
      <tr>
        <td class="table-post-title">
          <div>
            <div class="t">${w.name || '—'}</div>
          </div>
        </td>
        <td style="font-size:13px;color:var(--text-muted);">${w.email || '—'}</td>
        <td>${statusBadge}</td>
        <td style="font-size:13px;color:var(--text-muted);">${joined}</td>
        <td>
          <div class="row-actions">${actions}</div>
        </td>
      </tr>`;
  }).join('');

  // Wire up action buttons
  tbody.querySelectorAll('[data-suspend]').forEach((btn) =>
    btn.addEventListener('click', () => openSuspendModal(btn.dataset.suspend, btn.dataset.name)));
  tbody.querySelectorAll('[data-restrict]').forEach((btn) =>
    btn.addEventListener('click', () => openRestrictModal(btn.dataset.restrict, btn.dataset.name)));
  tbody.querySelectorAll('[data-restore]').forEach((btn) =>
    btn.addEventListener('click', () => doRestore(btn.dataset.restore, btn.dataset.name)));
}

function statusTag(status) {
  const map = {
    active:     ['#e6f5e6', '#2a6a2a', 'Active'],
    suspended:  ['#fff0f0', 'var(--primary)', 'Suspended'],
    restricted: ['#fff8e6', '#c07800', 'Restricted'],
  };
  const [bg, color, label] = map[status] || ['#f0f0f0', '#666', status];
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${label}</span>`;
}

function actionsFor(w) {
  const btns = [];
  if (w.status !== 'suspended') {
    btns.push(`<button class="icon-btn" data-suspend="${w.id}" data-name="${w.name}" title="Suspend">${icon('lock', 15)}</button>`);
  }
  if (w.status !== 'restricted') {
    btns.push(`<button class="icon-btn" data-restrict="${w.id}" data-name="${w.name}" title="Restrict" style="color:#c07800;">${icon('mapPin', 15)}</button>`);
  }
  if (w.status !== 'active') {
    btns.push(`<button class="icon-btn" data-restore="${w.id}" data-name="${w.name}" title="Restore" style="color:#2a6a2a;">${icon('checkCircle', 15)}</button>`);
  }
  return btns.join('');
}

// ── Suspend modal ─────────────────────────────────────────────────────────────
function openSuspendModal(profileId, name) {
  targetProfileId = profileId;
  targetName = name;
  requirements = [];
  document.getElementById('suspendModalTitle').textContent = `Suspend — ${name}`;
  document.getElementById('suspendReason').value = '';
  document.getElementById('reqList').innerHTML = '';
  document.getElementById('suspendError').style.display = 'none';
  document.getElementById('suspendModal').style.display = 'flex';
  document.getElementById('suspendReason').focus();
}

function addRequirement() {
  const idx = requirements.length;
  requirements.push({ title: '', method: 'text' });

  const div = document.createElement('div');
  div.className = 'req-item';
  div.dataset.idx = idx;
  div.style.cssText = 'display:flex;gap:10px;align-items:flex-end;margin-bottom:12px;background:#faf8f5;padding:12px;border-radius:10px;';
  div.innerHTML = `
    <div style="flex:1;">
      <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Field title</label>
      <input type="text" class="req-title" placeholder="e.g. Explanation letter" style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;" value="" />
    </div>
    <div style="width:160px;">
      <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Input type</label>
      <select class="req-method" style="width:100%;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;">
        <option value="text">Text</option>
        <option value="number">Number</option>
        <option value="date">Date picker</option>
        <option value="file">File upload</option>
        <option value="photo">Photo upload</option>
      </select>
    </div>
    <button class="icon-btn req-remove" title="Remove" style="color:var(--primary);flex-shrink:0;">${icon('trash', 15)}</button>`;

  div.querySelector('.req-title').addEventListener('input', (e) => {
    requirements[idx].title = e.target.value;
  });
  div.querySelector('.req-method').addEventListener('change', (e) => {
    requirements[idx].method = e.target.value;
  });
  div.querySelector('.req-remove').addEventListener('click', () => {
    div.remove();
    requirements.splice(idx, 1);
    // Re-index remaining items
    document.querySelectorAll('.req-item').forEach((el, i) => {
      el.dataset.idx = i;
    });
  });

  document.getElementById('reqList').appendChild(div);
}

async function confirmSuspend() {
  const reason = document.getElementById('suspendReason').value.trim();
  const errEl = document.getElementById('suspendError');
  if (!reason) { errEl.textContent = 'Please enter a reason for suspension.'; errEl.style.display = ''; return; }

  // Sync requirement titles from inputs
  document.querySelectorAll('.req-item').forEach((div, i) => {
    if (requirements[i]) {
      requirements[i].title = div.querySelector('.req-title').value.trim();
      requirements[i].method = div.querySelector('.req-method').value;
    }
  });
  const validReqs = requirements.filter((r) => r.title);

  const btn = document.getElementById('suspendConfirm');
  btn.disabled = true;
  errEl.style.display = 'none';
  try {
    await store.suspendWriter(targetProfileId, reason, validReqs);
    toast(`${targetName} has been suspended.`);
    closeModal('suspendModal');
    await render();
  } catch (err) {
    errEl.textContent = err.message || 'Could not suspend writer.';
    errEl.style.display = '';
  } finally {
    btn.disabled = false;
  }
}

// ── Restrict modal ────────────────────────────────────────────────────────────
function openRestrictModal(profileId, name) {
  targetProfileId = profileId;
  targetName = name;
  document.getElementById('restrictReason').value = '';
  document.getElementById('restrictError').style.display = 'none';
  document.getElementById('restrictModal').style.display = 'flex';
  document.getElementById('restrictReason').focus();
}

async function confirmRestrict() {
  const reason = document.getElementById('restrictReason').value.trim();
  const errEl = document.getElementById('restrictError');
  if (!reason) { errEl.textContent = 'Please enter a reason.'; errEl.style.display = ''; return; }
  const btn = document.getElementById('restrictConfirm');
  btn.disabled = true;
  try {
    await store.restrictWriter(targetProfileId, reason);
    toast(`${targetName} has been restricted.`);
    closeModal('restrictModal');
    await render();
  } catch (err) {
    errEl.textContent = err.message || 'Could not restrict writer.';
    errEl.style.display = '';
  } finally {
    btn.disabled = false;
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────
async function doRestore(profileId, name) {
  if (!confirm(`Restore ${name}'s account to active status?`)) return;
  try {
    await store.restoreWriter(profileId);
    toast(`${name} has been restored.`);
    await render();
  } catch (err) {
    alert(err.message || 'Could not restore writer.');
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
