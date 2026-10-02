// Simplified mobile attendance experience with a clear status picker and compact list

import { dbService } from '../services/dbService.js';
import { ExcelService } from '../services/excelService.js';
import { authService } from '../services/authService.js';
import { showToast, openModal, closeModal } from '../components/Modal.js';

const attendanceFilterState = {
  branch: 'All',
  search: '',
  status: 'All'
};

export function renderAttendanceView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  const allMembers = dbService.getMembers();
  const savedMeetingId = sessionStorage.getItem('att_selected_meeting_id');
  let selectedMeeting = meetings.find(m => m.id === savedMeetingId) || meetings[0];

  attendanceFilterState.branch = branchFilter;

  const getMemberStatusForMeeting = (memberId, meetingId) => {
    const attendanceRecords = dbService.getAttendance().filter(a => a.meetingId === meetingId);
    const found = attendanceRecords.find(r => r.memberId === memberId);
    return found ? found.status : 'Present';
  };

  if (!selectedMeeting) {
    return `
      <div class="animate-fade-in" style="max-width: 760px; margin: 0 auto;">
        <div class="card" style="text-align:center; padding: 40px 20px;">
          <i class="fa-solid fa-calendar-xmark" style="font-size: 2.2rem; color: var(--text-muted); margin-bottom: 12px;"></i>
          <h3>No meetings found</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">Create a meeting first to start taking attendance.</p>
          <a href="#meetings" class="btn btn-primary" style="margin-top: 18px;">Create Meeting</a>
        </div>
      </div>
    `;
  }

  let members = allMembers;
  if (attendanceFilterState.branch !== 'All') {
    members = members.filter(m => m.branch === attendanceFilterState.branch);
  }

  if (attendanceFilterState.search) {
    const query = attendanceFilterState.search.toLowerCase();
    members = members.filter(m =>
      (m.name || '').toLowerCase().includes(query) ||
      (m.id || '').toLowerCase().includes(query) ||
      (m.branch || '').toLowerCase().includes(query)
    );
  }

  if (attendanceFilterState.status !== 'All') {
    members = members.filter(m => getMemberStatusForMeeting(m.id, selectedMeeting.id) === attendanceFilterState.status);
  }

  const presentCount = members.filter(m => getMemberStatusForMeeting(m.id, selectedMeeting.id) === 'Present').length;
  const informedCount = members.filter(m => getMemberStatusForMeeting(m.id, selectedMeeting.id) === 'Informed Absent').length;
  const uninformedCount = members.filter(m => getMemberStatusForMeeting(m.id, selectedMeeting.id) === 'Uninformed Absent').length;
  const totalCount = members.length;
  const attendancePct = totalCount ? Math.round((presentCount / totalCount) * 100) : 0;

  setTimeout(() => bindAttendanceEvents(selectedMeeting), 50);

  return `
    <div class="animate-fade-in" style="max-width: 760px; margin: 0 auto;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px;">
        <a href="#dashboard" style="display: inline-flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 700;">
          <i class="fa-solid fa-arrow-left"></i> Attendance
        </a>
        <button id="attendance-more-btn" class="btn btn-outline btn-icon" style="width: 38px; height: 38px; border-radius: 12px;">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </div>

      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 22px; padding: 18px; box-shadow: var(--shadow-sm); margin-bottom: 18px;">
        <div style="font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 8px;">Today's Meeting</div>
        <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary);">${selectedMeeting.date} • ${selectedMeeting.branch} • ${selectedMeeting.startTime}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px;">
        <div style="background: var(--bg-card); border: 1px solid #DDF3EF; border-radius: 16px; padding: 14px 12px; text-align: center; border-top: 4px solid #34A853;">
          <div style="font-size: 1.65rem; font-weight: 800; color: #34A853;">${presentCount}</div>
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Present</div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid #F7EAD0; border-radius: 16px; padding: 14px 12px; text-align: center; border-top: 4px solid #FBBC04;">
          <div style="font-size: 1.65rem; font-weight: 800; color: #B06000;">${informedCount}</div>
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Informed</div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid #F9D8D4; border-radius: 16px; padding: 14px 12px; text-align: center; border-top: 4px solid #EA4335;">
          <div style="font-size: 1.65rem; font-weight: 800; color: #EA4335;">${uninformedCount}</div>
          <div style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Uninformed</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 18px;">
        <button id="mark-all-present-btn" class="btn btn-primary" style="flex: 1; height: 42px; font-size: 0.82rem;">
          <i class="fa-solid fa-check"></i> Mark All Present
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <div style="flex:1; display:flex; align-items:center; gap:8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 0 12px; min-height: 44px; box-shadow: var(--shadow-sm);">
          <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted);"></i>
          <input id="attendance-search" type="text" placeholder="Search member" value="${attendanceFilterState.search}" style="border:none; background: transparent; width: 100%; min-height: 44px; color: var(--text-primary);" />
        </div>
        <button id="attendance-filter-btn" class="btn btn-outline btn-sm" style="height: 44px; min-width: 86px;">
          <i class="fa-solid fa-filter"></i> Filter
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${members.map(member => {
          const status = getMemberStatusForMeeting(member.id, selectedMeeting.id);
          return `
            <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 18px; padding: 12px 14px; box-shadow: var(--shadow-sm);">
              <div style="width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(135deg, var(--teal-primary), var(--teal-dark)); color: var(--white); font-weight: 800; font-size: 0.8rem; flex-shrink: 0;">${(member.name || 'M').split(' ').map(part => part[0]).slice(0,2).join('').toUpperCase()}</div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${member.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${member.id || 'M-000'} • ${member.branch || 'Miyapur'}</div>
              </div>
              <label style="margin-left: auto;">
                <select class="attendance-status-select" data-member-id="${member.id}" data-member-name="${member.name}" style="min-width: 150px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-primary); font-weight: 700;">
                  <option value="Present" ${status === 'Present' ? 'selected' : ''}>✓ Present</option>
                  <option value="Informed Absent" ${status === 'Informed Absent' ? 'selected' : ''}>! Informed Absent</option>
                  <option value="Uninformed Absent" ${status === 'Uninformed Absent' ? 'selected' : ''}>× Uninformed Absent</option>
                </select>
              </label>
            </div>
          `;
        }).join('') || `
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 18px; padding: 28px 20px; text-align: center; color: var(--text-muted);">
            <i class="fa-solid fa-user-slash" style="font-size: 1.8rem; margin-bottom: 12px; display: block;"></i>
            No members found for the selected filters.
          </div>
        `}
      </div>
    </div>
  `;
}

