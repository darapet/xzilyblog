import { mountAdmin } from './admin-common.js';
import { icon } from './icons.js';
import { formatDate, toast } from './common.js';
import { store } from './store.js';

const session = mountAdmin('subscribers.html', 'Subscribers', 'Manage the Xzily newsletter list.');
if (session) {
  render();
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
}

function render() {
  const subs = store.getSubscribers().sort((a, b) => new Date(b.subscribedAt) - new Date(a.subscribedAt));
  document.getElementById('subsTableBody').innerHTML = subs.map((s) => `
    <tr>
      <td>${s.email}</td>
      <td>${formatDate(s.subscribedAt)}</td>
      <td><button class="icon-btn" data-remove="${s.email}" title="Remove">${icon('trash', 15)}</button></td>
    </tr>`).join('');

  document.getElementById('subsEmpty').innerHTML = subs.length === 0
    ? `<div class="empty-state"><div class="icon-wrap">${icon('usersIcon', 24)}</div><h3>No subscribers yet</h3><p>They'll show up here once readers sign up on the site.</p></div>`
    : '';

  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.removeSubscriber(btn.dataset.remove);
      toast('Subscriber removed');
      render();
    });
  });
}

function exportCsv() {
  const subs = store.getSubscribers();
  if (subs.length === 0) {
    toast('No subscribers to export');
    return;
  }
  const rows = ['email,subscribed_at', ...subs.map((s) => `${s.email},${s.subscribedAt}`)];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'xzily-subscribers.csv';
  a.click();
  URL.revokeObjectURL(url);
}
