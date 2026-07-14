import { store } from './store.js';

document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('aEmail').value.trim();
  const password = document.getElementById('aPassword').value;
  const session = store.loginAdmin(email, password);
  const msg = document.getElementById('adminLoginMsg');
  if (session) {
    msg.textContent = 'Signed in — loading dashboard…';
    msg.className = 'form-msg success show';
    setTimeout(() => (window.location.href = '/admin/index.html'), 500);
  } else {
    msg.textContent = 'Invalid credentials. Use the demo credentials shown above.';
    msg.className = 'form-msg error show';
  }
});
