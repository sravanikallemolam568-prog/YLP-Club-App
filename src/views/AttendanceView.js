// Attendance Sheet View with Bulk Actions and Filtered Excel Export

import { dbService } from '../services/dbService.js';
import { ExcelService } from '../services/excelService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderAttendanceView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  if (branchFilter !== 'All') {
    meetings = meetings.filter(m => m.branch === branchFilter);
  }

  const selectedMeeting = meetings[0] || dbService.getMeetings()[0];

  setTimeout(() => {
    bindAttendanceEvents(selectedMeeting);
  }, 50);

  if (!selectedMeeting) {
    return `<div class="card"><p>No meetings scheduled for attendance.</p></div>`;
  }

  let members = dbService.getMembers();
  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
  }

  const attendanceRecords = dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id);
  const getMemberStatus = (mId) => {
    const found = attendanceRecords.find(r => r.memberId === mId);
    return found ? found.status : 'Present';
  };

  const presentCount = members.filter(m => getMemberStatus(m.id) === 'Present').length;
  const informedCount = members.filter(m => getMemberStatus(m.id) === 'Informed Absent').length;
  const uninformedCount = members.filter(m => getMemberStatus(m.id) === 'Uninformed Absent').length;
  const attendancePct = members.length > 0 ? Math.round((presentCount / members.length) * 100) : 0;

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-clipboard-user" style="color: var(--gold-primary);"></i> Attendance Sheet</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Meeting-based attendance tracking, bulk actions, and Excel report export.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="export-attendance-excel-btn" class="btn btn-outline">
            <i class="fa-solid fa-file-excel" style="color: #10B981;"></i> Export Attendance Excel
          </button>
        </div>
      </div>

      <!-- Meeting Selector Bar & Metrics -->
      <div class="card" style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: center;">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Select Meeting</label>
            <select id="att-meeting-select" class="form-select">
              ${dbService.getMeetings().map(m => `
                <option value="${m.id}" ${m.id === selectedMeeting.id ? 'selected' : ''}>${m.date} - ${m.branch} (${m.startTime})</option>
              `).join('')}
            </select>
          </div>

          <div style="display: flex; justify-content: space-around; background: var(--badge-bg); padding: 10px; border-radius: 12px;">
            <div style="text-align: center;">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">PRESENT</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: #10B981;">${presentCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">INFORMED ABSENT</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: #F59E0B;">${informedCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">UNINFORMED</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: #EF4444;">${uninformedCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700;">ATTENDANCE %</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--gold-primary);">${attendancePct}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      ${authService.isECOfficer() ? `
        <div style="display: flex; gap: 10px; margin-bottom: 16px;">
          <button id="mark-all-present-btn" class="btn btn-outline btn-sm"><i class="fa-solid fa-check-double"></i> Mark All Present</button>
          <button id="mark-all-absent-btn" class="btn btn-outline btn-sm"><i class="fa-solid fa-xmark"></i> Mark All Absent</button>
        </div>
      ` : ''}

      <!-- Attendance List -->
      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Branch</th>
                <th>Attendance Status</th>
                <th>Quick Toggle</th>
              </tr>
            </thead>
            <tbody id="attendance-rows">
              ${members.map(m => {
                const status = getMemberStatus(m.id);
                return `
                  <tr data-member-id="${m.id}" data-member-name="${m.name}">
                    <td style="font-weight: 700;">${m.name}</td>
                    <td><span class="badge badge-gold">${m.branch}</span></td>
                    <td>
                      <span class="badge ${status === 'Present' ? 'badge-success' : status === 'Informed Absent' ? 'badge-warning' : 'badge-danger'} att-status-badge">
                        ${status}
                      </span>
                    </td>
                    <td>
                      ${authService.isECOfficer() ? `
                        <div class="btn-group" style="display: flex; gap: 4px;">
                          <button class="btn btn-sm ${status === 'Present' ? 'btn-primary' : 'btn-outline'} toggle-att-btn" data-status="Present">Present</button>
                          <button class="btn btn-sm ${status === 'Informed Absent' ? 'btn-primary' : 'btn-outline'} toggle-att-btn" data-status="Informed Absent">Informed</button>
                          <button class="btn btn-sm ${status === 'Uninformed Absent' ? 'btn-primary' : 'btn-outline'} toggle-att-btn" data-status="Uninformed Absent">Absent</button>
                        </div>
                      ` : '<span style="font-size: 0.8rem; color: var(--text-muted);">Read Only</span>'}
                    </td>
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

function bindAttendanceEvents(selectedMeeting) {
  const meetingSelect = document.getElementById('att-meeting-select');
  meetingSelect?.addEventListener('change', () => {
    const mtg = dbService.getMeetings().find(m => m.id === meetingSelect.value);
    if (mtg) renderAttendanceView(mtg.branch);
  });

  const exportBtn = document.getElementById('export-attendance-excel-btn');
  exportBtn?.addEventListener('click', () => {
    const list = dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id);
    ExcelService.exportAttendanceToExcel(list);
    showToast('Exported attendance sheet to Excel!', 'success');
  });

  document.getElementById('attendance-rows')?.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.toggle-att-btn');
    if (!toggleBtn) return;

    const row = toggleBtn.closest('tr');
    const memberId = row.dataset.memberId;
    const memberName = row.dataset.memberName;
    const newStatus = toggleBtn.dataset.status;

    let records = dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id);
    const existingIndex = records.findIndex(r => r.memberId === memberId);
    if (existingIndex >= 0) {
      records[existingIndex].status = newStatus;
    } else {
      records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId, memberName, status: newStatus, startTime: selectedMeeting.startTime });
    }

    dbService.saveAttendance(records);
    renderAttendanceView(selectedMeeting.branch);
    showToast(`Updated ${memberName} status to ${newStatus}`, 'info');
  });
}
