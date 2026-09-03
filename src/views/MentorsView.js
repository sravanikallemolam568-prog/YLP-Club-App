// 100% Manual Mentor Assignment View (STRICT ZERO AUTOMATIC MENTOR SELECTION RULES)

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderMentorsView(branchFilter = 'All') {
  let mentors = dbService.getMentors();
  let members = dbService.getMembers();

  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
  }

  setTimeout(() => {
    bindMentorsEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-user-graduate" style="color: var(--gold-primary);"></i> Mentor Assignment (100% Manual Selection)</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Completely manual mentor assignment. No automatic speech rules or auto-assignments.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="assign-mentor-btn" class="btn btn-primary">
            <i class="fa-solid fa-user-check"></i> Assign Mentor
          </button>
        ` : ''}
      </div>

      <!-- Mentors Registry Cards -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-handshake"></i> Active Mentor Assignments</div>
        </div>

        <div class="mobile-card-grid">
          ${mentors.map(m => `
            <div style="padding: 16px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--badge-bg); display: flex; flex-direction: column; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge badge-gold">${m.speechScope || 'All Speeches'}</span>
                ${authService.isECOfficer() ? `
                  <button class="btn btn-danger btn-sm remove-mentor-btn" data-id="${m.id}"><i class="fa-solid fa-trash"></i></button>
                ` : ''}
              </div>
              <div style="font-weight: 800; font-size: 1.05rem;">
                <i class="fa-solid fa-child" style="color: var(--gold-primary);"></i> Junior: ${m.juniorName}
              </div>
              <div style="font-weight: 700; color: var(--text-primary);">
                <i class="fa-solid fa-user-tie" style="color: #10B981;"></i> Mentor: ${m.mentorName}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Assigned Date: ${m.assignedDate} • Assigned By: ${m.assignedBy || 'Admin'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function bindMentorsEvents() {
  const assignBtn = document.getElementById('assign-mentor-btn');
  assignBtn?.addEventListener('click', () => {
    const members = dbService.getMembers();

    const modalHtml = `
      <form id="assign-mentor-form">
        <div class="form-group">
          <label class="form-label required">Select Junior Member</label>
          <select id="asg-junior" class="form-select" required>
            ${members.map(m => `<option value="${m.name}">${m.name} (${m.branch})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Select Mentor (Manual Choice - All Members Available)</label>
          <select id="asg-mentor" class="form-select" required>
            ${members.map(m => `<option value="${m.name}">${m.name} (${m.branch})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">For Speech Scope</label>
          <select id="asg-speech" class="form-select" required>
            <option value="All Speeches">All Speeches</option>
            <option value="Speech 1">Speech 1 (Ice Breaker)</option>
            <option value="Speech 2">Speech 2 (Organizing Your Speech)</option>
            <option value="Speech 3">Speech 3 (Get to the Point)</option>
            <option value="Speech 4">Speech 4 (How to Say It)</option>
            <option value="Speech 5">Speech 5 (Your Body Speaks)</option>
            <option value="Speech 6">Speech 6 (Vocal Variety)</option>
            <option value="Speech 7">Speech 7 (Research Your Topic)</option>
            <option value="Speech 8">Speech 8 (Get Comfortable with Visual Aids)</option>
            <option value="Speech 9">Speech 9 (Persuade with Power)</option>
            <option value="Speech 10">Speech 10 (Inspire Your Audience)</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          <i class="fa-solid fa-handshake-angle"></i> Complete Manual Mentor Assignment
        </button>
      </form>
    `;

    openModal('Manual Mentor Assignment', modalHtml);

    document.getElementById('assign-mentor-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const juniorName = document.getElementById('asg-junior').value;
      const mentorName = document.getElementById('asg-mentor').value;
      const speechScope = document.getElementById('asg-speech').value;

      if (juniorName === mentorName) {
        showToast('Junior member and Mentor cannot be the same person.', 'error');
        return;
      }

      dbService.addMentorAssignment({
        juniorName,
        mentorName,
        speechScope,
        assignedBy: authService.getCurrentUser()?.name || 'President'
      });

      showToast(`Manually assigned ${mentorName} as mentor to ${juniorName}!`, 'success');
      closeModal();
      renderMentorsView('All');
    });
  });

  document.querySelectorAll('.remove-mentor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      dbService.removeMentorAssignment(id);
      showToast('Mentor assignment removed.', 'info');
      renderMentorsView('All');
    });
  });
}
