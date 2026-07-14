import { mountLayout } from './common.js';
import { USERS } from './data.js';

mountLayout('/about.html');

document.getElementById('teamGrid').innerHTML = USERS.map((u) => `
  <div class="team-card">
    <img src="${u.avatar}" alt="${u.name}" />
    <h4>${u.name}</h4>
    <span>${u.bio ? u.bio.split('.')[0] + '.' : ''}</span>
  </div>`).join('');
