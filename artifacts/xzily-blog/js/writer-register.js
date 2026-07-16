import { store } from './store.js';

// If already signed in as writer, go straight to dashboard
const existing = await store.getSession();
if (existing?.role === 'writer') {
  window.location.href = 'writer/index.html';
}

const form  = document.getElementById('writerRegForm');
const errEl = document.getElementById('regError');
const btn   = document.getElementById('regBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.style.display = 'none';

  const firstName  = document.getElementById('fFirst').value.trim();
  const middleName = document.getElementById('fMiddle').value.trim();
  const lastName   = document.getElementById('fLast').value.trim();
  const authorName = document.getElementById('fAuthorName').value.trim();
  const address    = document.getElementById('fAddress').value.trim();
  const phone      = document.getElementById('fPhone').value.trim();
  const email      = document.getElementById('fEmail').value.trim();
  const pass       = document.getElementById('fPass').value;
  const pass2      = document.getElementById('fPass2').value;

  if (pass !== pass2) {
    showError('Passwords do not match.');
    return;
  }
  if (pass.length < 8) {
    showError('Password must be at least 8 characters.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    await store.registerWriter({ firstName, middleName, lastName, authorName, address, phone, email, password: pass });
    window.location.href = 'writer/index.html';
  } catch (err) {
    showError(err.message || 'Registration failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create writer account';
  }
});

function showError(msg) {
  errEl.textContent = msg;
  errEl.style.display = '';
}
