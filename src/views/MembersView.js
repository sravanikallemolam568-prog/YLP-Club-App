// Members View with Multi-Filters, Validation, Excel Export, Add/Edit Member Modal

import { dbService } from '../services/dbService.js';
import { ExcelService } from '../services/excelService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderMembersView(branchFilter = 'All') {
  let members = dbService.getMembers();

  // Attach event handlers after DOM render
  setTimeout(() => {
    bindMembersEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <!-- Combined Module Tabs -->
      <div style="display:flex; gap:0; margin-bottom:24px; border-bottom:2px solid #DADCE0;">
        <a href="#members"
           style="padding:10px 18px; font-size:0.875rem; font-weight:700; color:#4285F4; border-bottom:3px solid #4285F4; margin-bottom:-2px; text-decoration:none; display:flex; align-items:center; gap:7px; background:#F8F9FA;">
          <i class="fa-solid fa-users"></i> Members
        </a>
        <a href="#attendance"
           style="padding:10px 18px; font-size:0.875rem; font-weight:600; color:var(--text-secondary); border-bottom:3px solid transparent; margin-bottom:-2px; text-decoration:none; display:flex; align-items:center; gap:7px; transition:all 0.15s;">
          <i class="fa-solid fa-clipboard-user"></i> Attendance
        </a>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-users" style="color: var(--gold-primary);"></i> Club Members</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage, register, search and filter PSS Miyapur Gavel Club members.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          ${!authService.isReadOnly() ? `<button id="export-members-excel-btn" class="btn btn-outline">
            <i class="fa-solid fa-download" style="color: #34A853;"></i> Download List
          </button>` : ''}
          ${authService.isECOfficer() ? `
            <button id="add-member-btn" class="btn btn-primary">
              <i class="fa-solid fa-user-plus"></i> Add Member
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Multi-Filter Bar -->
      <div class="filter-bar">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Search Member</label>
          <input type="text" id="filter-search" class="form-input" placeholder="Search by name, ID or mobile..." />
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Branch Filter</label>
          <select id="filter-branch" class="form-select">
            <option value="All" ${branchFilter === 'All' ? 'selected' : ''}>All Branches</option>
            <option value="Miyapur" ${branchFilter === 'Miyapur' ? 'selected' : ''}>Miyapur</option>
            <option value="GHMC" ${branchFilter === 'GHMC' ? 'selected' : ''}>GHMC</option>
            <option value="MKR" ${branchFilter === 'MKR' ? 'selected' : ''}>MKR</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Speech Progress</label>
          <select id="filter-progress" class="form-select">
            <option value="All">All Speeches</option>
            <option value="0-2">0 - 2 Speeches</option>
            <option value="3-5">3 - 5 Speeches</option>
            <option value="6-9">6 - 9 Speeches</option>
            <option value="10">10 Speeches Completed</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Membership Status</label>
          <select id="filter-status" class="form-select">
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div>
          <button id="clear-filters-btn" class="btn btn-outline" style="width: 100%; height: 46px;">
            <i class="fa-solid fa-filter-circle-xmark"></i> Clear Filters
          </button>
        </div>
      </div>

      <!-- Members Grid / Table -->
      <div id="members-list-container">
        ${renderMemberListHtml(members, branchFilter)}
      </div>
    </div>
  `;
}

function renderMemberListHtml(membersList, branchFilter = 'All') {
  let filtered = membersList;
  if (branchFilter !== 'All') {
    filtered = filtered.filter(m => m.branch === branchFilter);
  }

  if (filtered.length === 0) {
    return `<div class="card" style="text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
      <p>No members found matching the selected filters.</p>
    </div>`;
  }

  return `
    <div class="table-container members-table-wrap">
      <table class="data-table members-table">
        <thead><tr><th>Member</th><th>Contact</th><th>Branch</th><th>Status</th><th>Education</th><th>Mentor</th><th>Speech Progress</th><th>Action</th></tr></thead>
        <tbody>
          ${filtered.map(m => `
            <tr>
              <td><div class="member-table-name"><span class="table-avatar">${m.name.charAt(0)}</span><div><strong>${m.name}</strong><small>ID: ${m.id}</small></div></div></td>
              <td><span class="table-detail"><i class="fa-solid fa-phone"></i>${m.mobile}</span></td>
              <td><span class="badge badge-info">${m.branch}</span></td>
              <td><span class="badge ${m.status === 'Active' ? 'badge-success' : 'badge-warning'}">${m.status}</span></td>
              <td><strong>${m.classYear}</strong><small class="table-muted">${m.schoolCollege}</small></td>
              <td><span class="table-detail"><i class="fa-solid fa-user-graduate"></i>${m.mentor || 'None'}</span></td>
              <td><div class="member-speech-progress"><strong>${m.speechesCompleted || 0}/10</strong><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${(m.speechesCompleted || 0) * 10}%"></div></div></div></td>
              <td>${!authService.isReadOnly() ? `<button class="btn btn-outline btn-delete-member" data-id="${m.id}" data-name="${m.name}" style="padding: 6px 10px; font-size: 0.75rem; color: #EF4444; border-color: rgba(239, 68, 68, 0.3);"><i class="fa-solid fa-trash-can"></i> Remove</button>` : '<span class="table-muted">View only</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindMembersEvents() {
  const searchInput = document.getElementById('filter-search');
  const branchSelect = document.getElementById('filter-branch');
  const progressSelect = document.getElementById('filter-progress');
  const statusSelect = document.getElementById('filter-status');
  const clearBtn = document.getElementById('clear-filters-btn');
  const exportBtn = document.getElementById('export-members-excel-btn');
  const addBtn = document.getElementById('add-member-btn');

  const applyFilters = () => {
    let list = dbService.getMembers();
    const query = searchInput?.value.toLowerCase() || '';
    const branch = branchSelect?.value || 'All';
    const progress = progressSelect?.value || 'All';
    const status = statusSelect?.value || 'All';

    if (query) {
      list = list.filter(m => m.name.toLowerCase().includes(query) || m.id.toLowerCase().includes(query) || m.mobile.includes(query));
    }
    if (branch !== 'All') {
      list = list.filter(m => m.branch === branch);
    }
    if (status !== 'All') {
      list = list.filter(m => m.status === status);
    }
    if (progress !== 'All') {
      if (progress === '0-2') list = list.filter(m => (m.speechesCompleted || 0) <= 2);
      else if (progress === '3-5') list = list.filter(m => (m.speechesCompleted || 0) >= 3 && (m.speechesCompleted || 0) <= 5);
      else if (progress === '6-9') list = list.filter(m => (m.speechesCompleted || 0) >= 6 && (m.speechesCompleted || 0) <= 9);
      else if (progress === '10') list = list.filter(m => (m.speechesCompleted || 0) === 10);
    }

    const container = document.getElementById('members-list-container');
    if (container) {
      container.innerHTML = renderMemberListHtml(list, 'All');
      bindDeleteMemberEvents();
    }
  };

  const bindDeleteMemberEvents = () => {
    document.querySelectorAll('.btn-delete-member').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const name = e.currentTarget.getAttribute('data-name');
        
        const confirmHtml = `
          <div style="text-align: center; padding: 10px 0;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #EF4444; margin-bottom: 12px;"></i>
            <h3 style="margin-bottom: 8px;">Remove Member?</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px; font-size: 0.95rem;">
              Are you sure you want to remove <strong>${name}</strong> (ID: ${id}) from PSS Miyapur Gavel Club? This action cannot be undone.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              <button id="cancel-delete-member-btn" class="btn btn-outline" style="flex: 1;">Cancel</button>
              <button id="confirm-delete-member-btn" class="btn" style="flex: 1; background: #EF4444; color: white;">
                <i class="fa-solid fa-trash-can"></i> Yes, Remove
              </button>
            </div>
          </div>
        `;

        openModal('Confirm Member Removal', confirmHtml);

        document.getElementById('cancel-delete-member-btn')?.addEventListener('click', () => {
          closeModal();
        });

        document.getElementById('confirm-delete-member-btn')?.addEventListener('click', () => {
          dbService.deleteMember(id);
          showToast(`Member ${name} removed successfully!`, 'success');
          closeModal();
          applyFilters();
        });
      });
    });
  };

  bindDeleteMemberEvents();

  searchInput?.addEventListener('input', applyFilters);
  branchSelect?.addEventListener('change', applyFilters);
  progressSelect?.addEventListener('change', applyFilters);
  statusSelect?.addEventListener('change', applyFilters);

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (branchSelect) branchSelect.value = 'All';
    if (progressSelect) progressSelect.value = 'All';
    if (statusSelect) statusSelect.value = 'All';
    applyFilters();
  });

  exportBtn?.addEventListener('click', () => {
    const members = dbService.getMembers();
    ExcelService.exportMembersToExcel(members);
    showToast('Exported members to Excel file!', 'success');
  });

  addBtn?.addEventListener('click', () => {
    openRegisterMemberModal();
  });
}

function openRegisterMemberModal() {
  const mentors = dbService.getMembers();
  const modalHtml = `
    <form id="register-member-form">
      <div class="form-group">
        <label class="form-label required">Full Name</label>
        <input type="text" id="reg-name" class="form-input" placeholder="Enter full name" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Mobile Number (10-Digit Indian)</label>
        <input type="tel" id="reg-mobile" class="form-input" placeholder="e.g. 9876543210" maxlength="10" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Class / Year</label>
        <input type="text" id="reg-class" class="form-input" placeholder="e.g. 10th / 2026" required />
      </div>
      <div class="form-group">
        <label class="form-label required">School / College</label>
        <input type="text" id="reg-school" class="form-input" placeholder="e.g. Delhi Public School" required />
      </div>
      <div class="form-group">
        <label class="form-label required">Branch</label>
        <select id="reg-branch" class="form-select" required>
          <option value="Miyapur">Miyapur</option>
          <option value="GHMC">GHMC</option>
          <option value="MKR">MKR</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Mentor (Optional during Registration)</label>
        <select id="reg-mentor" class="form-select">
          <option value="None">None</option>
          ${mentors.map(m => `<option value="${m.name}">${m.name} (${m.branch})</option>`).join('')}
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
        <i class="fa-solid fa-check"></i> Register Member
      </button>
    </form>
  `;

  openModal('Register New Gavel Club Member', modalHtml);

  document.getElementById('register-member-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const classYear = document.getElementById('reg-class').value.trim();
    const schoolCollege = document.getElementById('reg-school').value.trim();
    const branch = document.getElementById('reg-branch').value;
    const mentor = document.getElementById('reg-mentor').value;

    // Mobile Validation (10 Digit Indian)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      showToast('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    if (!name || !classYear || !schoolCollege) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    dbService.addMember({ name, mobile, classYear, schoolCollege, branch, mentor });
    showToast(`Registered member ${name} successfully!`, 'success');
    closeModal();
    // Refresh list
    const container = document.getElementById('members-list-container');
    if (container) container.innerHTML = renderMemberListHtml(dbService.getMembers(), 'All');
  });
}
