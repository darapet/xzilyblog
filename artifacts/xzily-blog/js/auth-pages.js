import { mountLayout } from './common.js';
import { store } from './store.js';

await mountLayout('');

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
      await store.login(email, password);
      showMsg('loginMsg', 'Signed in — redirecting…', 'success');
      setTimeout(() => (window.location.href = 'index.html'), 700);
    } catch (err) {
      showMsg('loginMsg', err.message || 'Invalid email or password.', 'error');
    }
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    try {
      const session = await store.register(name, email, password);
      if (session) {
        showMsg('registerMsg', 'Account created — redirecting…', 'success');
        setTimeout(() => (window.location.href = 'index.html'), 700);
      } else {
        showMsg('registerMsg', 'Account created — check your email to confirm it, then sign in.', 'success');
        setTimeout(() => (window.location.href = 'login.html'), 1600);
      }
    } catch (err) {
      showMsg('registerMsg', err.message || 'Could not create account.', 'error');
    }
  });
}

function showMsg(id, text, kind) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `form-msg ${kind} show`;
}
