// Members View with simplified WhatsApp-style list and details sheet

import { dbService } from '../services/dbService.js';
import { ExcelService } from '../services/excelService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

let memberFilterState = {
  branch: 'All',
  status: 'All',
  speech: 'All',
  search: ''
};

export function renderMembersView(branchFilter = 'All') {
  memberFilterState = {
    branch: branchFilter,
    status: 'All',
    speech: 'All',
    search: ''
  };

  setTimeout(() => {
    bindMembersEvents();
  }, 50);

  return `
    <div class="animate-fade-in members-simple-page">
      <div class="simple-tabs">
        <a href="#members" class="simple-tab active"><i class="fa-solid fa-users"></i> Members</a>
        <a href="#attendance" class="simple-tab"><i class="fa-solid fa-clipboard-user"></i> Attendance</a>
      </div>

      <div class="simple-header">
        <h2>Members</h2>
        ${authService.isECOfficer() ? `
          <button id="add-member-btn" class="btn btn-primary btn-sm">
            <i class="fa-solid fa-plus"></i> Add Member
          </button>
        ` : ''}
      </div>

      <div class="simple-search-row">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" id="member-search" placeholder="Search members" />
        </div>
        <button id="member-filter-btn" class="btn btn-outline btn-sm">
          <i class="fa-solid fa-filter"></i> Filter
        </button>
      </div>

      <div id="members-list-container"></div>
    </div>
  `;
}

function getFilteredMembers(list, filters = memberFilterState) {
  let filtered = [...list];

  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(member =>
      member.name.toLowerCase().includes(query) ||
      (member.id && member.id.toLowerCase().includes(query)) ||
      (member.mobile && member.mobile.includes(query))
    );
  }

  if (filters.branch && filters.branch !== 'All') {
    filtered = filtered.filter(member => member.branch === filters.branch);
  }

  if (filters.status && filters.status !== 'All') {
    filtered = filtered.filter(member => member.status === filters.status);
  }

  if (filters.speech && filters.speech !== 'All') {
    const score = member => member.speechesCompleted || 0;
    if (filters.speech === '0-2') filtered = filtered.filter(member => score(member) <= 2);
    else if (filters.speech === '3-5') filtered = filtered.filter(member => score(member) >= 3 && score(member) <= 5);
    else if (filters.speech === '6-9') filtered = filtered.filter(member => score(member) >= 6 && score(member) <= 9);
    else if (filters.speech === '10') filtered = filtered.filter(member => score(member) === 10);
  }

  return filtered;
}

function buildInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'M';
}

