import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('writer-reviews.html', 'Writer Reviews', 'Review suspension appeal requests from writers.');
if (session) await init();

let reviews = [];
let activeReview = null;

async function init() {
  await render();
  document.getElementById('reviewModalClose').addEventListener('click', closeModal);
  document.getElementById('reviewModalApprove').addEventListener('click', doApprove);
  document.getElementById('reviewModalReject').addEventListener('click', doReject);
  document.getElementById('reviewModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

async function render() {
  reviews = await store.getReviewRequests();
  const container = document.getElementById('reviewList');
  const empty = document.getElementById('reviewEmpty');

  if (!reviews.length) {
    empty.innerHTML = `
      <div class="empty-state">
        <div class="icon-wrap">${icon('checkCircle', 24)}</div>
        <h3>No review requests</h3>
        <p>When a suspended writer submits a review request it will appear here.</p>
      </div>`;
    container.innerHTML = '';
    return;
  }

  empty.innerHTML = '';
  container.innerHTML = reviews.map((r) => {
    const profile = r.suspension_cases?.profiles;
    const name = profile?.name || 'Unknown writer';
    const email = profile?.email || '';
    const submitted = new Date(r.submitted_at).toLocaleDateString();
    const statusBadge = statusTag(r.status);
    return `
      <div class="admin-panel" style="margin-bottom:14px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div>
          <div style="font-weight:700;font-size:15px;">${name}</div>
          <div style="font-size:13px;color:var(--text-muted);">${email} &nbsp;·&nbsp; Submitted ${submitted}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          ${statusBadge}
          ${r.status === 'pending'
            ? `<button class="btn btn-outline" data-review="${r.id}" style="font-size:13px;">View details</button>`
            : `<button class="btn btn-outline" data-review="${r.id}" style="font-size:13px;opacity:.7;">View</button>`
          }
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('[data-review]').forEach((btn) => {
    btn.addEventListener('click', () => openReview(btn.dataset.review));
  });
}

function statusTag(status) {
  const map = {
    pending:  ['#fff8e6', '#c07800', 'Pending'],
    approved: ['#e6f5e6', '#2a6a2a', 'Approved'],
    rejected: ['#fff0f0', 'var(--primary)', 'Rejected'],
  };
  const [bg, color, label] = map[status] || ['#f0f0f0', '#666', status];
  return `<span style="background:${bg};color:${color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${label}</span>`;
}

function openReview(reviewId) {
  activeReview = reviews.find((r) => r.id === reviewId);
  if (!activeReview) return;

  const profile = activeReview.suspension_cases?.profiles;
  const name = profile?.name || 'Unknown';
  const email = profile?.email || '';
  const sc = activeReview.suspension_cases;
  const submitted = new Date(activeReview.submitted_at).toLocaleString();

  document.getElementById('reviewModalTitle').textContent = `Review — ${name}`;
  document.getElementById('reviewModalMeta').innerHTML = `
    ${email} &nbsp;·&nbsp; Submitted: ${submitted}`;

  // Build body: suspension reason + requirements + responses
  const requirements = sc?.requirements || [];
  const responses = activeReview.responses || {};

  let html = '';
  if (sc?.reason) {
    html += `<div style="margin-bottom:20px;">
      <div style="font-weight:600;font-size:13.5px;margin-bottom:6px;">Suspension reason</div>
      <div style="background:#fff0f0;border-left:3px solid var(--primary);border-radius:6px;padding:12px 14px;font-size:14px;line-height:1.6;">${sc.reason}</div>
    </div>`;
  }

  if (requirements.length) {
    html += `<div style="font-weight:600;font-size:13.5px;margin-bottom:12px;">Writer's responses</div>`;
    requirements.forEach((req, i) => {
      const key = `req_${i}`;
      const val = responses[key];
      html += `<div style="margin-bottom:14px;padding:14px;background:#faf8f5;border-radius:10px;">
        <div style="font-weight:600;font-size:13px;margin-bottom:6px;">${req.title || `Field ${i + 1}`} <span style="font-weight:400;color:var(--text-muted);font-size:12px;">(${req.method})</span></div>`;

      if (!val) {
        html += `<div style="font-size:13px;color:var(--text-muted);font-style:italic;">No response provided</div>`;
      } else if (req.method === 'file' || req.method === 'photo') {
        html += `<a href="${val}" target="_blank" style="font-size:13px;color:var(--primary);text-decoration:underline;">${req.method === 'photo' ? '📷 View photo' : '📎 View file'}</a>`;
      } else {
        html += `<div style="font-size:14px;line-height:1.6;">${val}</div>`;
      }
      html += `</div>`;
    });
  } else {
    html += `<p style="font-size:14px;color:var(--text-muted);">No specific requirements were set — the writer submitted a general appeal.</p>`;
  }

  document.getElementById('reviewModalBody').innerHTML = html;
  document.getElementById('reviewModalError').style.display = 'none';

  // Show/hide approve & reject based on status
  const isPending = activeReview.status === 'pending';
  document.getElementById('reviewModalApprove').style.display = isPending ? '' : 'none';
  document.getElementById('reviewModalReject').style.display = isPending ? '' : 'none';

  document.getElementById('reviewModal').style.display = 'flex';
}

async function doApprove() {
  if (!activeReview) return;
  const btn = document.getElementById('reviewModalApprove');
  btn.disabled = true;
  try {
    const profileId = activeReview.suspension_cases?.profile_id;
    await store.approveReview(activeReview.id, activeReview.suspension_case_id, profileId);
    toast('Review approved — writer has been restored.');
    closeModal();
    await render();
  } catch (err) {
    document.getElementById('reviewModalError').textContent = err.message || 'Could not approve.';
    document.getElementById('reviewModalError').style.display = '';
  } finally {
    btn.disabled = false;
  }
}

async function doReject() {
  if (!activeReview) return;
  if (!confirm('Reject this review request? The writer will remain suspended.')) return;
  const btn = document.getElementById('reviewModalReject');
  btn.disabled = true;
  try {
    await store.rejectReview(activeReview.id);
    toast('Review request rejected.');
    closeModal();
    await render();
  } catch (err) {
    document.getElementById('reviewModalError').textContent = err.message || 'Could not reject.';
    document.getElementById('reviewModalError').style.display = '';
  } finally {
    btn.disabled = false;
  }
}

function closeModal() {
  document.getElementById('reviewModal').style.display = 'none';
  activeReview = null;
}
