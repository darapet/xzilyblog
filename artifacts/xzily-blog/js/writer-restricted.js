import { store } from './store.js';

// Redirect away if not restricted
const session = await store.getSession();
if (!session) {
  window.location.href = 'login.html';
} else if (session.status === 'active') {
  window.location.href = 'index.html';
} else if (session.status === 'suspended') {
  window.location.href = 'suspended.html';
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await store.logout();
  window.location.href = 'login.html';
});