function renderMemberListHtml(membersList) {
  if (!membersList.length) {
    return `
      <div class="simple-empty-state">
        <i class="fa-solid fa-users-slash"></i>
        <p>No members match your search.</p>
      </div>
    `;
  }

  return `
    <div class="member-list">
      ${membersList.map(member => {
        const statusClass = member.status === 'Active' ? 'status-dot active' : 'status-dot inactive';
        const statusText = member.status || 'Active';
        const branchText = member.branch || 'Miyapur';

        return `
          <div class="member-chat-row" data-member-id="${member.id}" tabindex="0" role="button" aria-label="Open details for ${member.name}">
            <div class="member-avatar">${buildInitials(member.name)}</div>
            <div class="member-details">
              <div class="member-title-line">
                <span class="member-name">${member.name}</span>
                <span class="${statusClass}"></span>
              </div>
              <div class="member-meta">${member.id} • ${branchText}</div>
            </div>
            <div class="member-arrow"><i class="fa-solid fa-chevron-right"></i></div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderMembersList() {
  const container = document.getElementById('members-list-container');
  if (!container) return;

  const list = getFilteredMembers(dbService.getMembers(), memberFilterState);
  container.innerHTML = renderMemberListHtml(list);

  container.querySelectorAll('.member-chat-row').forEach(row => {
    row.addEventListener('click', () => {
      const memberId = row.getAttribute('data-member-id');
      const member = dbService.getMembers().find(item => item.id === memberId);
      if (member) openMemberDetails(member);
    });
  });
}

function bindMembersEvents() {
  const searchInput = document.getElementById('member-search');
  const filterBtn = document.getElementById('member-filter-btn');
  const addBtn = document.getElementById('add-member-btn');

  searchInput?.addEventListener('input', (e) => {
    memberFilterState.search = e.target.value.trim();
    renderMembersList();
  });

  filterBtn?.addEventListener('click', () => {
    openMemberFilterSheet();
  });

  addBtn?.addEventListener('click', () => {
    openRegisterMemberModal();
  });

  const exportBtn = document.getElementById('export-members-excel-btn');
  exportBtn?.addEventListener('click', () => {
    ExcelService.exportMembersToExcel(dbService.getMembers());
    showToast('Members exported successfully.', 'success');
  });

  renderMembersList();
}

function openMemberDetails(member) {
  const speechCount = member.speechesCompleted || 0;
  const percent = Math.min((speechCount / 10) * 100, 100);
  const attendance = dbService.getAttendance().filter(item => item.memberId === member.id);
  const present = attendance.filter(item => item.status === 'Present').length;
  const absent = attendance.filter(item => item.status !== 'Present').length;

  const body = `
    <div class="member-details-sheet">
      <div class="member-details-header">
        <div class="member-avatar large">${buildInitials(member.name)}</div>
        <div>
          <h3>${member.name}</h3>
          <div class="detail-subtitle">${member.id}</div>
          <span class="badge ${member.status === 'Active' ? 'badge-success' : 'badge-warning'}">${member.status || 'Active'}</span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Contact</div>
        <div class="detail-row"><i class="fa-solid fa-phone"></i> ${member.mobile || 'Not available'}</div>
      </div>

      <div class="detail-section two-up">
        <div>
          <div class="detail-label">Branch</div>
          <div class="detail-row"><i class="fa-solid fa-location-dot"></i> ${member.branch || 'Miyapur'}</div>
        </div>
        <div>
          <div class="detail-label">Mentor</div>
          <div class="detail-row"><i class="fa-solid fa-user-graduate"></i> ${member.mentor || 'Not assigned'}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Education</div>
        <div class="detail-row"><i class="fa-solid fa-graduation-cap"></i> ${member.classYear || 'N/A'}</div>
        <div class="detail-row muted">${member.schoolCollege || 'Not added'}</div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Speech Progress</div>
        <div class="progress-topline">
          <span>${speechCount} / 10</span>
          <small>${Math.round(percent)}%</small>
        </div>
        <div class="simple-progress"><span style="width:${percent}%"></span></div>
      </div>

      <div class="detail-section">
        <div class="detail-label">Attendance</div>
        <div class="attendance-stats">
          <div><strong>${present}</strong><span>Present</span></div>
          <div><strong>${absent}</strong><span>Absent</span></div>
        </div>
      </div>
    </div>
  `;

  const footer = `
    <div class="detail-action-row">
      <button class="btn btn-outline btn-sm" data-action="edit"><i class="fa-solid fa-pen"></i> Edit</button>
      <button class="btn btn-outline btn-sm" data-action="attendance"><i class="fa-solid fa-clipboard-user"></i> Attendance</button>
      <button class="btn btn-outline btn-sm" data-action="speeches"><i class="fa-solid fa-scroll"></i> Speeches</button>
      <button class="btn btn-danger btn-sm" data-action="delete"><i class="fa-solid fa-trash"></i> Delete</button>
    </div>
  `;

  openModal(member.name, body, footer);

  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      if (action === 'delete') {
        const confirmHtml = `
          <div class="simple-confirm-box">
            <p>Remove ${member.name} from the club list?</p>
            <div class="detail-action-row">
              <button id="cancel-delete-member-btn" class="btn btn-outline btn-sm">Cancel</button>
              <button id="confirm-delete-member-btn" class="btn btn-danger btn-sm">Delete</button>
            </div>
          </div>
        `;
        openModal('Delete Member', confirmHtml);
        document.getElementById('cancel-delete-member-btn')?.addEventListener('click', closeModal);
        document.getElementById('confirm-delete-member-btn')?.addEventListener('click', () => {
          dbService.deleteMember(member.id);
          closeModal();
          renderMembersList();
          showToast(`${member.name} removed.`, 'success');
        });
      } else if (action === 'attendance') {
        closeModal();
        window.location.hash = '#attendance';
      } else if (action === 'speeches') {
        closeModal();
        window.location.hash = '#speeches';
      } else if (action === 'edit') {
        closeModal();
        openRegisterMemberModal(member);
      }
    });
  });
}

