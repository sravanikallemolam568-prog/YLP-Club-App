// Clean, Focused Dashboard View

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';

export function renderDashboardView(branchFilter = 'All') {
  const user = authService.getCurrentUser();
  let members = dbService.getMembers();
  let meetings = dbService.getMeetings();
  let attendance = dbService.getAttendance();

  // Apply Branch Filter
  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
    meetings = meetings.filter(m => m.branch === branchFilter);
    attendance = attendance.filter(a => a.branch === branchFilter);
  }

  // Time-Aware Greeting
  const currentHour = new Date().getHours();
  let timeGreeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) timeGreeting = 'Good afternoon';
  else if (currentHour >= 17) timeGreeting = 'Good evening';

  // Core Metrics
  const totalMembers = members.length;
  const totalSpeeches = members.reduce((sum, m) => sum + (m.speechesCompleted || 0), 0);
  const meetingsHeld = meetings.length;
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const avgAttendancePct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 85;

  const nextMeeting = meetings.find(m => m.status === 'Upcoming') || meetings[0];
  const isVPM = authService.isVPMembership();
  const isVPPR = authService.isVPPR();

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Welcome Hero Banner -->
      <div class="card" style="background: linear-gradient(120deg, #1A73E8 0%, #4285F4 58%, #34A853 150%); border-color: rgba(255, 255, 255, 0.24); color: #FFFFFF; padding: 24px 26px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.78rem; color: #E8F0FE; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">
              <i class="fa-solid fa-sun-plant-wilt"></i> ${timeGreeting}, ${user ? user.name : 'Gavelier'}!
            </div>
            <h2 style="font-size: 1.45rem; margin-top: 4px; color: #FFFFFF;">PSS Miyapur Gavel Club</h2>
            <p style="font-size: 0.85rem; color: #E8F0FE; margin-top: 4px;">Youth Leadership Program Dashboard</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge" style="padding: 6px 12px; font-size: 0.8rem; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.14);">
              <i class="fa-solid fa-code-branch"></i> ${branchFilter} Branch
            </span>
          </div>
        </div>
      </div>

      <!-- 4 Key Performance Indicators (KPIs) -->
      <div class="stats-grid">
        <div class="stat-tile">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="stat-lbl">Active Members</div>
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
          </div>
          <div class="stat-val">${totalMembers}</div>
        </div>

        <div class="stat-tile">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="stat-lbl">Speeches Delivered</div>
            <div class="stat-icon"><i class="fa-solid fa-microphone"></i></div>
          </div>
          <div class="stat-val">${totalSpeeches}</div>
        </div>

        <div class="stat-tile">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="stat-lbl">Meetings Held</div>
            <div class="stat-icon"><i class="fa-solid fa-calendar-check"></i></div>
          </div>
          <div class="stat-val">${meetingsHeld}</div>
        </div>

        <div class="stat-tile">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="stat-lbl">Avg Attendance</div>
            <div class="stat-icon"><i class="fa-solid fa-chart-line"></i></div>
          </div>
          <div class="stat-val">${avgAttendancePct}%</div>
        </div>
      </div>

      <!-- VPM Specific or Standard Meeting Highlight -->
      ${isVPM ? `
        <div class="card" style="border-left: 4px solid var(--gold-primary);">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-clipboard-user"></i> VP Membership Portal
            </div>
          </div>
          <div style="padding: 12px; color: var(--text-secondary); font-size: 0.95rem;">
            Welcome VP Membership! Please ensure that all new member registrations and attendance records for the upcoming week are updated <strong>before Sunday</strong>.
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
            <a href="#members" class="btn btn-primary btn-sm"><i class="fa-solid fa-users"></i> Manage Members</a>
            <a href="#attendance" class="btn btn-outline btn-sm"><i class="fa-solid fa-clipboard-user"></i> Mark Attendance</a>
          </div>
        </div>
      ` : isVPPR ? `
        <div class="card" style="border-left: 4px solid var(--google-blue);">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-photo-film"></i> Media Hub Workspace</div>
            <span class="badge badge-info">VP PR Access</span>
          </div>
          <div style="padding: 12px; color: var(--text-secondary); font-size: 0.95rem;">
            Manage club photos, meeting videos, and shared media from one dedicated workspace.
          </div>
          <div style="margin-top: 4px;">
            <a href="#media" class="btn btn-primary btn-sm"><i class="fa-solid fa-photo-film"></i> Open Media Hub</a>
          </div>
        </div>
      ` : `
        <div class="card" style="border-left: 4px solid var(--gold-primary);">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-calendar-day"></i> Next Scheduled Meeting
            </div>
            <span class="badge badge-gold">${nextMeeting ? nextMeeting.status : 'Scheduled'}</span>
          </div>

          ${nextMeeting ? `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <div style="font-weight: 800; font-size: 1.1rem; color: var(--gold-primary);">
                  <i class="fa-solid fa-clock" style="margin-right: 6px;"></i> ${nextMeeting.date} (${nextMeeting.startTime})
                </div>
                <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">
                  <i class="fa-solid fa-location-dot" style="color: #EF4444; margin-right: 4px;"></i> Location / Branch: <strong>${nextMeeting.branch}</strong>
                </div>
                <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 6px;">
                  Gavelier of the Day: <strong style="color: var(--text-primary);">${nextMeeting.roles?.Gavelier || 'TBD'}</strong>
                </div>
              </div>

              <div>
                <a href="#meetings" class="btn btn-primary btn-sm" style="height: 40px; padding: 0 16px;">
                  <i class="fa-solid fa-arrow-right"></i> Open Meeting
                </a>
              </div>
            </div>
          ` : `
            <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
              No upcoming meetings scheduled.
            </div>
          `}
        </div>
      `}

    </div>
  `;
}
