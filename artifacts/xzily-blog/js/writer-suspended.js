import { store } from './store.js';

// Redirect away if not suspended
const session = await store.getSession();
if (!session) {
  window.location.href = 'login.html';
} else if (session.status === 'active') {
  window.location.href = 'index.html';
} else if (session.status === 'restricted') {
  window.location.href = 'restricted.html';
}

// Logout button
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await store.logout();
  window.location.href = 'login.html';
});

// Load suspension case
const sc = await store.getMySuspensionCase();
const reviewSection = document.getElementById('reviewSection');

if (sc) {
  // Show reason
  if (sc.reason) {
    document.getElementById('suspensionReason').style.display = '';
    document.getElementById('reasonText').textContent = sc.reason;
  }

  // Check if review already submitted (pending)
  const existingReview = await store.getMyPendingReview(sc.id);
  if (existingReview) {
    reviewSection.innerHTML = `
      <div class="already-submitted">
        <strong>Review request submitted</strong><br>
        Your review request is currently under review. You will regain access if the admin approves it.
        ${existingReview.status === 'rejected'
          ? '<br><br><strong style="color:var(--primary)">Your last request was rejected.</strong> You may submit a new one below.'
          : ''}
      </div>`;
  }

  if (!existingReview || existingReview.status === 'rejected') {
  // Build the review form based on requirements
  const requirements = sc.requirements || [];
  const uploadedFiles = {}; // key -> url

  if (requirements.length === 0 && !existingReview) {
    reviewSection.innerHTML = `
      <div style="margin-top:4px;">
        <div style="font-weight:600;font-size:14px;margin-bottom:12px;">Request a review</div>
        <p style="font-size:13.5px;color:var(--text-muted);">No specific requirements were set. Click below to submit a general review request.</p>
        <button class="btn btn-primary" id="submitReviewBtn" style="margin-top:14px;">Submit review request</button>
        <div class="error" id="reviewError" style="display:none;margin-top:10px;"></div>
      </div>`;
  } else {
    let formHtml = `<div style="font-weight:600;font-size:14px;margin-bottom:14px;">Request a review</div>
      <p style="font-size:13.5px;color:var(--text-muted);margin-bottom:18px;">Fill in all fields below and submit your review request.</p>
      <div class="req-form">`;

    requirements.forEach((req, i) => {
      const key = `req_${i}`;
      formHtml += `<div class="req-field">
        <label for="${key}">${req.title || `Field ${i + 1}`}</label>`;
      if (req.method === 'text') {
        formHtml += `<textarea id="${key}" name="${key}" rows="3" placeholder="Your response…"></textarea>`;
      } else if (req.method === 'number') {
        formHtml += `<input type="number" id="${key}" name="${key}" placeholder="Enter a number" />`;
      } else if (req.method === 'date') {
        formHtml += `<input type="date" id="${key}" name="${key}" />`;
      } else if (req.method === 'file') {
        formHtml += `<div class="upload-zone" id="zone_${key}" data-key="${key}" data-accept="*">
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:var(--text-muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div>Click to upload a file</div>
          <div class="file-name" id="fname_${key}"></div>
        </div>
        <input type="file" id="${key}_input" hidden />`;
      } else if (req.method === 'photo') {
        formHtml += `<div class="upload-zone" id="zone_${key}" data-key="${key}" data-accept="image/*">
          <svg viewBox="0 0 24 24" style="width:24px;height:24px;stroke:var(--text-muted);fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;margin-bottom:8px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div>Click to upload a photo</div>
          <div class="file-name" id="fname_${key}"></div>
        </div>
        <input type="file" id="${key}_input" accept="image/*" hidden />`;
      }
      formHtml += `</div>`;
    });

    formHtml += `</div>
      <button class="btn btn-primary" id="submitReviewBtn" style="margin-top:6px;">Submit review request</button>
      <div class="error" id="reviewError" style="display:none;margin-top:10px;"></div>`;

    reviewSection.innerHTML = formHtml;

    // Wire up file upload zones
    requirements.forEach((req, i) => {
      const key = `req_${i}`;
      if (req.method === 'file' || req.method === 'photo') {
        const zone = document.getElementById(`zone_${key}`);
        const input = document.getElementById(`${key}_input`);
        if (!zone || !input) return;
        zone.addEventListener('click', () => input.click());
        input.addEventListener('change', async () => {
          const file = input.files[0];
          if (!file) return;
          document.getElementById(`fname_${key}`).textContent = 'Uploading…';
          try {
            const url = await store.uploadImage(file, 'review-attachments');
            uploadedFiles[key] = url;
            document.getElementById(`fname_${key}`).textContent = file.name;
          } catch {
            document.getElementById(`fname_${key}`).textContent = 'Upload failed — try again';
          }
        });
      }
    });
  }

  // Submit handler
  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    const errEl = document.getElementById('reviewError');
    const responses = {};

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];
      const key = `req_${i}`;
      if (req.method === 'file' || req.method === 'photo') {
        responses[key] = uploadedFiles[key] || '';
      } else {
        const el = document.getElementById(key);
        responses[key] = el ? el.value.trim() : '';
      }
    }

    const btn = document.getElementById('submitReviewBtn');
    btn.disabled = true;
    errEl.style.display = 'none';
    try {
      await store.submitReview(sc.id, responses);
      reviewSection.innerHTML = `
        <div class="already-submitted">
          <strong>Review request submitted!</strong><br>
          Your request has been sent to the admin for review. You will be notified if your account is restored.
        </div>`;
    } catch (err) {
      errEl.textContent = err.message || 'Could not submit review. Please try again.';
      errEl.style.display = '';
      btn.disabled = false;
    }
  });
  }

} else {
  // No active suspension case — might be restricted page mismatch
  reviewSection.innerHTML = `<p style="font-size:14px;color:var(--text-muted);">Your account has been suspended. Please contact the administrator.</p>`;
}
