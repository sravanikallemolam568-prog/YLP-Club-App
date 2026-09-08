// Meetings Management View with Tab Controls and Premium Cards & List UI

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

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
    <div class="animate-fade-in">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem; color: var(--text-primary);"><i class="fa-solid fa-calendar-days" style="color: var(--gold-primary);"></i> Meetings & Agendas</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage upcoming sessions, assign Toastmasters roles, and track past meeting history.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="create-meeting-btn" class="btn btn-primary">
            <i class="fa-solid fa-calendar-plus"></i> Create New Meeting
          </button>
        ` : ''}
      </div>

      <!-- Segmented Tab Controls -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px; background: var(--badge-bg); padding: 4px; border-radius: 14px; border: 1px solid var(--border-color); width: fit-content;">
        <button id="tab-upcoming" class="tab-btn active" style="padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s ease;">
          <i class="fa-solid fa-calendar-check" style="color: var(--gold-primary); margin-right: 6px;"></i> Upcoming (${upcomingMeetings.length})
        </button>
        <button id="tab-past" class="tab-btn" style="padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 0.88rem; cursor: pointer; color: var(--text-secondary); transition: all 0.2s ease;">
          <i class="fa-solid fa-clock-rotate-left" style="color: #10B981; margin-right: 6px;"></i> Past Meetings (${pastMeetings.length})
        </button>
      </div>

      <!-- Upcoming Meetings View Container -->
      <div id="upcoming-meetings-sec" style="display: flex; flex-direction: column; gap: 16px;">
        ${upcomingMeetings.length === 0 ? `
          <div class="empty-state-card">
            <i class="fa-solid fa-calendar-xmark empty-state-icon"></i>
            <div class="empty-state-title">No Upcoming Meetings</div>
            <div class="empty-state-desc">Click "Create New Meeting" to schedule an upcoming Toastmasters session.</div>
          </div>
        ` : upcomingMeetings.map(mtg => `
          <div class="card" style="border-left: 4px solid var(--gold-primary); background: var(--bg-card); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <span class="badge badge-gold"><i class="fa-solid fa-clock"></i> ${mtg.status}</span>
                  <span style="font-weight: 800; font-size: 1.2rem; color: var(--gold-primary);">${mtg.date} • ${mtg.startTime}</span>
                </div>
                <div style="font-size: 0.86rem; color: var(--text-secondary); margin-top: 4px;">
                  <i class="fa-solid fa-location-dot" style="color: #EF4444; margin-right: 4px;"></i> Branch: <strong>${mtg.branch}</strong> • ID: ${mtg.id}
                </div>
              </div>

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <a href="#agenda" class="btn btn-outline btn-sm">
                  <i class="fa-solid fa-list-check" style="color: #3B82F6;"></i> Agenda
                </a>
                ${authService.isECOfficer() ? `
                  <button class="btn btn-primary btn-sm assign-roles-btn" data-id="${mtg.id}">
                    <i class="fa-solid fa-user-tag"></i> Assign Roles
                  </button>
                  <button class="btn btn-outline btn-sm mark-completed-btn" data-id="${mtg.id}" style="color: #10B981; border-color: rgba(16,185,129,0.3);">
                    <i class="fa-solid fa-circle-check"></i> Mark Completed
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- 10 Official Roles Grid -->
            <div style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-color);">
              <div style="font-size: 0.78rem; font-weight: 800; color: var(--gold-primary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                Role Assignments (10 Official Toastmasters Roles):
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px;">
                ${Object.entries(mtg.roles || {}).map(([role, member]) => `
                  <div style="padding: 8px 12px; background-color: var(--badge-bg); border-radius: 10px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: center;">
                    <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">${role}</span>
                    <span style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; margin-top: 2px;">
                      <i class="fa-solid fa-user" style="font-size: 0.72rem; color: var(--gold-primary); margin-right: 4px;"></i> ${member || 'TBD'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Past Meetings View Container (Hidden by default, shown when Past Tab selected) -->
      <div id="past-meetings-sec" style="display: none; flex-direction: column; gap: 12px;">
        ${pastMeetings.length === 0 ? `
          <div class="empty-state-card">
            <i class="fa-solid fa-history empty-state-icon"></i>
            <div class="empty-state-title">No Past Meetings</div>
            <div class="empty-state-desc">No completed meetings found in history.</div>
          </div>
        ` : pastMeetings.map(mtg => `
          <div class="card" style="padding: 16px; border-left: 4px solid #10B981; transition: transform 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #10B981; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                  <i class="fa-solid fa-calendar-check"></i>
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">
                    ${mtg.date} (${mtg.startTime})
                    <span class="badge badge-outline" style="margin-left: 6px; font-size: 0.72rem;">${mtg.branch}</span>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <span><i class="fa-solid fa-user-tie" style="color: var(--gold-bright);"></i> Gavelier: <strong>${mtg.roles?.Gavelier || 'N/A'}</strong></span>
                    <span><i class="fa-solid fa-user-shield" style="color: #3B82F6;"></i> GE: <strong>${mtg.roles?.['General Evaluator'] || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="btn btn-outline btn-sm view-roles-btn" data-id="${mtg.id}" style="padding: 6px 12px; font-size: 0.82rem;">
                  <i class="fa-solid fa-eye" style="color: var(--gold-primary);"></i> View Roles
                </button>
                <a href="#agenda" class="btn btn-outline btn-sm" style="padding: 6px 12px; font-size: 0.82rem;">
                  <i class="fa-solid fa-list-check" style="color: #3B82F6;"></i> Agenda
                </a>
              </div>
            </div>
          </div>
        `).join('')}
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
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px; height: 46px;">
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

      dbService.addMeeting({
        date, branch, startTime, status: 'Upcoming',
        roles: {
          'Sergeant': 'TBD', 'Gavelier': 'TBD', 'Topic Master': 'TBD', 'Evaluator': 'TBD', 'Timer': 'TBD',
          'Ah-Counter': 'TBD', 'Listener': 'TBD', 'Videographer': 'TBD', 'General Evaluator': 'TBD', 'Activity Master': 'TBD'
        },
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

  const members = dbService.getMembers();
  const rolesList = [
    'Sergeant', 'Gavelier', 'Topic Master', 'Evaluator', 'Timer',
    'Ah-Counter', 'Listener', 'Videographer', 'General Evaluator', 'Activity Master'
  ];

  const modalHtml = `
    <form id="assign-roles-form">
      <div style="margin-bottom: 14px; padding: 12px; background: var(--badge-bg); border-radius: 12px; font-size: 0.88rem; border: 1px solid var(--border-color);">
        <strong style="color: var(--gold-primary);">Meeting:</strong> ${mtg.date} (${mtg.startTime}) • <strong>Branch:</strong> ${mtg.branch}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; max-height: 55vh; overflow-y: auto; padding-right: 6px;">
        ${rolesList.map(role => `
          <div class="form-group" style="margin-bottom: 8px;">
            <label class="form-label">${role}</label>
            <select class="form-select role-select" data-role="${role}">
              <option value="TBD">-- Select Member --</option>
              ${members.map(mem => `
                <option value="${mem.name}" ${mtg.roles?.[role] === mem.name ? 'selected' : ''}>
                  ${mem.name} (${mem.branch})
                </option>
              `).join('')}
            </select>
          </div>
        `).join('')}
      </div>

      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px; height: 46px;">
        <i class="fa-solid fa-save"></i> Save Role Assignments
      </button>
    </form>
  `;

  openModal(`10 Official Roles - ${mtg.date}`, modalHtml);

  document.getElementById('assign-roles-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedRoles = {};
    document.querySelectorAll('.role-select').forEach(sel => {
      const roleName = sel.getAttribute('data-role');
      updatedRoles[roleName] = sel.value;
    });

    mtg.roles = updatedRoles;
    dbService.saveMeetings(meetings);
    showToast('Meeting role assignments updated!', 'success');
    closeModal();
    window.location.reload();
  });
}
