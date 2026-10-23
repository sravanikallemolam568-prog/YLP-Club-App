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

  const renderMemberPicker = (targetPrefix, currentName) => {
    if (!isPresident || members.length === 0) return '';
    return `
      <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 0.76rem; font-weight: 700; color: #2563EB;">
          <i class="fa-solid fa-user-check"></i> Choose from registered club members:
        </span>
        <select class="form-select ec-member-quickselect" data-target="${targetPrefix}" style="font-size: 0.78rem; padding: 4px 10px; height: 32px; width: auto; min-width: 230px; border-color: #BFDBFE; background: #FFFFFF;">
          <option value="">-- Or select existing member to auto-fill --</option>
          ${members.map(m => `
            <option value="${m.id}" data-name="${m.name}" data-email="${m.email || ''}" data-phone="${m.mobile || ''}" ${currentName === m.name ? 'selected' : ''}>
              ${m.name} (${m.branch}) • ${m.mobile || 'No Phone'}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  };

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

      <!-- EC Roles, Information Access & Permissions Handbook Card -->
      <section class="card" style="margin-bottom: 24px; padding: 22px; border-radius: 18px; border: 1px solid var(--border-color); background: var(--bg-card); box-shadow: var(--shadow-sm);">
        <details id="ec-roles-handbook-details" style="cursor: pointer;" open>
          <summary style="display: flex; justify-content: space-between; align-items: center; list-style: none; user-select: none;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 10px; background: #EFF6FF; color: #2563EB; display: grid; place-items: center; font-size: 1rem;">
                <i class="fa-solid fa-table-list"></i>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); font-weight: 800;">EC Role Responsibilities &amp; Permissions Matrix</h3>
                <p style="margin: 2px 0 0; font-size: 0.8rem; color: var(--text-secondary);">Official governance access levels and assigned responsibilities for all Executive Committee officers.</p>
              </div>
            </div>
            <span class="badge badge-info" style="font-size: 0.74rem; font-weight: 700;">Governance Guide</span>
          </summary>

          <div style="margin-top: 18px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
              <thead>
                <tr style="background: var(--badge-bg); border-bottom: 2px solid var(--border-color);">
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 170px;">Role</th>
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 280px;">Dashboard / Information Access</th>
                  <th style="padding: 12px 14px; text-align: left; font-weight: 800; min-width: 300px;">Permissions / Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #B45309;">
                      <i class="fa-solid fa-crown" style="color: #EAB308;"></i>
                      <span>President</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 1 · Super Admin</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    All club dashboards, attendance, speech progress, membership, meeting reports, EC reports, meeting schedules, agendas, leadership updates, action items
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    View and monitor all club activities, track progress, review reports, manage leadership updates and action items
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #1D4ED8;">
                      <i class="fa-solid fa-graduation-cap" style="color: #3B82F6;"></i>
                      <span>VP-Education</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Education</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Speech progress, meeting agendas, role assignments, attendance
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Track speech completion status, assign meeting roles, monitor attendance and educational progress
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #047857;">
                      <i class="fa-solid fa-users" style="color: #16A34A;"></i>
                      <span>VP-Membership</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Membership</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Membership roster, member status, attendance summaries
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Add membership requests, update approved membership status, record informed absences
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #854D0E;">
                      <i class="fa-solid fa-photo-film" style="color: #FACC15;"></i>
                      <span>VP-Public Relations</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Publicity</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Meeting schedule, media assignments, approved photos/videos, newsletter
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Assign photographers and videographers, upload media, prepare newsletters
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #1E3A8A;">
                      <i class="fa-solid fa-pen-fancy" style="color: #2563EB;"></i>
                      <span>Secretary</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Records</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Attendance register, meeting records, EC schedules, minutes
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Record attendance, prepare meeting minutes, update meeting records
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 14px; vertical-align: top; font-weight: 700;">
                    <div style="display: flex; align-items: center; gap: 7px; color: #854D0E;">
                      <i class="fa-solid fa-shield" style="color: #FACC15;"></i>
                      <span>Sergeant-at-Arms</span>
                    </div>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Tier 2 · Logistics</span>
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-secondary); line-height: 1.5;">
                    Meeting setup checklist, property register, equipment status
                  </td>
                  <td style="padding: 12px 14px; vertical-align: top; color: var(--text-primary); line-height: 1.5;">
                    Update equipment inventory, manage setup checklists, record opening and closing status
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
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
            ${renderMemberPicker('ec-pres', ec.president)}
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
              <strong>President Portal:</strong> You can select any existing club member from the dropdown below to auto-fill their details, or type credentials manually. Click Save below to activate their login.
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
                Select from existing club members or enter credentials. They will be able to log in and start/host video calls for club sessions.
              </p>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Officer 1: VP Education -->
            <div style="background: var(--badge-bg); border-radius: 14px; padding: 16px; border: 1px solid var(--border-color);">
              <div style="font-weight: 800; font-size: 0.9rem; color: #1E3E62; margin-bottom: 10px;">
                <i class="fa-solid fa-graduation-cap" style="color: #3B82F6; margin-right: 6px;"></i> 1. VP Education
              </div>
              ${renderMemberPicker('ec-vped', ec.vpEducation)}
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
                <i class="fa-solid fa-users" style="color: #16A34A; margin-right: 6px;"></i> 2. VP Membership
              </div>
              ${renderMemberPicker('ec-vpmem', ec.vpMembership)}
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
                <i class="fa-solid fa-photo-film" style="color: #FACC15; margin-right: 6px;"></i> 3. VP Public Relations (PR)
              </div>
              ${renderMemberPicker('ec-vppr', ec.vpPR)}
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
                <i class="fa-solid fa-pen-fancy" style="color: #2563EB; margin-right: 6px;"></i> 4. Secretary
              </div>
              ${renderMemberPicker('ec-sec', ec.secretary)}
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
                <i class="fa-solid fa-shield" style="color: #FACC15; margin-right: 6px;"></i> 5. Sergeant-at-Arms
              </div>
              ${renderMemberPicker('ec-sgt', ec.sergeant)}
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
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 14px; padding: 14px 18px; margin-bottom: 24px; color: #1E3A8A; font-size: 0.85rem; font-weight: 700;">
            <i class="fa-solid fa-lock"></i> Only the President has administrative authority to edit and save Master and EC Team rosters.
          </div>
        `}
      </form>

      <!-- ================================================================= -->
      <!-- LOWER CARD: TIER 3 - CLUB MEMBERS DIRECTORY SUMMARY -->
      <!-- ================================================================= -->
      <section class="card" style="padding: 24px; border-radius: 20px; border-left: 6px solid #16A34A; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <span class="badge" style="background: #F0FDF4; color: #16A34A; font-weight: 800; font-size: 0.76rem; border: 1px solid #BBF7D0;">
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

  // Handle quick-selecting existing registered members to auto-fill EC officer inputs
  document.querySelectorAll('.ec-member-quickselect').forEach(select => {
    select.addEventListener('change', (e) => {
      const selectedOption = e.target.selectedOptions?.[0];
      if (!selectedOption) return;
      const targetPrefix = e.target.getAttribute('data-target');
      if (!targetPrefix) return;

      const name = selectedOption.getAttribute('data-name');
      const email = selectedOption.getAttribute('data-email');
      const phone = selectedOption.getAttribute('data-phone');

      if (name) {
        const nameInput = document.getElementById(targetPrefix);
        const emailInput = document.getElementById(`${targetPrefix}-email`);
        const phoneInput = document.getElementById(`${targetPrefix}-phone`);

        if (nameInput) nameInput.value = name;
        if (emailInput && email) emailInput.value = email;
        if (phoneInput && phone) phoneInput.value = phone;
        showToast(`Auto-filled ${name}'s details. Click Save below to confirm.`, 'info');
      }
    });
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