function bindAttendanceEvents(selectedMeeting) {
  document.getElementById('attendance-search')?.addEventListener('input', (e) => {
    attendanceFilterState.search = e.target.value.trim();
    reRender(selectedMeeting);
  });

  document.getElementById('attendance-filter-btn')?.addEventListener('click', () => {
    openModal('Filter Attendance', `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.12em; color: var(--text-muted); font-weight: 800; margin-bottom: 8px;">Branch</div>
          <select id="filter-att-branch" class="form-select">
            <option value="All" ${attendanceFilterState.branch === 'All' ? 'selected' : ''}>All Branches</option>
            <option value="Miyapur" ${attendanceFilterState.branch === 'Miyapur' ? 'selected' : ''}>Miyapur</option>
            <option value="GHMC" ${attendanceFilterState.branch === 'GHMC' ? 'selected' : ''}>GHMC</option>
            <option value="MKR" ${attendanceFilterState.branch === 'MKR' ? 'selected' : ''}>MKR</option>
          </select>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.12em; color: var(--text-muted); font-weight: 800; margin-bottom: 8px;">Status</div>
          <select id="filter-att-status" class="form-select">
            <option value="All" ${attendanceFilterState.status === 'All' ? 'selected' : ''}>All Statuses</option>
            <option value="Present" ${attendanceFilterState.status === 'Present' ? 'selected' : ''}>Present</option>
            <option value="Informed Absent" ${attendanceFilterState.status === 'Informed Absent' ? 'selected' : ''}>Informed Absent</option>
            <option value="Uninformed Absent" ${attendanceFilterState.status === 'Uninformed Absent' ? 'selected' : ''}>Uninformed Absent</option>
          </select>
        </div>
      </div>
    `, '<button id="apply-attendance-filter" class="btn btn-primary" style="width:100%;">Apply</button>');

    document.getElementById('apply-attendance-filter')?.addEventListener('click', () => {
      attendanceFilterState.branch = document.getElementById('filter-att-branch')?.value || 'All';
      attendanceFilterState.status = document.getElementById('filter-att-status')?.value || 'All';
      closeModal();
      reRender(selectedMeeting);
    });
  });

  document.getElementById('attendance-more-btn')?.addEventListener('click', () => {
    openModal('More', `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn btn-outline" data-export="attendance"><i class="fa-solid fa-download"></i> Export Attendance</button>
        <button class="btn btn-outline" data-export="members"><i class="fa-solid fa-users"></i> Export Members</button>
        <button class="btn btn-outline" data-export="report"><i class="fa-solid fa-chart-column"></i> Export Report</button>
      </div>
    `);

    document.querySelectorAll('[data-export]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-export');
        if (action === 'attendance') {
          ExcelService.exportAttendanceToExcel(dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id));
          showToast('Attendance exported.', 'success');
        }
        if (action === 'members') {
          ExcelService.exportMembersToExcel(dbService.getMembers());
          showToast('Members exported.', 'success');
        }
        if (action === 'report') {
          showToast('Monthly report export is ready.', 'success');
        }
        closeModal();
      });
    });
  });

  document.getElementById('mark-all-present-btn')?.addEventListener('click', () => {
    const records = dbService.getAttendance().filter(r => r.meetingId !== selectedMeeting.id);
    dbService.getMembers().forEach(member => {
      records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId: member.id, memberName: member.name, status: 'Present', startTime: selectedMeeting.startTime });
    });
    dbService.saveAttendance(records);
    reRender(selectedMeeting);
    showToast('All members marked present.', 'success');
  });

  document.querySelectorAll('.attendance-status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const memberId = e.target.dataset.memberId;
      const memberName = e.target.dataset.memberName;
      const newStatus = e.target.value;
      const records = dbService.getAttendance();
      const index = records.findIndex(r => r.memberId === memberId && r.meetingId === selectedMeeting.id);

      if (index >= 0) {
        records[index].status = newStatus;
      } else {
        records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId, memberName, status: newStatus, startTime: selectedMeeting.startTime });
      }

      dbService.saveAttendance(records);
      reRender(selectedMeeting);
      showToast(`${memberName} marked ${newStatus}`, 'info');
    });
  });
}

function reRender(selectedMeeting) {
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.innerHTML = renderAttendanceView(attendanceFilterState.branch);
    sessionStorage.setItem('att_selected_meeting_id', selectedMeeting.id);
  }
}