function openMemberFilterSheet() {
  const body = `
    <div class="filter-sheet">
      <div class="filter-group">
        <div class="filter-label">Branch</div>
        <div class="filter-options">
          ${['All', 'Miyapur', 'GHMC', 'MKR'].map(option => `
            <label class="filter-option"><input type="radio" name="memberBranch" value="${option}" ${memberFilterState.branch === option ? 'checked' : ''} /> ${option}</label>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">Status</div>
        <div class="filter-options">
          ${['All', 'Active', 'Inactive'].map(option => `
            <label class="filter-option"><input type="radio" name="memberStatus" value="${option}" ${memberFilterState.status === option ? 'checked' : ''} /> ${option}</label>
          `).join('')}
        </div>
      </div>
      <div class="filter-group">
        <div class="filter-label">Speech</div>
        <div class="filter-options">
          ${['All', '0-2', '3-5', '6-9', '10'].map(option => `
            <label class="filter-option"><input type="radio" name="memberSpeech" value="${option}" ${memberFilterState.speech === option ? 'checked' : ''} /> ${option}</label>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const footer = `<button id="apply-member-filter" class="btn btn-primary" style="width:100%;">Apply Filter</button>`;
  openModal('Filter Members', body, footer);

  document.getElementById('apply-member-filter')?.addEventListener('click', () => {
    const selectedBranch = document.querySelector('input[name="memberBranch"]:checked')?.value || 'All';
    const selectedStatus = document.querySelector('input[name="memberStatus"]:checked')?.value || 'All';
    const selectedSpeech = document.querySelector('input[name="memberSpeech"]:checked')?.value || 'All';

    memberFilterState.branch = selectedBranch;
    memberFilterState.status = selectedStatus;
    memberFilterState.speech = selectedSpeech;

    closeModal();
    renderMembersList();
  });
}

function openRegisterMemberModal(memberToEdit = null) {
  const mentors = dbService.getMembers();
  const isEdit = !!memberToEdit;
  const modalHtml = `
    <form id="register-member-form">
      <div class="form-group">
        <label class="form-label required">Full Name</label>
        <input type="text" id="reg-name" class="form-input" value="${memberToEdit ? memberToEdit.name : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Mobile Number</label>
        <input type="tel" id="reg-mobile" class="form-input" value="${memberToEdit ? memberToEdit.mobile : ''}" maxlength="10" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Class / Year</label>
        <input type="text" id="reg-class" class="form-input" value="${memberToEdit ? memberToEdit.classYear : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label required">School / College</label>
        <input type="text" id="reg-school" class="form-input" value="${memberToEdit ? memberToEdit.schoolCollege : ''}" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Branch</label>
        <select id="reg-branch" class="form-select">
          ${['Miyapur', 'GHMC', 'MKR'].map(branch => `<option value="${branch}" ${memberToEdit && memberToEdit.branch === branch ? 'selected' : ''}>${branch}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Mentor</label>
        <select id="reg-mentor" class="form-select">
          <option value="None">None</option>
          ${mentors.map(m => `<option value="${m.name}" ${memberToEdit && memberToEdit.mentor === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
        <i class="fa-solid ${isEdit ? 'fa-pen' : 'fa-check'}"></i> ${isEdit ? 'Save Changes' : 'Register Member'}
      </button>
    </form>
  `;

  openModal(isEdit ? 'Edit Member' : 'Register New Member', modalHtml);

  document.getElementById('register-member-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const classYear = document.getElementById('reg-class').value.trim();
    const schoolCollege = document.getElementById('reg-school').value.trim();
    const branch = document.getElementById('reg-branch').value;
    const mentor = document.getElementById('reg-mentor').value;

    if (!name || !mobile || !classYear || !schoolCollege) {
      showToast('Please fill all fields.', 'error');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (isEdit) {
      const updated = { ...memberToEdit, name, mobile, classYear, schoolCollege, branch, mentor };
      dbService.updateMember(updated);
      showToast('Member details updated.', 'success');
    } else {
      dbService.addMember({ name, mobile, classYear, schoolCollege, branch, mentor });
      showToast('Member added successfully.', 'success');
    }

    closeModal();
    renderMembersList();
  });
}

