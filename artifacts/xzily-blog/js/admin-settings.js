import { mountAdmin } from './admin-common.js';
import { toast } from './common.js';
import { store } from './store.js';

const session = await mountAdmin('settings.html', 'Settings', 'Manage site identity, contact info, socials, and integrations.');
if (session) await init();

async function init() {
  // Build Groq key grid
  const grid = document.getElementById('groqKeyGrid');
  grid.innerHTML = [1, 2, 3, 4, 5].map((i) => `
    <div class="field">
      <label for="fGroqKey${i}">Groq API key ${i}${i === 1 ? '' : ' (optional)'}</label>
      <input id="fGroqKey${i}" type="password" placeholder="gsk_..." autocomplete="off" />
    </div>`).join('');

  const settings = await store.getSettings();

  // Site identity
  document.getElementById('fSiteName').value    = settings.siteName;
  document.getElementById('fFooterCredit').value = settings.footerCredit;

  // Contact
  document.getElementById('fContactEmail').value   = settings.contactEmail;
  document.getElementById('fContactPhone').value   = settings.contactPhone;
  document.getElementById('fContactAddress').value = settings.contactAddress;

  // Socials
  document.getElementById('fTwitterUrl').value         = settings.twitterUrl;
  document.getElementById('fFbUrl').value              = settings.fbUrl;
  document.getElementById('fInstagramUrl').value       = settings.instagramUrl;
  document.getElementById('fWhatsappNumber').value     = settings.whatsappNumber;
  document.getElementById('fWhatsappChannelUrl').value = settings.whatsappChannelUrl;

  // About
  document.getElementById('fAboutText').value     = settings.aboutText;
  document.getElementById('fStatsReaders').value  = settings.statsReaders;
  document.getElementById('fStatsStories').value  = settings.statsStories;
  document.getElementById('fStatsSections').value = settings.statsSections;
  document.getElementById('fStatsWriters').value  = settings.statsWriters;

  // Cloudinary
  document.getElementById('fCloudName').value    = settings.cloudinaryCloudName;
  document.getElementById('fUploadPreset').value = settings.cloudinaryUploadPreset;

  // Groq
  for (let i = 1; i <= 5; i++) {
    document.getElementById(`fGroqKey${i}`).value = settings[`groqApiKey${i}`];
  }

  updateStatus(settings);

  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    const patch = {
      siteName:    document.getElementById('fSiteName').value,
      footerCredit: document.getElementById('fFooterCredit').value,
      contactEmail:   document.getElementById('fContactEmail').value,
      contactPhone:   document.getElementById('fContactPhone').value,
      contactAddress: document.getElementById('fContactAddress').value,
      twitterUrl:         document.getElementById('fTwitterUrl').value,
      fbUrl:              document.getElementById('fFbUrl').value,
      instagramUrl:       document.getElementById('fInstagramUrl').value,
      whatsappNumber:     document.getElementById('fWhatsappNumber').value,
      whatsappChannelUrl: document.getElementById('fWhatsappChannelUrl').value,
      aboutText:     document.getElementById('fAboutText').value,
      statsReaders:  document.getElementById('fStatsReaders').value,
      statsStories:  document.getElementById('fStatsStories').value,
      statsSections: document.getElementById('fStatsSections').value,
      statsWriters:  document.getElementById('fStatsWriters').value,
      cloudinaryCloudName:    document.getElementById('fCloudName').value,
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
      toast('Could not save settings — ' + (err.message || 'unknown error'));
    }
  });
}

function updateStatus(settings) {
  const cloudOn = settings.cloudinaryCloudName && settings.cloudinaryUploadPreset;
  document.getElementById('cloudinaryStatus').textContent = cloudOn
    ? 'Connected — new image uploads will go to Cloudinary.'
    : 'Not connected yet — uploads fall back to Supabase storage.';
  document.getElementById('cloudinaryStatus').className = `settings-status ${cloudOn ? 'on' : 'off'}`;

  const groqCount = [1, 2, 3, 4, 5].filter((i) => settings[`groqApiKey${i}`]).length;
  document.getElementById('groqStatus').textContent = groqCount > 0
    ? `${groqCount} key${groqCount === 1 ? '' : 's'} configured — AI Write is ready in the editor.`
    : 'No keys yet — add one to enable AI Write in the story editor.';
  document.getElementById('groqStatus').className = `settings-status ${groqCount > 0 ? 'on' : 'off'}`;
}
