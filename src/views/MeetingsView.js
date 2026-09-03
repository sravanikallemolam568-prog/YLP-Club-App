// Meetings Management View with 10 Role Assignments

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderMeetingsView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  if (branchFilter !== 'All') {
    meetings = meetings.filter(m => m.branch === branchFilter);
  }

  setTimeout(() => {
    bindMeetingsEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-calendar-days" style="color: var(--gold-primary);"></i> Meeting Management</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage club meetings, assign 10 Toastmasters roles, and track agendas.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="create-meeting-btn" class="btn btn-primary">
            <i class="fa-solid fa-calendar-plus"></i> Create New Meeting
          </button>
        ` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${meetings.map(mtg => `
          <div class="card" style="border-top: 4px solid var(--gold-primary);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="badge ${mtg.status === 'Completed' ? 'badge-success' : 'badge-gold'}">${mtg.status}</span>
                  <span style="font-weight: 700; font-size: 1.15rem; color: var(--gold-primary);">${mtg.date} (${mtg.startTime})</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
                  <i class="fa-solid fa-location-dot"></i> Branch: ${mtg.branch} • ID: ${mtg.id}
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <a href="#agenda" class="btn btn-outline btn-sm">
                  <i class="fa-solid fa-list-check"></i> Configure Agenda
                </a>
                ${authService.isECOfficer() ? `
                  <button class="btn btn-primary btn-sm assign-roles-btn" data-id="${mtg.id}">
                    <i class="fa-solid fa-user-tag"></i> Assign Roles
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Assigned Roles Grid -->
            <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color);">
              <div style="font-size: 0.82rem; font-weight: 700; color: var(--gold-primary); margin-bottom: 8px; text-transform: uppercase;">
                Meeting Role Assignments (10 Official Roles):
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; font-size: 0.85rem;">
                ${Object.entries(mtg.roles || {}).map(([role, member]) => `
                  <div style="padding: 6px 10px; background-color: var(--badge-bg); border-radius: 8px; display: flex; flex-direction: column;">
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">${role}</span>
                    <span style="font-weight: 600; color: var(--text-primary);">${member || 'TBD'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bindMeetingsEvents() {
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
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
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
    });
  });
}
