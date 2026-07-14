import { mountLayout, toast } from './common.js';
import { icon } from './icons.js';
import { store } from './store.js';

mountLayout('/contact.html');

document.getElementById('iconMail').innerHTML = icon('mail', 18);
document.getElementById('iconPhone').innerHTML = icon('phone', 18);
document.getElementById('iconMap').innerHTML = icon('mapPin', 18);

document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const subject = document.getElementById('cSubject').value.trim();
  const message = document.getElementById('cMessage').value.trim();
  store.addContactMessage({ name, email, subject, message });
  const msg = document.getElementById('contactMsg');
  msg.textContent = "Thanks — we'll get back to you soon.";
  msg.className = 'form-msg success show';
  e.target.reset();
  toast('Message sent');
});
