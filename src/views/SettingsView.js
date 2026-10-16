// Executive Committee & Leadership Governance Manager (3-Tier Block Structure)

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';
import { exportCloudBackup, getCloudStatus } from '../services/cloudDataService.js';

export function renderSettingsView() {
  const ec = dbService.getECCommittee();
  const members = dbService.getMembers();
  const cloudStatus = getCloudStatus();
  const isPresident = authService.canManageEC(); // Only President has master write permissions

  const statusLabels = {
    online: 'Connected to Firestore',
    connecting: 'Connecting to Firestore',
    error: 'Database connection needs attention',
    offline: 'Local Storage Mode',
    unconfigured: 'Dual-Credential & Local Mode Active'
  };

  setTimeout(() => {
    bindSettingsEvents();
  }, 50);

  const disabledAttr = isPresident ? '' : 'disabled';

  return `
    <div class="animate-fade-in" style="max-width: 860px; margin: 0 auto; padding-bottom: 40px;">
      <!-- Page Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px;">
        <div>
          <div style="font-size: 0.76rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-primary);">ADMINISTRATIVE GOVERNANCE</div>
          <h2 style="font-size: 1.65rem; color: var(--text-primary); margin: 4px 0 0;">
            <i class="fa-solid fa-crown" style="color: var(--gold-primary);"></i> 3-Tier Leadership &amp; EC Settings
          </h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">
            Manage Master Block, Executive Committee (EC) credentials, and video call authorities.
          </p>
        </div>
      </div>

      <!-- Governance Status & Backup Card -->
      <section class="card" style="margin-bottom: 22px; padding: 20px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-weight: 800; font-size: 0.98rem; color: var(--text-primary);">
              <i class="fa-solid fa-shield-halved" style="color: var(--gold-primary);"></i> Governance Control Status
            </div>
            <p style="margin: 6px 0 0; color: var(--text-secondary); font-size: 0.84rem;">
              ${statusLabels[cloudStatus.state] || 'Local Device Storage Active'} • 
              <strong>${isPresident ? 'You have President (Super Admin) Write Access' : 'View-Only Access (President-Controlled)'}</strong>
            </p>
          </div>
          ${isPresident ? `
            <button id="download-cloud-cache-btn" type="button" class="btn btn-outline btn-sm">
              <i class="fa-solid fa-download"></i> Backup Device Cache
            </button>
          ` : ''}
        </div>
      </section>

      <form id="leadership-settings-form">
        <!-- ================================================================= -->
        <!-- TOP CARD: TIER 1 - MASTER BLOCK (2 PEOPLE) -->
        <!-- ================================================================= -->
        <section class="card" style="margin-bottom: 24px; padding: 24px; border-radius: 20px; border-left: 6px solid #EAB308; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <span class="badge" style="background: rgba(234, 179, 8, 0.15); color: #B45309; font-weight: 800; font-size: 0.76rem; border: 1px solid #FDE047;">
                👑 TIER 1: MASTER BLOCK (2 PEOPLE)
              </span>
              <h3 style="margin: 8px 0 0; font-size: 1.25rem; color: var(--text-primary);">Super Admin Authority</h3>
              <p style="margin: 4px 0 0; font-size: 0.82rem; color: var(--text-secondary);">
                Full control over the club. Both leaders have full access and can start video calls.
              </p>
            </div>
          </div>

          <!-- Person 1: President Card -->
          <div style="background: var(--badge-bg); border-radius: 16px; padding: 18px; margin-bottom: 18px; border: 1px solid var(--border-color);">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span style="width: 26px; height: 26px; border-radius: 8px; background: #EAB308; color: #000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 900;">1</span>
              <span>Person 1: Club President (Super Admin)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">President Full Name</label>
                <input type="text" id="ec-pres" class="form-input" value="${ec.president || ''}" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Registered Login Email</label>
                <input type="email" id="ec-pres-email" class="form-input" value="${ec.presidentEmail || ''}" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Registered Mobile Number</label>
                <input type="tel" id="ec-pres-phone" class="form-input" value="${ec.presidentPhone || ''}" placeholder="e.g. 9014231403" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Login Password</label>
                <input type="text" id="ec-pres-pass" class="form-input" value="${ec.presidentPassword || '123456'}" placeholder="Default: 123456" required ${disabledAttr} />
              </div>
            </div>
          </div>

          <!-- Person 2: Co-Master / Advisor Card -->
          <div style="background: var(--badge-bg); border-radius: 16px; padding: 18px; border: 1px solid var(--border-color);">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
              <span style="width: 26px; height: 26px; border-radius: 8px; background: #3B82F6; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 900;">2</span>
              <span>Person 2: Co-Master / Club Advisor (TM Ajith)</span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Advisor Full Name</label>
                <input type="text" id="ec-master2-name" class="form-input" value="${ec.master2Name || ec.ajithSir || 'TM Ajith'}" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Registered Login Email</label>
                <input type="email" id="ec-master2-email" class="form-input" value="${ec.master2Email || ec.ajithSirEmail || 'tmajiit@gmail.com'}" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Registered Mobile Number</label>
                <input type="tel" id="ec-master2-phone" class="form-input" value="${ec.master2Phone || ec.ajithSirPhone || '9391756155'}" placeholder="e.g. 9391756155" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Login Password</label>
                <input type="text" id="ec-master2-pass" class="form-input" value="${ec.master2Password || '123456'}" placeholder="Default: 123456" required ${disabledAttr} />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label required">Role / Title</label>
                <input type="text" id="ec-master2-role" class="form-input" value="${ec.master2Role || ec.ajithSirRole || 'Club Advisor & Mentor'}" required ${disabledAttr} />
              </div>
            </div>
          </div>
        </section>

        <!-- ================================================================= -->
        <!-- MIDDLE CARD: TIER 2 - EC TEAM BLOCK (5 PEOPLE) -->
        <!-- ================================================================= -->
        <section class="card" style="margin-bottom: 24px; padding: 24px; border-radius: 20px; border-left: 6px solid #3B82F6; box-shadow: var(--shadow-sm);">
          ${isPresident ? `
          <div style="background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.10)); border: 1px solid rgba(59,130,246,0.3); border-radius: 14px; padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: center; gap: 10px;">
            <i class="fa-solid fa-circle-info" style="color: #3B82F6; font-size: 1.1rem;"></i>
            <span style="font-size: 0.84rem; color: var(--text-primary); font-weight: 600;">
              <strong>President Portal:</strong> This is where you add and manage VP members. Fill in their Name, Email, Phone, and Password below. They can then log in with those credentials.
            </span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 10px;">
            <div>
              <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #1D4ED8; font-weight: 800; font-size: 0.76rem; border: 1px solid #93C5FD;">
                🛡️ VP MEMBERS &amp; EC OFFICERS (5 PEOPLE)
              </span>
              <h3 style="margin: 8px 0 0; font-size: 1.25rem; color: var(--text-primary);">Add / Manage VP Members</h3>
              <p style="margin: 4px 0 0; font-size: 0.82rem; color: var(--text-secondary);">
                Add VP members here with their credentials. They will be able to log in and start/host video calls for club sessions.
              </p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Officer 1: VP Education -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-graduation-cap" style="color: #3B82F6; margin-right: 6px;"></i> 1. VP Education
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <input type="text" id="ec-vped" class="form-input" placeholder="Full Name" value="${ec.vpEducation || ''}" required ${disabledAttr} />
                <input type="email" id="ec-vped-email" class="form-input" placeholder="Login Email" value="${ec.vpEducationEmail || ''}" required ${disabledAttr} />
                <input type="tel" id="ec-vped-phone" class="form-input" placeholder="Mobile Number" value="${ec.vpEducationPhone || ''}" required ${disabledAttr} />
                <input type="text" id="ec-vped-pass" class="form-input" placeholder="Login Password (Default: 123456)" value="${ec.vpEducationPassword || '123456'}" ${disabledAttr} />
              </div>
            </div>

            <!-- Officer 2: VP Membership -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-users" style="color: #10B981; margin-right: 6px;"></i> 2. VP Membership
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <input type="text" id="ec-vpmem" class="form-input" placeholder="Full Name" value="${ec.vpMembership || ''}" required ${disabledAttr} />
                <input type="email" id="ec-vpmem-email" class="form-input" placeholder="Login Email" value="${ec.vpMembershipEmail || ''}" required ${disabledAttr} />
                <input type="tel" id="ec-vpmem-phone" class="form-input" placeholder="Mobile Number" value="${ec.vpMembershipPhone || ''}" required ${disabledAttr} />
                <input type="text" id="ec-vpmem-pass" class="form-input" placeholder="Login Password (Default: 123456)" value="${ec.vpMembershipPassword || '123456'}" ${disabledAttr} />
              </div>
            </div>

            <!-- Officer 3: VP Public Relations -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-photo-film" style="color: #F59E0B; margin-right: 6px;"></i> 3. VP Public Relations (PR)
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <input type="text" id="ec-vppr" class="form-input" placeholder="Full Name" value="${ec.vpPR || ''}" required ${disabledAttr} />
                <input type="email" id="ec-vppr-email" class="form-input" placeholder="Login Email" value="${ec.vpPREmail || ''}" required ${disabledAttr} />
                <input type="tel" id="ec-vppr-phone" class="form-input" placeholder="Mobile Number" value="${ec.vpPRPhone || ''}" required ${disabledAttr} />
                <input type="text" id="ec-vppr-pass" class="form-input" placeholder="Login Password (Default: 123456)" value="${ec.vpPRPassword || '123456'}" ${disabledAttr} />
              </div>
            </div>

            <!-- Officer 4: Secretary -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-pen-fancy" style="color: #8B5CF6; margin-right: 6px;"></i> 4. Secretary
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <input type="text" id="ec-sec" class="form-input" placeholder="Full Name" value="${ec.secretary || ''}" required ${disabledAttr} />
                <input type="email" id="ec-sec-email" class="form-input" placeholder="Login Email" value="${ec.secretaryEmail || ''}" required ${disabledAttr} />
                <input type="tel" id="ec-sec-phone" class="form-input" placeholder="Mobile Number" value="${ec.secretaryPhone || ''}" required ${disabledAttr} />
                <input type="text" id="ec-sec-pass" class="form-input" placeholder="Login Password (Default: 123456)" value="${ec.secretaryPassword || '123456'}" ${disabledAttr} />
              </div>
            </div>

            <!-- Officer 5: Sergeant-at-Arms -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-shield" style="color: #EF4444; margin-right: 6px;"></i> 5. Sergeant-at-Arms
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                <input type="text" id="ec-sgt" class="form-input" placeholder="Full Name" value="${ec.sergeant || ''}" required ${disabledAttr} />
                <input type="email" id="ec-sgt-email" class="form-input" placeholder="Login Email" value="${ec.sergeantEmail || ''}" required ${disabledAttr} />
                <input type="tel" id="ec-sgt-phone" class="form-input" placeholder="Mobile Number" value="${ec.sergeantPhone || ''}" required ${disabledAttr} />
                <input type="text" id="ec-sgt-pass" class="form-input" placeholder="Login Password (Default: 123456)" value="${ec.sergeantPassword || '123456'}" ${disabledAttr} />
              </div>
            </div>
          </div>
        </section>

        <!-- Save Button / Permission Note -->
        ${isPresident ? `
          <button type="submit" class="btn btn-primary" style="width: 100%; height: 50px; font-weight: 800; font-size: 1rem; border-radius: 14px; margin-bottom: 24px;">
            <i class="fa-solid fa-floppy-disk"></i> Save Leadership &amp; EC Roster Updates
          </button>
        ` : `
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 14px; padding: 14px 18px; margin-bottom: 24px; color: #DC2626; font-size: 0.85rem; font-weight: 700;">
            <i class="fa-solid fa-lock"></i> Only the President has administrative authority to edit and save Master and EC Team rosters.
          </div>
        `}
      </form>

      <!-- ================================================================= -->
      <!-- LOWER CARD: TIER 3 - CLUB MEMBERS DIRECTORY SUMMARY -->
      <!-- ================================================================= -->
      <section class="card" style="padding: 24px; border-radius: 20px; border-left: 6px solid #10B981; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #047857; font-weight: 800; font-size: 0.76rem; border: 1px solid #A7F3D0;">
              👤 TIER 3: LOWER BLOCK (CLUB MEMBERS)
            </span>
            <h3 style="margin: 8px 0 0; font-size: 1.25rem; color: var(--text-primary);">Club Member Directory</h3>
            <p style="margin: 4px 0 0; font-size: 0.82rem; color: var(--text-secondary);">
              <strong>${members.length} registered Gaveliers</strong>. Members can log in using their registered Email &amp; Mobile number. They can join active video calls, but cannot start/configure calls.
            </p>
          </div>
          <a href="#members" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-users"></i> Manage Members Roster
          </a>
        </div>
      </section>
    </div>
  `;
}

function bindSettingsEvents() {
  document.getElementById('download-cloud-cache-btn')?.addEventListener('click', () => {
    exportCloudBackup();
    showToast('Current device cache downloaded. Use scheduled Firestore exports for cloud backups.', 'success');
  });

  document.getElementById('leadership-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!authService.canManageEC()) {
      showToast('Only the President can save changes to leadership credentials.', 'error');
      return;
    }

    const updatedEc = {
      // Tier 1: Master Block (2 People)
      president: document.getElementById('ec-pres')?.value.trim() || '',
      presidentEmail: document.getElementById('ec-pres-email')?.value.trim() || '',
      presidentPhone: document.getElementById('ec-pres-phone')?.value.trim() || '',
      presidentPassword: document.getElementById('ec-pres-pass')?.value.trim() || '123456',

      master2Name: document.getElementById('ec-master2-name')?.value.trim() || '',
      master2Email: document.getElementById('ec-master2-email')?.value.trim() || '',
      master2Phone: document.getElementById('ec-master2-phone')?.value.trim() || '',
      master2Password: document.getElementById('ec-master2-pass')?.value.trim() || '123456',
      master2Role: document.getElementById('ec-master2-role')?.value.trim() || 'Club Advisor & Mentor',

      // Tier 2: VP Members & EC Officers (5 People) - with passwords
      vpEducation: document.getElementById('ec-vped')?.value.trim() || '',
      vpEducationEmail: document.getElementById('ec-vped-email')?.value.trim() || '',
      vpEducationPhone: document.getElementById('ec-vped-phone')?.value.trim() || '',
      vpEducationPassword: document.getElementById('ec-vped-pass')?.value.trim() || '123456',

      vpMembership: document.getElementById('ec-vpmem')?.value.trim() || '',
      vpMembershipEmail: document.getElementById('ec-vpmem-email')?.value.trim() || '',
      vpMembershipPhone: document.getElementById('ec-vpmem-phone')?.value.trim() || '',
      vpMembershipPassword: document.getElementById('ec-vpmem-pass')?.value.trim() || '123456',

      vpPR: document.getElementById('ec-vppr')?.value.trim() || '',
      vpPREmail: document.getElementById('ec-vppr-email')?.value.trim() || '',
      vpPRPhone: document.getElementById('ec-vppr-phone')?.value.trim() || '',
      vpPRPassword: document.getElementById('ec-vppr-pass')?.value.trim() || '123456',

      secretary: document.getElementById('ec-sec')?.value.trim() || '',
      secretaryEmail: document.getElementById('ec-sec-email')?.value.trim() || '',
      secretaryPhone: document.getElementById('ec-sec-phone')?.value.trim() || '',
      secretaryPassword: document.getElementById('ec-sec-pass')?.value.trim() || '123456',

      sergeant: document.getElementById('ec-sgt')?.value.trim() || '',
      sergeantEmail: document.getElementById('ec-sgt-email')?.value.trim() || '',
      sergeantPhone: document.getElementById('ec-sgt-phone')?.value.trim() || '',
      sergeantPassword: document.getElementById('ec-sgt-pass')?.value.trim() || '123456'
    };

    dbService.updateECCommittee(updatedEc);
    showToast('Leadership & EC Roster updated successfully! Credentials are now active for login.', 'success');
  });
}
