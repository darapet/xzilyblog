import { mountAdmin } from './admin-common.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('ads.html', 'Advertisements', 'Create and manage ads shown on the public site.');
if (session) await init();

// ── State ─────────────────────────────────────────────────────────────────────
let ads = [];
let editingId = null;
let pendingImageUrl = '';
let pendingVideoUrl = '';
let deleteTargetId  = null;

async function init() {
  await loadAds();
  wireNewButton();
  wireModal();
  wireDeleteModal();
}

// ── Load & Render ─────────────────────────────────────────────────────────────
async function loadAds() {
  try {
    ads = await store.getAds();
  } catch (e) {
    ads = [];
    toast('Could not load ads: ' + e.message);
  }
  renderAds();
}

function renderAds() {
  const list  = document.getElementById('adsList');
  const empty = document.getElementById('adsEmpty');
  const count = document.getElementById('adCount');

  count.textContent = ads.length ? `${ads.length} ad${ads.length === 1 ? '' : 's'}` : '';

  if (!ads.length) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = ads.map((ad) => `
    <div class="data-row" style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid #e8e2db;">
      <div style="width:72px;height:48px;flex-shrink:0;border-radius:6px;overflow:hidden;background:#f0ece6;display:flex;align-items:center;justify-content:center;">
        ${ad.imageUrl
          ? `<img src="${ad.imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
          : ad.videoUrl
            ? `<span style="font-size:20px;">🎬</span>`
            : `<span style="font-size:20px;color:#bbb;">📢</span>`}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(ad.title)}</div>
        <div style="font-size:12px;color:#888;margin-top:2px;">
          ${posLabel(ad.position)} · ${ad.isActive ? '<span style="color:#16a34a;font-weight:600;">Active</span>' : '<span style="color:#aaa;">Inactive</span>'}
          ${ad.videoUrl ? ' · has video' : ''}
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button class="btn btn-outline btn-sm" onclick="window.__editAd('${ad.id}')">Edit</button>
        <button class="btn btn-outline btn-sm" style="color:#b91c1c;border-color:#f5c6c6;" onclick="window.__deleteAd('${ad.id}')">Delete</button>
      </div>
    </div>`).join('');
}

function posLabel(p) {
  if (p === 'sidebar') return 'Sidebar';
  if (p === 'between-posts') return 'Between posts';
  return 'Sidebar + between posts';
}
function escHtml(s = '') {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── New button ────────────────────────────────────────────────────────────────
function wireNewButton() {
  document.getElementById('newAdBtn').addEventListener('click', () => openModal(null));
}

// ── Ad modal ──────────────────────────────────────────────────────────────────
function wireModal() {
  document.getElementById('modalCloseBtn').addEventListener('click',  closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('adModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('adModal')) closeModal();
  });

  // Image upload
  const imgZone  = document.getElementById('adImageZone');
  const imgInput = document.getElementById('fAdImage');
  imgZone.addEventListener('click', () => imgInput.click());
  imgInput.addEventListener('change', async () => {
    const file = imgInput.files[0];
    if (!file) return;
    setImgStatus('Uploading image…');
    try {
      pendingImageUrl = await store.uploadImage(file, 'ads');
      showImgPreview(pendingImageUrl);
      setImgStatus('Image ready');
    } catch (e) {
      setImgStatus('Upload failed: ' + e.message);
    }
  });

  // Video upload
  const vidZone  = document.getElementById('adVideoZone');
  const vidInput = document.getElementById('fAdVideo');
  vidZone.addEventListener('click', () => vidInput.click());
  vidInput.addEventListener('change', async () => {
    const file = vidInput.files[0];
    if (!file) return;

    // Client-side size check (50 MB)
    if (file.size > 52428800) {
      setVidStatus('❌ File too large — max 50 MB');
      vidInput.value = '';
      return;
    }

    // Client-side duration check via video element
    setVidStatus('Checking duration…');
    const ok = await checkVideoDuration(file, 30);
    if (!ok) {
      setVidStatus('❌ Video too long — max 30 seconds');
      vidInput.value = '';
      return;
    }

    setVidStatus('Uploading video…');
    try {
      pendingVideoUrl = await store.uploadAdVideo(file);
      showVidPreview(pendingVideoUrl);
      setVidStatus('Video ready');
    } catch (e) {
      setVidStatus('Upload failed: ' + e.message);
    }
  });

  document.getElementById('modalSaveBtn').addEventListener('click', saveAd);
}

function openModal(adId) {
  editingId       = adId;
  pendingImageUrl = '';
  pendingVideoUrl = '';

  const ad = adId ? ads.find((a) => a.id === adId) : null;

  document.getElementById('modalTitle').textContent      = ad ? 'Edit advertisement' : 'New advertisement';
  document.getElementById('fAdTitle').value              = ad?.title    || '';
  document.getElementById('fAdBody').value               = ad?.body     || '';
  document.getElementById('fAdLink').value               = ad?.linkUrl  || '';
  document.getElementById('fAdPosition').value           = ad?.position || 'both';
  document.getElementById('fAdActive').checked           = ad ? ad.isActive : true;
  document.getElementById('adModalError').style.display = 'none';

  // Image preview
  if (ad?.imageUrl) {
    pendingImageUrl = ad.imageUrl;
    showImgPreview(ad.imageUrl);
    setImgStatus('');
  } else {
    clearImgPreview();
    setImgStatus('');
  }

  // Video preview
  if (ad?.videoUrl) {
    pendingVideoUrl = ad.videoUrl;
    showVidPreview(ad.videoUrl);
    setVidStatus('');
  } else {
    clearVidPreview();
    setVidStatus('');
  }

  document.getElementById('adModal').style.display = '';
  document.getElementById('fAdTitle').focus();
}

function closeModal() {
  document.getElementById('adModal').style.display = 'none';
  editingId = null;
}

async function saveAd() {
  const title    = document.getElementById('fAdTitle').value.trim();
  const body     = document.getElementById('fAdBody').value.trim();
  const linkUrl  = document.getElementById('fAdLink').value.trim();
  const position = document.getElementById('fAdPosition').value;
  const isActive = document.getElementById('fAdActive').checked;

  if (!title) { showModalError('Title is required.'); return; }

  const btn = document.getElementById('modalSaveBtn');
  btn.disabled    = true;
  btn.textContent = 'Saving…';
  hideModalError();

  const payload = {
    title, body, linkUrl, position, isActive,
    imageUrl: pendingImageUrl,
    videoUrl: pendingVideoUrl,
  };

  try {
    if (editingId) {
      await store.updateAd(editingId, payload);
      toast('Ad updated');
    } else {
      await store.createAd(payload);
      toast('Ad created');
    }
    closeModal();
    await loadAds();
  } catch (e) {
    showModalError('Save failed: ' + (e.message || 'unknown error'));
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save ad';
  }
}

// ── Delete modal ──────────────────────────────────────────────────────────────
function wireDeleteModal() {
  document.getElementById('deleteCloseBtn').addEventListener('click',  closeDeleteModal);
  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  document.getElementById('deleteConfirmBtn').addEventListener('click', confirmDelete);
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('deleteConfirmBtn');
  btn.disabled    = true;
  btn.textContent = 'Deleting…';
  try {
    await store.deleteAd(deleteTargetId);
    toast('Ad deleted');
    closeDeleteModal();
    await loadAds();
  } catch (e) {
    toast('Delete failed: ' + e.message);
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Delete';
  }
}

// ── Global handlers (called from inline onclick) ──────────────────────────────
window.__editAd   = (id) => openModal(id);
window.__deleteAd = (id) => {
  deleteTargetId = id;
  document.getElementById('deleteModal').style.display = '';
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function showImgPreview(url) {
  document.getElementById('adImagePreview').src          = url;
  document.getElementById('adImagePreview').style.display = '';
  document.getElementById('adImagePlaceholder').style.display = 'none';
}
function clearImgPreview() {
  document.getElementById('adImagePreview').style.display     = 'none';
  document.getElementById('adImagePlaceholder').style.display = '';
}
function setImgStatus(msg) { document.getElementById('adImageStatus').textContent = msg; }

function showVidPreview(url) {
  const v = document.getElementById('adVideoPreview');
  v.src = url;
  v.style.display = '';
  document.getElementById('adVideoPlaceholder').style.display = 'none';
}
function clearVidPreview() {
  document.getElementById('adVideoPreview').style.display     = 'none';
  document.getElementById('adVideoPlaceholder').style.display = '';
}
function setVidStatus(msg) { document.getElementById('adVideoStatus').textContent = msg; }

function showModalError(msg) {
  const el = document.getElementById('adModalError');
  el.textContent    = msg;
  el.style.display  = '';
}
function hideModalError() {
  document.getElementById('adModalError').style.display = 'none';
}

function checkVideoDuration(file, maxSec) {
  return new Promise((resolve) => {
    const url  = URL.createObjectURL(file);
    const vid  = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(vid.duration <= maxSec); };
    vid.onerror          = () => { URL.revokeObjectURL(url); resolve(true); }; // if can't check, allow
    vid.src = url;
  });
}
