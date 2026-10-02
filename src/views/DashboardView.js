// Simple, modern home dashboard for the club app

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';

export function renderDashboardView(branchFilter = 'All') {
  const user = authService.getCurrentUser();
  let members = dbService.getMembers();
  let meetings = dbService.getMeetings();
  let attendance = dbService.getAttendance();

  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
    meetings = meetings.filter(m => m.branch === branchFilter);
    attendance = attendance.filter(a => a.branch === branchFilter);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const todaysMeeting = meetings.find(m => m.date === todayLabel) || meetings[0];
  const nextMeeting = meetings.find(m => m.date && m.date !== todayLabel) || meetings[0];
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount = attendance.filter(a => a.status !== 'Present').length;

  return `
    <div class="animate-fade-in" style="max-width: 980px; margin: 0 auto; padding-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 18px;">
        <div>
          <div style="font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-muted); font-weight: 800;">PSS MIYAPUR GAVEL</div>
          <h2 style="font-size: 2.1rem; line-height: 1.1; margin-top: 6px; margin-bottom: 0;">${greeting} 👋</h2>
        </div>
        <div style="background: rgba(69, 201, 189, 0.09); border: 1px solid rgba(69, 201, 189, 0.18); border-radius: 14px; padding: 8px 12px; color: var(--teal-dark); font-weight: 800; font-size: 0.8rem;">
          ${user ? user.role : 'President'}
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(69,201,189,0.08), rgba(255,255,255,1)); border: 1px solid rgba(69, 201, 189, 0.14); border-radius: 22px; padding: 20px 18px; margin-bottom: 22px; box-shadow: var(--shadow-sm);">
        <img src="/gavel-club-logo.svg" alt="PSS Gavel Club logo" style="width: 52px; height: 52px; object-fit: cover; border-radius: 16px; flex-shrink: 0;" />
        <div>
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-muted); font-weight: 700;">PSS MIYAPUR GAVEL</div>
          <div style="font-size: 1.6rem; font-weight: 800; margin-top: 4px; line-height: 1.1;">Gavel Club Management</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 26px;">
        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 10px;">Today's Meeting</div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--teal-dark); font-weight: 800; font-size: 1.1rem;">
            <i class="fa-solid fa-calendar-days"></i>
            <span>${todaysMeeting ? todaysMeeting.date : 'No meeting scheduled'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; color: var(--text-secondary);">
            <i class="fa-solid fa-clock"></i>
            <span>${todaysMeeting ? todaysMeeting.startTime : '—'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; color: var(--text-secondary);">
            <i class="fa-solid fa-location-dot"></i>
            <span>${todaysMeeting ? todaysMeeting.branch : '—'}</span>
          </div>
        </article>

        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 12px;">Attendance</div>
          <div style="display: flex; align-items: end; gap: 18px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--teal-dark);">${presentCount}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Present</div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">${absentCount}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase;">Absent</div>
            </div>
          </div>
          <div style="height: 8px; background: #EAF3F2; border-radius: 999px; overflow: hidden;">
            <div style="height: 100%; width: ${attendance.length ? Math.max(10, Math.round((presentCount / Math.max(attendance.length, 1)) * 100)) : 0}%; background: linear-gradient(90deg, var(--teal-primary), var(--teal-dark)); border-radius: inherit;"></div>
          </div>
        </article>

        <article style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; margin-bottom: 10px;">Upcoming Meeting</div>
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--teal-dark); font-weight: 800; font-size: 1.1rem;">
            <i class="fa-solid fa-clock"></i>
            <span>${nextMeeting ? nextMeeting.date : 'Next session'}</span>
          </div>
          <div style="color: var(--text-secondary);">
            ${nextMeeting ? nextMeeting.startTime : 'Awaiting schedule'}
          </div>
        </article>
      </div>

      <div>
        <div style="font-size: 0.76rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); font-weight: 800; margin-bottom: 12px;">Quick Actions</div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
          <a href="#members" style="display:flex; align-items:center; justify-content:center; gap:10px; background: var(--bg-card); border:1px solid var(--border-color); color: var(--text-primary); border-radius: 16px; padding: 18px 14px; font-weight: 700; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-users"></i> Members
          </a>
          <a href="#attendance" style="display:flex; align-items:center; justify-content:center; gap:10px; background: var(--bg-card); border:1px solid var(--border-color); color: var(--text-primary); border-radius: 16px; padding: 18px 14px; font-weight: 700; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-clipboard-user"></i> Attendance
          </a>
          <a href="#meetings" style="display:flex; align-items:center; justify-content:center; gap:10px; background: var(--bg-card); border:1px solid var(--border-color); color: var(--text-primary); border-radius: 16px; padding: 18px 14px; font-weight: 700; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-calendar-days"></i> Meetings
          </a>
          <a href="#media" style="display:flex; align-items:center; justify-content:center; gap:10px; background: var(--bg-card); border:1px solid var(--border-color); color: var(--text-primary); border-radius: 16px; padding: 18px 14px; font-weight: 700; box-shadow: var(--shadow-sm);">
            <i class="fa-solid fa-photo-film"></i> Media
          </a>
        </div>
      </div>
    </div>
  `;
}
