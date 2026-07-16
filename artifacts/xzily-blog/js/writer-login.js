import { store } from './store.js';

// If already signed in as writer, go straight to dashboard
const existing = await store.getSession();
if (existing?.role === 'writer') {
  window.location.href = 'index.html';
} else if (existing?.isAdmin) {
  window.location.href = '../admin/index.html';
}

const form  = document.getElementById('writerLoginForm');
const errEl = document.getElementById('loginError');
const btn   = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  try {
    await store.login(
      document.getElementById('wEmail').value.trim(),
      document.getElementById('wPass').value,
    );
    const session = await store.getSession();
    if (session?.isAdmin) {
      window.location.href = '../admin/index.html';
    } else if (session?.role === 'writer') {
      window.location.href = 'index.html';
    } else {
      errEl.textContent = 'This account does not have writer access.';
      errEl.style.display = '';
      await store.logout();
      btn.disabled = false;
      btn.textContent = 'Sign in to dashboard';
    }
  } catch (err) {
    errEl.textContent = err.message || 'Sign in failed. Check your email and password.';
    errEl.style.display = '';
    btn.disabled = false;
    btn.textContent = 'Sign in to dashboard';
  }
});
