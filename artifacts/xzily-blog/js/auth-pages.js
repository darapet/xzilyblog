import { mountLayout } from './common.js';
import { store } from './store.js';

mountLayout('');

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    store.login(email, password);
    showMsg('loginMsg', 'Signed in — redirecting…', 'success');
    setTimeout(() => (window.location.href = 'index.html'), 700);
  });
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    store.register(name, email, password);
    showMsg('registerMsg', 'Account created — redirecting…', 'success');
    setTimeout(() => (window.location.href = 'index.html'), 700);
  });
}

function showMsg(id, text, kind) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `form-msg ${kind} show`;
}
