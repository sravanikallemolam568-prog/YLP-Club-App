// Executive Committee Settings Manager View

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';
import { exportCloudBackup, getCloudStatus } from '../services/cloudDataService.js';

export function renderSettingsView() {
  const ec = dbService.getECCommittee();
  const cloudStatus = getCloudStatus();
  const statusLabels = {
    online: 'Connected to Firestore',
    connecting: 'Connecting to Firestore',
    error: 'Database connection needs attention',
    offline: 'Not connected',
    unconfigured: 'Firebase setup required'
  };

  setTimeout(() => {
    bindSettingsEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-sliders" style="color: var(--gold-primary);"></i> Executive Committee (EC) Settings</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage EC officer designations and application preferences.</p>
        </div>
      </div>

      <section class="card" style="max-width: 700px; margin-bottom: 18px; padding: 18px;">
        <div class="card-title"><i class="fa-solid fa-cloud"></i> Permanent club storage</div>
        <p style="margin: 8px 0; color: var(--text-secondary); font-size: 0.86rem;">${statusLabels[cloudStatus.state] || 'Database status unknown'}</p>
        ${cloudStatus.error ? `<p style="margin: 8px 0; color: var(--color-danger); font-size: 0.8rem;">${cloudStatus.error}</p>` : ''}
        ${authService.isPresident() ? `
          <button id="download-cloud-cache-btn" type="button" class="btn btn-outline btn-sm" style="margin-top: 6px;">
            <i class="fa-solid fa-download"></i> Download current cache
          </button>
        ` : ''}
        <p style="margin: 10px 0 0; color: var(--text-muted); font-size: 0.76rem; line-height: 1.45;">This file is a copy of records currently cached on this device. Configure scheduled Firestore exports for a complete server-side backup.</p>
      </section>

      <div class="card" style="max-width: 700px;">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-user-gear"></i> Executive Committee Officer Roster</div>
        </div>

        <form id="ec-settings-form">
          <div class="form-group">
            <label class="form-label required">President</label>
            <input type="text" id="ec-pres" class="form-input" value="${ec.president || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">President Email</label>
            <input type="email" id="ec-pres-email" class="form-input" value="${ec.presidentEmail || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">VP Education</label>
            <input type="text" id="ec-vped" class="form-input" value="${ec.vpEducation || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">VP Membership</label>
            <input type="text" id="ec-vpmem" class="form-input" value="${ec.vpMembership || ''}" required />
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">
              <i class="fa-solid fa-lock" style="color: var(--google-blue);"></i> Access is assigned by the President. This role can manage Members and Attendance only.
            </div>
          </div>
          <div class="form-group">
            <label class="form-label required">VP Membership Email</label>
            <input type="email" id="ec-vpmem-email" class="form-input" value="${ec.vpMembershipEmail || ''}" required />
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-key" style="color: var(--google-blue);"></i> This email is required when signing in as VP Membership.</div>
          </div>

          <div class="form-group">
            <label class="form-label required">VP Public Relations (PR)</label>
            <input type="text" id="ec-vppr" class="form-input" value="${ec.vpPR || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">VP Public Relations Email</label>
            <input type="email" id="ec-vppr-email" class="form-input" value="${ec.vpPREmail || ''}" required />
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-key" style="color: var(--google-blue);"></i> This email opens Media Hub access only.</div>
          </div>

          <div class="form-group">
            <label class="form-label required">Secretary</label>
            <input type="text" id="ec-sec" class="form-input" value="${ec.secretary || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">Joint Secretary</label>
            <input type="text" id="ec-jsec" class="form-input" value="${ec.jointSecretary || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">Sergeant-at-Arms</label>
            <input type="text" id="ec-sgt" class="form-input" value="${ec.sergeant || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">Ajith Sir / Mentor Advisor</label>
            <input type="text" id="ec-ajith" class="form-input" value="${ec.ajithSir || 'Ajith Sir'}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Ajith Sir Email</label>
            <input type="email" id="ec-ajith-email" class="form-input" value="${ec.ajithSirEmail || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label required">Ajith Sir Role</label>
            <input type="text" id="ec-ajith-role" class="form-input" value="${ec.ajithSirRole || 'Advisor & Mentor'}" required />
          </div>

          ${authService.isPresident() ? `
            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 14px;">
              <i class="fa-solid fa-save"></i> Save EC Roster Updates
            </button>
          ` : `
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 10px;">
              <i class="fa-solid fa-lock"></i> Only the President can modify the EC Roster.
            </div>
          `}
        </form>
      </div>
    </div>
  `;
}

function bindSettingsEvents() {
  document.getElementById('download-cloud-cache-btn')?.addEventListener('click', () => {
    exportCloudBackup();
    showToast('Current device cache downloaded. Use scheduled Firestore exports for cloud backups.', 'success');
  });

  document.getElementById('ec-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedEc = {
      president: document.getElementById('ec-pres').value,
      presidentEmail: document.getElementById('ec-pres-email').value,
      vpEducation: document.getElementById('ec-vped').value,
      vpMembership: document.getElementById('ec-vpmem').value,
      vpMembershipEmail: document.getElementById('ec-vpmem-email').value,
      vpPR: document.getElementById('ec-vppr').value,
      vpPREmail: document.getElementById('ec-vppr-email').value,
      secretary: document.getElementById('ec-sec').value,
      jointSecretary: document.getElementById('ec-jsec').value,
      sergeant: document.getElementById('ec-sgt').value,
      ajithSir: document.getElementById('ec-ajith').value,
      ajithSirEmail: document.getElementById('ec-ajith-email').value,
      ajithSirRole: document.getElementById('ec-ajith-role').value
    };

    dbService.updateECCommittee(updatedEc);
    showToast('Executive Committee roster updated successfully!', 'success');
  });
}
