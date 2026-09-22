// Attendance Sheet — Compact Professional UI with Google Material Design
// VPM, EC Officer, and President can all mark attendance

import { dbService } from '../services/dbService.js';
import { ExcelService } from '../services/excelService.js';
import { authService } from '../services/authService.js';
import { showToast } from '../components/Modal.js';

export function renderAttendanceView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  const allMembers = dbService.getMembers();

  const savedMeetingId = sessionStorage.getItem('att_selected_meeting_id');
  let selectedMeeting = meetings.find(m => m.id === savedMeetingId) || meetings[0];

  if (!selectedMeeting) {
    return `
      <div class="animate-fade-in">
        ${renderTabs()}
        <div class="empty-state-card">
          <div class="empty-state-icon"><i class="fa-solid fa-calendar-xmark"></i></div>
          <div class="empty-state-title">No Meetings Found</div>
          <div class="empty-state-desc">Create a meeting first to start marking attendance.</div>
          <a href="#meetings" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create Meeting</a>
        </div>
      </div>`;
  }

  let members = allMembers;
  if (branchFilter !== 'All') members = members.filter(m => m.branch === branchFilter);

  const attendanceRecords = dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id);
  const getMemberStatus = (mId) => {
    const found = attendanceRecords.find(r => r.memberId === mId);
    return found ? found.status : 'Present';
  };

  const presentCount    = members.filter(m => getMemberStatus(m.id) === 'Present').length;
  const informedCount   = members.filter(m => getMemberStatus(m.id) === 'Informed Absent').length;
  const uninformedCount = members.filter(m => getMemberStatus(m.id) === 'Uninformed Absent').length;
  const totalCount      = members.length;
  const attendancePct   = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const canMark = authService.canManageMembers() || authService.isECOfficer();

  setTimeout(() => { bindAttendanceEvents(selectedMeeting); }, 50);

  return `
    <div class="animate-fade-in">
      ${renderTabs()}

      <!-- Header Row -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
        <div>
          <h2 style="font-size:1.25rem; font-weight:700; color:var(--text-primary);">
            <i class="fa-solid fa-clipboard-user" style="color:var(--google-blue); margin-right:8px;"></i>Attendance Sheet
          </h2>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:3px;">
            Mark Present · Informed Absent · Uninformed Absent for each session
          </p>
        </div>
        <button id="export-attendance-excel-btn" class="btn btn-outline btn-sm">
          <i class="fa-solid fa-file-excel" style="color:#34A853;"></i> Export Excel
        </button>
      </div>

      <!-- Meeting Selector -->
      <div class="card" style="margin-bottom:16px; padding:14px 18px;">
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <label style="font-size:0.8rem; font-weight:600; color:var(--text-secondary); white-space:nowrap;">
            <i class="fa-solid fa-calendar-days" style="color:var(--google-blue);"></i> Session:
          </label>
          <select id="att-meeting-select" class="form-select" style="flex:1; min-width:220px; max-width:420px;">
            ${meetings.map(m => `
              <option value="${m.id}" ${m.id === selectedMeeting.id ? 'selected' : ''}>
                ${m.date} — ${m.branch} (${m.startTime})
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <!-- Stats Bar -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px;">
        <div style="background:#fff; border:1px solid #DADCE0; border-radius:10px; padding:12px 14px; text-align:center; border-top:3px solid #34A853;">
          <div style="font-size:1.5rem; font-weight:800; color:#34A853;">${presentCount}</div>
          <div style="font-size:0.7rem; font-weight:700; color:#34A853; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Present</div>
        </div>
        <div style="background:#fff; border:1px solid #DADCE0; border-radius:10px; padding:12px 14px; text-align:center; border-top:3px solid #FBBC04;">
          <div style="font-size:1.5rem; font-weight:800; color:#B06000;">${informedCount}</div>
          <div style="font-size:0.7rem; font-weight:700; color:#B06000; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Informed</div>
        </div>
        <div style="background:#fff; border:1px solid #DADCE0; border-radius:10px; padding:12px 14px; text-align:center; border-top:3px solid #EA4335;">
          <div style="font-size:1.5rem; font-weight:800; color:#EA4335;">${uninformedCount}</div>
          <div style="font-size:0.7rem; font-weight:700; color:#EA4335; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Uninformed</div>
        </div>
        <div style="background:#fff; border:1px solid #DADCE0; border-radius:10px; padding:12px 14px; text-align:center; border-top:3px solid #4285F4;">
          <div style="font-size:1.5rem; font-weight:800; color:#4285F4;">${attendancePct}%</div>
          <div style="font-size:0.7rem; font-weight:700; color:#4285F4; text-transform:uppercase; letter-spacing:0.5px; margin-top:2px;">Rate</div>
        </div>
      </div>

      <!-- Progress -->
      <div style="background:#fff; border:1px solid #DADCE0; border-radius:10px; padding:12px 16px; margin-bottom:16px; display:flex; align-items:center; gap:14px;">
        <span style="font-size:0.78rem; font-weight:600; color:var(--text-secondary); white-space:nowrap;">${presentCount}/${totalCount}</span>
        <div style="flex:1; height:8px; background:#F1F3F4; border-radius:99px; overflow:hidden;">
          <div style="height:100%; width:${attendancePct}%; background:linear-gradient(90deg,#4285F4,#34A853); border-radius:99px; transition:width 0.4s;"></div>
        </div>
        <span style="font-size:0.78rem; font-weight:700; color:#4285F4;">${attendancePct}% Present</span>
      </div>

      <!-- Bulk Actions -->
      ${canMark ? `
        <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
          <button id="mark-all-present-btn" class="btn btn-sm" style="background:#E6F4EA; border:1px solid #34A853; color:#34A853; font-weight:700;">
            <i class="fa-solid fa-check-double"></i> All Present
          </button>
          <button id="mark-all-absent-btn" class="btn btn-sm" style="background:#FCE8E6; border:1px solid #EA4335; color:#EA4335; font-weight:700;">
            <i class="fa-solid fa-xmark"></i> All Absent
          </button>
          <span style="margin-left:auto; font-size:0.78rem; color:var(--text-muted); align-self:center;">
            <i class="fa-solid fa-users"></i> ${totalCount} members
          </span>
        </div>
      ` : ''}

      <!-- Member List -->
      <div class="card" style="padding:0; overflow:hidden;">
        <!-- Table head -->
        <div style="display:grid; grid-template-columns:1fr 80px 130px ${canMark ? '1fr' : ''}; gap:0; background:#F8F9FA; border-bottom:2px solid #DADCE0; padding:10px 16px;">
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Member</div>
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Branch</div>
          <div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Status</div>
          ${canMark ? '<div style="font-size:0.72rem; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Mark</div>' : ''}
        </div>

        <!-- Rows -->
        <div id="attendance-rows">
          ${members.length === 0 ? `
            <div style="padding:32px; text-align:center; color:var(--text-muted); font-size:0.875rem;">
              <i class="fa-solid fa-users-slash" style="font-size:1.8rem; margin-bottom:10px; display:block; opacity:0.4;"></i>
              No members found for this branch.
            </div>
          ` : members.map(m => {
            const status = getMemberStatus(m.id);
            const statusCfg = {
              'Present':          { color:'#34A853', bg:'#E6F4EA', border:'#34A85344', icon:'fa-circle-check',  label:'Present' },
              'Informed Absent':  { color:'#B06000', bg:'#FEF7E0', border:'#FBBC0455', icon:'fa-bell',          label:'Informed' },
              'Uninformed Absent':{ color:'#EA4335', bg:'#FCE8E6', border:'#EA433544', icon:'fa-circle-xmark',  label:'Uninformed' }
            }[status] || { color:'#34A853', bg:'#E6F4EA', border:'#34A85344', icon:'fa-circle-check', label:'Present' };

            return `
              <div data-member-id="${m.id}" data-member-name="${m.name}"
                style="display:grid; grid-template-columns:1fr 80px 130px ${canMark ? '1fr' : ''}; gap:0; align-items:center; padding:10px 16px; border-bottom:1px solid var(--border-color); transition:background 0.12s;"
                onmouseover="this.style.background='#F8F9FA'" onmouseout="this.style.background='#fff'">

                <!-- Name -->
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, #4285F4, #34A853); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:#fff; flex-shrink:0;">
                    ${m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight:600; font-size:0.875rem; color:var(--text-primary);">${m.name}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${m.speechRole || 'Member'}</div>
                  </div>
                </div>

                <!-- Branch -->
                <div>
                  <span style="background:#E8F0FE; color:#4285F4; padding:2px 8px; border-radius:20px; font-size:0.7rem; font-weight:700;">
                    ${(m.branch || 'MYP').substring(0,3).toUpperCase()}
                  </span>
                </div>

                <!-- Status -->
                <div>
                  <span style="display:inline-flex; align-items:center; gap:4px; background:${statusCfg.bg}; border:1px solid ${statusCfg.border}; color:${statusCfg.color}; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-weight:700;">
                    <i class="fa-solid ${statusCfg.icon}" style="font-size:0.65rem;"></i> ${statusCfg.label}
                  </span>
                </div>

                <!-- Mark Buttons -->
                ${canMark ? `
                  <div style="display:flex; gap:5px; flex-wrap:wrap;">
                    <button class="toggle-att-btn" data-status="Present"
                      style="padding:4px 10px; border-radius:6px; font-size:0.72rem; font-weight:700; cursor:pointer; border:1.5px solid #34A853; background:${status==='Present'?'#34A853':'transparent'}; color:${status==='Present'?'#fff':'#34A853'}; transition:all 0.12s;">
                      <i class="fa-solid fa-check"></i> Present
                    </button>
                    <button class="toggle-att-btn" data-status="Informed Absent"
                      style="padding:4px 10px; border-radius:6px; font-size:0.72rem; font-weight:700; cursor:pointer; border:1.5px solid #FBBC04; background:${status==='Informed Absent'?'#FBBC04':'transparent'}; color:${status==='Informed Absent'?'#202124':'#B06000'}; transition:all 0.12s;">
                      <i class="fa-solid fa-bell"></i> Informed
                    </button>
                    <button class="toggle-att-btn" data-status="Uninformed Absent"
                      style="padding:4px 10px; border-radius:6px; font-size:0.72rem; font-weight:700; cursor:pointer; border:1.5px solid #EA4335; background:${status==='Uninformed Absent'?'#EA4335':'transparent'}; color:${status==='Uninformed Absent'?'#fff':'#EA4335'}; transition:all 0.12s;">
                      <i class="fa-solid fa-xmark"></i> Uninformed
                    </button>
                  </div>
                ` : `<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Read Only</span>`}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderTabs() {
  return `
    <div style="display:flex; gap:0; margin-bottom:24px; border-bottom:2px solid #DADCE0;">
      <a href="#members"
         style="padding:10px 18px; font-size:0.875rem; font-weight:600; color:var(--text-secondary); border-bottom:3px solid transparent; margin-bottom:-2px; text-decoration:none; display:flex; align-items:center; gap:7px; transition:all 0.15s;"
         onmouseover="this.style.color='#4285F4'" onmouseout="this.style.color='var(--text-secondary)'">
        <i class="fa-solid fa-users"></i> Members
      </a>
      <a href="#attendance"
         style="padding:10px 18px; font-size:0.875rem; font-weight:700; color:#4285F4; border-bottom:3px solid #4285F4; margin-bottom:-2px; text-decoration:none; display:flex; align-items:center; gap:7px; background:#F8F9FA;">
        <i class="fa-solid fa-clipboard-user"></i> Attendance
      </a>
    </div>
  `;
}

function bindAttendanceEvents(selectedMeeting) {
  document.getElementById('att-meeting-select')?.addEventListener('change', (e) => {
    const mtg = dbService.getMeetings().find(m => m.id === e.target.value);
    if (mtg) {
      sessionStorage.setItem('att_selected_meeting_id', mtg.id);
      const mainContent = document.querySelector('.main-content');
      if (mainContent) {
        mainContent.innerHTML = renderAttendanceView(mtg.branch);
        setTimeout(() => bindAttendanceEvents(mtg), 50);
      }
    }
  });

  document.getElementById('export-attendance-excel-btn')?.addEventListener('click', () => {
    const list = dbService.getAttendance().filter(a => a.meetingId === selectedMeeting.id);
    ExcelService.exportAttendanceToExcel(list);
    showToast('Attendance exported to Excel!', 'success');
  });

  document.getElementById('mark-all-present-btn')?.addEventListener('click', () => {
    const members = dbService.getMembers();
    let records = dbService.getAttendance().filter(a => a.meetingId !== selectedMeeting.id);
    members.forEach(m => records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId: m.id, memberName: m.name, status: 'Present', startTime: selectedMeeting.startTime }));
    dbService.saveAttendance(records);
    reRender(selectedMeeting);
    showToast('All members marked Present!', 'success');
  });

  document.getElementById('mark-all-absent-btn')?.addEventListener('click', () => {
    const members = dbService.getMembers();
    let records = dbService.getAttendance().filter(a => a.meetingId !== selectedMeeting.id);
    members.forEach(m => records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId: m.id, memberName: m.name, status: 'Uninformed Absent', startTime: selectedMeeting.startTime }));
    dbService.saveAttendance(records);
    reRender(selectedMeeting);
    showToast('All members marked Absent!', 'info');
  });

  document.getElementById('attendance-rows')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-att-btn');
    if (!btn) return;
    const row = btn.closest('[data-member-id]');
    if (!row) return;

    const memberId   = row.dataset.memberId;
    const memberName = row.dataset.memberName;
    const newStatus  = btn.dataset.status;

    let records = dbService.getAttendance();
    const idx = records.findIndex(r => r.memberId === memberId && r.meetingId === selectedMeeting.id);
    if (idx >= 0) {
      records[idx].status = newStatus;
    } else {
      records.push({ meetingId: selectedMeeting.id, date: selectedMeeting.date, branch: selectedMeeting.branch, memberId, memberName, status: newStatus, startTime: selectedMeeting.startTime });
    }
    dbService.saveAttendance(records);
    reRender(selectedMeeting);

    const labels = { 'Present': '✅ Present', 'Informed Absent': '🔔 Informed', 'Uninformed Absent': '❌ Uninformed' };
    showToast(`${memberName} → ${labels[newStatus]}`, 'info');
  });
}

function reRender(meeting) {
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.innerHTML = renderAttendanceView(meeting.branch);
    setTimeout(() => bindAttendanceEvents(meeting), 50);
  }
}
