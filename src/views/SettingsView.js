// Executive Committee Settings Manager View

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderSettingsView() {
  const ec = dbService.getECCommittee();

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
            <label class="form-label required">VP Education</label>
            <input type="text" id="ec-vped" class="form-input" value="${ec.vpEducation || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">VP Membership</label>
            <input type="text" id="ec-vpmem" class="form-input" value="${ec.vpMembership || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label required">VP Public Relations (PR)</label>
            <input type="text" id="ec-vppr" class="form-input" value="${ec.vpPR || ''}" required />
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
  document.getElementById('ec-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedEc = {
      president: document.getElementById('ec-pres').value,
      vpEducation: document.getElementById('ec-vped').value,
      vpMembership: document.getElementById('ec-vpmem').value,
      vpPR: document.getElementById('ec-vppr').value,
      secretary: document.getElementById('ec-sec').value,
      jointSecretary: document.getElementById('ec-jsec').value,
      sergeant: document.getElementById('ec-sgt').value
    };

    dbService.updateECCommittee(updatedEc);
    showToast('Executive Committee roster updated successfully!', 'success');
  });
}
