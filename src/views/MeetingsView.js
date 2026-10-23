// Meetings Management View with Clean, Professional Role Tracking UI

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

const OFFICIAL_ROLES = [
  'Sergeant', 'Gavelier', 'Topic Master', 'Evaluator', 'Timer',
  'Ah-Counter', 'Listener', 'Videographer', 'General Evaluator', 'Activity Master'
];

function getAssignedMember(roles, roleName) {
  if (!roles) return null;
  const raw = roles[roleName];
  if (!raw) return null;
  const val = String(raw).trim();
  if (!val || val === 'TBD' || val === 'Not Assigned' || val === '-- Select Member --') {
    return null;
  }
  return val;
}

export function renderMeetingsView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  if (branchFilter !== 'All') {
    meetings = meetings.filter(m => m.branch === branchFilter);
  }

  const upcomingMeetings = meetings.filter(m => m.status === 'Upcoming');
  const pastMeetings = meetings.filter(m => m.status === 'Completed' || m.status !== 'Upcoming');

  setTimeout(() => {
    bindMeetingsEvents();
  }, 50);

  return `
    <div class="animate-fade-in" style="max-width: 960px; margin: 0 auto; padding-bottom: 30px;">
      <!-- Module Tabs (Meetings / Agenda Config) -->
      <div style="display: flex; gap: 0; margin-bottom: 20px; border-bottom: 2px solid #E2E8F0;">
        <a href="#meetings"
           style="padding: 10px 18px; font-size: 0.875rem; font-weight: 700; color: #2563EB; border-bottom: 3px solid #2563EB; margin-bottom: -2px; text-decoration: none; display: flex; align-items: center; gap: 7px; background: #EFF6FF; border-top-left-radius: 8px; border-top-right-radius: 8px;">
          <i class="fa-solid fa-calendar-days"></i> Meetings
        </a>
        <a href="#agenda"
           style="padding: 10px 18px; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); border-bottom: 3px solid transparent; margin-bottom: -2px; text-decoration: none; display: flex; align-items: center; gap: 7px; transition: all 0.15s;">
          <i class="fa-solid fa-list-check"></i> Agenda Config
        </a>
      </div>

      <!-- Clean Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h2 style="font-size: 1.45rem; color: var(--text-primary); margin: 0; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-calendar-days" style="color: #2563EB;"></i> Meetings
          </h2>
          <p style="font-size: 0.84rem; color: var(--text-secondary); margin: 3px 0 0;">Manage your club sessions and official role assignments.</p>
        </div>
        ${authService.canManageMeetings() ? `
          <button id="create-meeting-btn" class="btn btn-primary btn-sm" style="height: 38px; padding: 0 16px; font-weight: 700; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 10px;">
            <i class="fa-solid fa-plus"></i> New Meeting
          </button>
        ` : ''}
      </div>

      <!-- Segmented Tab Controls -->
      <div style="display: flex; gap: 8px; margin-bottom: 18px; background: #F1F5F9; padding: 4px; border-radius: 12px; border: 1px solid var(--border-color); width: fit-content;">
        <button id="tab-upcoming" class="tab-btn active" style="padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.2s ease;">
          <i class="fa-solid fa-calendar-check" style="color: #2563EB; margin-right: 5px;"></i> Upcoming (${upcomingMeetings.length})
        </button>
        <button id="tab-past" class="tab-btn" style="padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 0.82rem; cursor: pointer; color: var(--text-secondary); transition: all 0.2s ease;">
          <i class="fa-solid fa-clock-rotate-left" style="color: #16A34A; margin-right: 5px;"></i> Past Meetings (${pastMeetings.length})
        </button>
      </div>

      <!-- UPCOMING MEETINGS CONTAINER -->
      <div id="upcoming-meetings-sec" style="display: flex; flex-direction: column; gap: 16px;">
        ${upcomingMeetings.length === 0 ? `
          <div class="empty-state-card" style="padding: 36px 20px; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 16px; text-align: center;">
            <i class="fa-solid fa-calendar-xmark empty-state-icon" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 10px;"></i>
            <div class="empty-state-title" style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">No Upcoming Meetings</div>
            <div class="empty-state-desc" style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px;">Click "New Meeting" to schedule an upcoming Toastmasters session.</div>
          </div>
        ` : upcomingMeetings.map(mtg => {
          const ec = dbService.getECCommittee();
          const assignedCount = OFFICIAL_ROLES.filter(role => Boolean(getAssignedMember(mtg.roles, role))).length;

          return `
            <div class="card" style="border: 1px solid var(--border-color); border-left: 5px solid #2563EB; background: var(--bg-card); border-radius: 16px; padding: 18px 20px; box-shadow: var(--shadow-sm); position: relative;">
              
              <!-- Card Top Row: Meeting Details + Main Action Menu -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span class="badge badge-info" style="font-weight: 800; font-size: 0.72rem; padding: 3px 8px;">
                      <i class="fa-solid fa-circle-dot" style="font-size: 0.6rem; margin-right: 3px;"></i> ${mtg.status}
                    </span>
                    <span class="badge badge-outline" style="font-weight: 700; font-size: 0.72rem; padding: 3px 8px;">
                      <i class="fa-solid fa-location-dot" style="color: #2563EB; margin-right: 3px;"></i> ${mtg.branch} Branch
                    </span>
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">#${mtg.id}</span>
                  </div>

                  <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-top: 6px; letter-spacing: -0.01em;">
                    ${mtg.date} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-secondary);">at ${mtg.startTime}</span>
                  </div>
                </div>

                <!-- Single Primary "Manage Meeting" Dropdown -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  <details class="meeting-actions-dropdown">
                    <summary class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 700; padding: 7px 14px; border-radius: 9px;">
                      <span>Manage Meeting</span>
                      <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>
                    </summary>
                    <div class="meeting-actions-menu">
                      ${mtg.videoLink ? `
                        <a href="${mtg.videoLink}" target="_blank" rel="noopener noreferrer">
                          <i class="fa-solid fa-video" style="color: #16A34A;"></i> Join Video Call
                        </a>
                      ` : (authService.canStartVideoCall() ? `
                        <a href="#connect">
                          <i class="fa-solid fa-video" style="color: #2563EB;"></i> Start Video Call
                        </a>
                      ` : `
                        <div style="padding: 8px 12px; font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
                          <i class="fa-solid fa-circle-pause"></i> Call not started
                        </div>
                      `)}
                      <a href="#agenda">
                        <i class="fa-solid fa-list-check" style="color: #2563EB;"></i> Open Agenda
                      </a>
                      ${authService.canManageMeetings() ? `
                        <button type="button" class="assign-roles-btn" data-id="${mtg.id}">
                          <i class="fa-solid fa-user-tag" style="color: #FACC15;"></i> Edit Roles
                        </button>
                        <button type="button" class="mark-completed-btn danger-action" data-id="${mtg.id}">
                          <i class="fa-solid fa-circle-check" style="color: #16A34A;"></i> Complete Meeting
                        </button>
                      ` : ''}
                    </div>
                  </details>
                </div>
              </div>

              <!-- Compact Roles Section with 10 Official Roles & Green/Grey Status -->
              <div style="margin-top: 16px; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: 14px; background: #FFFFFF;">
                
                <!-- Roles Header Bar -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">
                  <div style="display: flex; align-items: center; gap: 9px;">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background: ${assignedCount > 0 ? '#F0FDF4' : '#EFF6FF'}; color: ${assignedCount > 0 ? '#16A34A' : '#2563EB'}; display: grid; place-items: center; font-size: 0.9rem;">
                      <i class="fa-solid fa-users-gear"></i>
                    </div>
                    <div>
                      <div style="font-size: 0.88rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <span>Meeting Roles</span>
                        <span class="badge ${assignedCount === 10 ? 'badge-success' : assignedCount > 0 ? 'badge-info' : 'badge-outline'}" style="font-size: 0.72rem; font-weight: 800; padding: 2px 7px;">
                          Roles Assigned: ${assignedCount}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button type="button" class="btn btn-outline btn-sm assign-roles-btn" data-id="${mtg.id}" style="font-weight: 700; font-size: 0.78rem; padding: 5px 14px; border-radius: 8px; border-color: #BFDBFE; color: #2563EB; background: #EFF6FF; display: inline-flex; align-items: center; gap: 6px;">
                      <i class="fa-solid fa-pen-to-square"></i> ${authService.canManageMeetings() ? 'Edit Roles' : 'View Roles'}
                    </button>
                  </div>
                </div>

                <!-- 10 Roles Grid Display (Green for assigned, Grey for unassigned) -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
                  ${OFFICIAL_ROLES.map(role => {
                    const assignedName = getAssignedMember(mtg.roles, role);
                    const isAssigned = Boolean(assignedName);

                    return `
                      <div style="padding: 7px 10px; border-radius: 9px; background: ${isAssigned ? '#F0FDF4' : '#F8FAFC'}; border: 1px solid ${isAssigned ? '#BBF7D0' : '#E2E8F0'}; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isAssigned ? '#16A34A' : '#94A3B8'}; flex-shrink: 0;" title="${isAssigned ? 'Assigned' : 'Not Assigned'}"></span>
                          <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${role}
                          </span>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: ${isAssigned ? '700' : '500'}; color: ${isAssigned ? 'var(--text-primary)' : '#94A3B8'}; ${isAssigned ? '' : 'font-style: italic;'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: right;">
                          ${isAssigned ? assignedName : 'Not Assigned'}
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

              </div>

              <!-- Expandable Video-Call Authorities Accordion -->
              <details class="authorities-accordion" style="margin-top: 12px; border: 1px solid var(--border-color); border-radius: 12px; background: #FFFFFF; overflow: hidden;">
                <summary style="padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; list-style: none; font-size: 0.82rem; user-select: none;">
                  <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-weight: 600;">
                    <i class="fa-solid fa-shield-halved" style="color: #2563EB;"></i>
                    <span>Call Authorities: <strong style="color: var(--text-primary); font-weight: 700;">7 authorized members</strong></span>
                  </div>
                  <span style="font-size: 0.76rem; font-weight: 700; color: #2563EB; display: flex; align-items: center; gap: 4px;">
                    <span>View Authorities</span> <i class="fa-solid fa-chevron-down" style="font-size: 0.65rem;"></i>
                  </span>
                </summary>
                <div style="padding: 10px 14px 14px; border-top: 1px solid var(--border-color); background: #F8FAFC; display: flex; flex-wrap: wrap; gap: 6px;">
                  <span class="badge" style="background: #FEFCE8; color: #854D0E; border: 1px solid #FEF08A; font-size: 0.74rem;">👑 ${ec.president || 'President'}</span>
                  <span class="badge" style="background: #FEFCE8; color: #854D0E; border: 1px solid #FEF08A; font-size: 0.74rem;">👑 ${ec.master2Name || ec.ajithSir || 'Ajith Sir'} (Advisor)</span>
                  <span class="badge" style="background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; font-size: 0.74rem;">🛡️ ${ec.vpEducation || 'VP Ed'}</span>
                  <span class="badge" style="background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; font-size: 0.74rem;">🛡️ ${ec.vpMembership || 'VPM'}</span>
                  <span class="badge" style="background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; font-size: 0.74rem;">🛡️ ${ec.vpPR || 'VP PR'}</span>
                  <span class="badge" style="background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; font-size: 0.74rem;">🛡️ ${ec.secretary || 'Sec'}</span>
                  <span class="badge" style="background: #EFF6FF; color: #1E3A8A; border: 1px solid #BFDBFE; font-size: 0.74rem;">🛡️ ${ec.sergeant || 'Sgt'}</span>
                </div>
              </details>

            </div>
          `;
        }).join('')}
      </div>

      <!-- PAST MEETINGS CONTAINER -->
      <div id="past-meetings-sec" style="display: none; flex-direction: column; gap: 12px;">
        ${pastMeetings.length === 0 ? `
          <div class="empty-state-card" style="padding: 36px 20px; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 16px; text-align: center;">
            <i class="fa-solid fa-history empty-state-icon" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 10px;"></i>
            <div class="empty-state-title" style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">No Past Meetings</div>
            <div class="empty-state-desc" style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px;">Completed meetings will appear here in chronological history.</div>
          </div>
        ` : pastMeetings.map(mtg => {
          const gavelier = getAssignedMember(mtg.roles, 'Gavelier');
          const ge = getAssignedMember(mtg.roles, 'General Evaluator');

          return `
            <div class="card" style="padding: 16px 18px; border: 1px solid var(--border-color); border-left: 4px solid #16A34A; background: var(--bg-card); border-radius: 14px; box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; border-radius: 10px; background: #F0FDF4; color: #16A34A; display: flex; align-items: center; justify-content: center; font-size: 1.15rem;">
                    <i class="fa-solid fa-calendar-check"></i>
                  </div>
                  <div>
                    <div style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">
                      ${mtg.date} <span style="font-weight: 500; font-size: 0.85rem; color: var(--text-secondary);">(${mtg.startTime})</span>
                      <span class="badge badge-outline" style="margin-left: 6px; font-size: 0.72rem; padding: 2px 7px;">${mtg.branch}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 3px; display: flex; gap: 12px; flex-wrap: wrap;">
                      <span><i class="fa-solid fa-user-tie" style="color: #FACC15;"></i> Gavelier: <strong style="${gavelier ? '' : 'color: #94A3B8; font-style: italic; font-weight: 500;'}">${gavelier || 'Not Assigned'}</strong></span>
                      <span><i class="fa-solid fa-user-shield" style="color: #2563EB;"></i> GE: <strong style="${ge ? '' : 'color: #94A3B8; font-style: italic; font-weight: 500;'}">${ge || 'Not Assigned'}</strong></span>
                    </div>
                  </div>
                </div>

                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-sm view-roles-btn" data-id="${mtg.id}" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 8px;">
                    <i class="fa-solid fa-eye" style="color: #2563EB;"></i> View Roles
                  </button>
                  <a href="#agenda" class="btn btn-outline btn-sm" style="padding: 5px 12px; font-size: 0.8rem; border-radius: 8px;">
                    <i class="fa-solid fa-list-check" style="color: #2563EB;"></i> Agenda
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function bindMeetingsEvents() {
  const tabUpcoming = document.getElementById('tab-upcoming');
  const tabPast = document.getElementById('tab-past');
  const secUpcoming = document.getElementById('upcoming-meetings-sec');
  const secPast = document.getElementById('past-meetings-sec');

  tabUpcoming?.addEventListener('click', () => {
    tabUpcoming.className = 'tab-btn active';
    tabUpcoming.style.color = 'var(--text-primary)';
    tabPast.className = 'tab-btn';
    tabPast.style.color = 'var(--text-secondary)';
    if (secUpcoming) secUpcoming.style.display = 'flex';
    if (secPast) secPast.style.display = 'none';
  });

  tabPast?.addEventListener('click', () => {
    tabPast.className = 'tab-btn active';
    tabPast.style.color = 'var(--text-primary)';
    tabUpcoming.className = 'tab-btn';
    tabUpcoming.style.color = 'var(--text-secondary)';
    if (secPast) secPast.style.display = 'flex';
    if (secUpcoming) secUpcoming.style.display = 'none';
  });

  // Automatically close any open details dropdown when clicking outside
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.meeting-actions-dropdown[open]').forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.removeAttribute('open');
      }
    });
  });

  const createBtn = document.getElementById('create-meeting-btn');
  createBtn?.addEventListener('click', () => {
    const modalHtml = `
      <form id="create-meeting-form">
        <div class="form-group">
          <label class="form-label required">Meeting Date</label>
          <input type="date" id="mtg-date" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label required">Branch</label>
          <select id="mtg-branch" class="form-select" required>
            <option value="Miyapur">Miyapur</option>
            <option value="GHMC">GHMC</option>
            <option value="MKR">MKR</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Start Time</label>
          <input type="text" id="mtg-time" class="form-input" value="10:00 AM" placeholder="e.g. 10:00 AM" required />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px; height: 46px; font-weight: 700;">
          <i class="fa-solid fa-plus"></i> Create Meeting
        </button>
      </form>
    `;

    openModal('Create New Gavel Club Meeting', modalHtml);

    document.getElementById('create-meeting-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('mtg-date').value;
      const branch = document.getElementById('mtg-branch').value;
      const startTime = document.getElementById('mtg-time').value;

      const initialRoles = {};
      OFFICIAL_ROLES.forEach(role => {
        initialRoles[role] = '';
      });

      dbService.addMeeting({
        date, branch, startTime, status: 'Upcoming', videoPlatform: 'Google Meet', videoLink: '',
        roles: initialRoles,
        agenda: [
          { order: 1, activity: 'Opening', member: 'Sergeant', duration: 5 }
        ]
      });

      showToast('Meeting created successfully!', 'success');
      closeModal();
      window.location.hash = '#meetings';
      window.location.reload();
    });
  });

  document.querySelectorAll('.assign-roles-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mtgId = e.currentTarget.getAttribute('data-id');
      openAssignRolesModal(mtgId);
    });
  });

  document.querySelectorAll('.view-roles-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mtgId = e.currentTarget.getAttribute('data-id');
      openAssignRolesModal(mtgId);
    });
  });

  document.querySelectorAll('.mark-completed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mtgId = e.currentTarget.getAttribute('data-id');
      const meetings = dbService.getMeetings();
      const target = meetings.find(m => m.id === mtgId);
      if (target) {
        target.status = 'Completed';
        dbService.saveMeetings(meetings);
        showToast('Meeting marked as Completed!', 'success');
        window.location.reload();
      }
    });
  });
}

function openAssignRolesModal(mtgId) {
  const meetings = dbService.getMeetings();
  const mtg = meetings.find(m => m.id === mtgId);
  if (!mtg) return;

  const canManage = authService.canManageMeetings();
  const members = dbService.getMembers();

  const modalHtml = `
    <form id="assign-roles-form">
      <div style="margin-bottom: 14px; padding: 12px 14px; background: #EFF6FF; border-radius: 12px; font-size: 0.88rem; border: 1px solid #BFDBFE;">
        <strong style="color: #2563EB;">Meeting:</strong> ${mtg.date} (${mtg.startTime}) • <strong>Branch:</strong> ${mtg.branch}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; max-height: 55vh; overflow-y: auto; padding-right: 6px;">
        ${OFFICIAL_ROLES.map(role => {
          const assignedName = getAssignedMember(mtg.roles, role);

          return `
            <div class="form-group" style="margin-bottom: 8px;">
              <label class="form-label" style="font-weight: 700; font-size: 0.82rem; text-transform: uppercase;">${role}</label>
              ${canManage ? `
                <select class="form-select role-select" data-role="${role}">
                  <option value="" ${!assignedName ? 'selected' : ''}>-- Not Assigned --</option>
                  ${members.map(mem => `
                    <option value="${mem.name}" ${assignedName === mem.name ? 'selected' : ''}>
                      ${mem.name} (${mem.branch})
                    </option>
                  `).join('')}
                </select>
              ` : `
                <div style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; font-weight: ${assignedName ? '700' : '500'}; font-size: 0.84rem; color: ${assignedName ? 'var(--text-primary)' : '#94A3B8'}; ${assignedName ? '' : 'font-style: italic;'}; display: flex; align-items: center; gap: 7px;">
                  <span style="width: 7px; height: 7px; border-radius: 50%; background: ${assignedName ? '#16A34A' : '#94A3B8'};"></span>
                  <span>${assignedName || 'Not Assigned'}</span>
                </div>
              `}
            </div>
          `;
        }).join('')}
      </div>

      ${canManage ? `
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px; height: 46px; font-weight: 700;">
          <i class="fa-solid fa-save"></i> Save Role Assignments
        </button>
      ` : `
        <button type="button" class="btn btn-outline" onclick="document.getElementById('modal-close-btn')?.click()" style="width: 100%; margin-top: 16px; height: 42px; font-weight: 700;">
          Close
        </button>
      `}
    </form>
  `;

  openModal(`10 Official Roles — ${mtg.date}`, modalHtml);

  if (canManage) {
    document.getElementById('assign-roles-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedRoles = {};
      document.querySelectorAll('.role-select').forEach(sel => {
        const roleName = sel.getAttribute('data-role');
        const val = sel.value.trim();
        updatedRoles[roleName] = (val && val !== 'Not Assigned') ? val : '';
      });

      mtg.roles = updatedRoles;
      dbService.saveMeetings(meetings);
      showToast('Meeting role assignments updated!', 'success');
      closeModal();
      window.location.reload();
    });
  }
}
