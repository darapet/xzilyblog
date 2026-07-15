import { store } from './store.js';

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('aEmail').value.trim();
  const password = document.getElementById('aPassword').value;
  const msg = document.getElementById('adminLoginMsg');
  const session = await store.loginAdmin(email, password);
  if (session) {
    msg.textContent = 'Signed in — loading dashboard…';
    msg.className = 'form-msg success show';
    setTimeout(() => (window.location.href = 'index.html'), 500);
  } else {
    msg.textContent = 'Invalid credentials, or this account does not have editor access.';
    msg.className = 'form-msg error show';
  }
});
