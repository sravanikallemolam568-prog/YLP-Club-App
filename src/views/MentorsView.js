// Mentee and Mentor List View with Contacts Only

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
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-user-graduate" style="color: var(--gold-primary);"></i> Mentee & Mentor List</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Directory of mentees and mentors with contact numbers.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="assign-mentor-btn" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i> Assign Mentor
          </button>
        ` : ''}
      </div>

      <!-- Clean Mentee & Mentor Contact List Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mentee Name</th>
                <th>Mentee Contact</th>
                <th>Mentor Name</th>
                <th>Mentor Contact</th>
                ${authService.isECOfficer() ? `<th>Action</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${mentors.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    No mentor assignments found. Click "Assign Mentor" to add.
                  </td>
                </tr>
              ` : mentors.map(m => {
                const juniorMember = members.find(mem => mem.id === m.juniorId || mem.name === m.juniorName) || { mobile: m.juniorMobile || 'N/A' };
                const mentorMember = members.find(mem => mem.id === m.mentorId || mem.name === m.mentorName) || { mobile: m.mentorMobile || 'N/A' };

                return `
                  <tr>
                    <td style="font-weight: 700;">
                      <i class="fa-solid fa-child" style="color: var(--gold-primary); margin-right: 6px;"></i> ${m.juniorName}
                    </td>
                    <td>
                      <a href="tel:${juniorMember.mobile}" style="color: var(--text-primary); font-weight: 600; text-decoration: none;">
                        <i class="fa-solid fa-phone" style="color: #3B82F6; margin-right: 4px;"></i> ${juniorMember.mobile}
                      </a>
                    </td>
                    <td style="font-weight: 700; color: #10B981;">
                      <i class="fa-solid fa-user-tie" style="margin-right: 6px;"></i> ${m.mentorName}
                    </td>
                    <td>
                      <a href="tel:${mentorMember.mobile}" style="color: var(--text-primary); font-weight: 600; text-decoration: none;">
                        <i class="fa-solid fa-phone" style="color: #10B981; margin-right: 4px;"></i> ${mentorMember.mobile}
                      </a>
                    </td>
                    ${authService.isECOfficer() ? `
                      <td>
                        <button class="btn btn-outline remove-mentor-btn" data-id="${m.id}" style="padding: 4px 10px; font-size: 0.78rem; color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
                          <i class="fa-solid fa-trash-can"></i> Remove
                        </button>
                      </td>
                    ` : ''}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
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
          <label class="form-label required">Select Mentee (Junior Member)</label>
          <select id="asg-junior" class="form-select" required>
            <option value="">-- Select Mentee --</option>
            ${members.map(m => `
              <option value="${m.id}" data-name="${m.name}" data-mobile="${m.mobile}">
                ${m.name} (Contact: ${m.mobile})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Select Mentor</label>
          <select id="asg-mentor" class="form-select" required>
            <option value="">-- Select Mentor --</option>
            ${members.map(m => `
              <option value="${m.id}" data-name="${m.name}" data-mobile="${m.mobile}">
                ${m.name} (Contact: ${m.mobile})
              </option>
            `).join('')}
          </select>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 14px; height: 46px;">
          <i class="fa-solid fa-handshake-angle"></i> Assign Mentor
        </button>
      </form>
    `;

    openModal('Assign Mentor', modalHtml);

    document.getElementById('assign-mentor-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const juniorSelect = document.getElementById('asg-junior');
      const mentorSelect = document.getElementById('asg-mentor');

      const juniorId = juniorSelect.value;
      const mentorId = mentorSelect.value;

      if (!juniorId || !mentorId) {
        showToast('Please select both a Mentee and a Mentor.', 'error');
        return;
      }

      if (juniorId === mentorId) {
        showToast('Mentee and Mentor cannot be the same member.', 'error');
        return;
      }

      const juniorOption = juniorSelect.options[juniorSelect.selectedIndex];
      const mentorOption = mentorSelect.options[mentorSelect.selectedIndex];

      const juniorName = juniorOption.getAttribute('data-name');
      const juniorMobile = juniorOption.getAttribute('data-mobile');
      const mentorName = mentorOption.getAttribute('data-name');
      const mentorMobile = mentorOption.getAttribute('data-mobile');

      dbService.addMentorAssignment({
        juniorId,
        juniorName,
        juniorMobile,
        mentorId,
        mentorName,
        mentorMobile,
        assignedBy: authService.getCurrentUser()?.name || 'President'
      });

      showToast(`Assigned ${mentorName} as mentor to ${juniorName}!`, 'success');
      closeModal();
      renderMentorsView('All');
    });
  });

  document.querySelectorAll('.remove-mentor-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      dbService.removeMentorAssignment(id);
      showToast('Mentor assignment removed.', 'info');
      renderMentorsView('All');
    });
  });
}
