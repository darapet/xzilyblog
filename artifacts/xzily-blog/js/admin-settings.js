import { mountAdmin } from './admin-common.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('settings.html', 'Settings', 'Connect Cloudinary and Groq for the editor.');
if (session) await init();

async function init() {
  const grid = document.getElementById('groqKeyGrid');
  grid.innerHTML = [1, 2, 3, 4, 5].map((i) => `
    <div class="field">
      <label for="fGroqKey${i}">Groq API key ${i}${i === 1 ? '' : ' (optional)'}</label>
      <input id="fGroqKey${i}" type="password" placeholder="gsk_..." autocomplete="off" />
    </div>`).join('');

  const settings = await store.getSettings();
  document.getElementById('fCloudName').value = settings.cloudinaryCloudName;
  document.getElementById('fUploadPreset').value = settings.cloudinaryUploadPreset;
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`fGroqKey${i}`).value = settings[`groqApiKey${i}`];
  }
  updateStatus(settings);

  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const patch = {
      cloudinaryCloudName: document.getElementById('fCloudName').value,
      cloudinaryUploadPreset: document.getElementById('fUploadPreset').value,
    };
    for (let i = 1; i <= 5; i++) {
      patch[`groqApiKey${i}`] = document.getElementById(`fGroqKey${i}`).value;
    }
    try {
      const saved = await store.saveSettings(patch);
      updateStatus(saved);
      toast('Settings saved');
    } catch (err) {
      toast('Could not save settings');
    }
  });
}

function updateStatus(settings) {
  const cloudinaryOn = settings.cloudinaryCloudName && settings.cloudinaryUploadPreset;
  document.getElementById('cloudinaryStatus').textContent = cloudinaryOn
    ? 'Connected — new image uploads will go to Cloudinary.'
    : 'Not connected yet — image uploads currently fall back to Supabase storage.';
  document.getElementById('cloudinaryStatus').className = `settings-status ${cloudinaryOn ? 'on' : 'off'}`;

  const groqCount = [1, 2, 3, 4, 5].filter((i) => settings[`groqApiKey${i}`]).length;
  document.getElementById('groqStatus').textContent = groqCount > 0
    ? `${groqCount} key${groqCount === 1 ? '' : 's'} configured — AI Write is ready in the editor.`
    : 'No keys yet — the AI Write button in the editor will be disabled until you add one.';
  document.getElementById('groqStatus').className = `settings-status ${groqCount > 0 ? 'on' : 'off'}`;
}
