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

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Welcome Hero Banner -->
      <div class="card" style="background: linear-gradient(135deg, #0F2038 0%, #071222 100%); border-color: rgba(212, 175, 55, 0.4); color: #FFFFFF; padding: 18px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.8rem; color: var(--gold-bright); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-sun-plant-wilt"></i> ${timeGreeting}, ${user ? user.name : 'Gavelier'}!
            </div>
            <h2 style="font-size: 1.45rem; margin-top: 4px; color: #FFFFFF;">PSS Miyapur Gavel Club</h2>
            <p style="font-size: 0.85rem; color: #94A3B8; margin-top: 2px;">Youth Leadership Program Dashboard</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge badge-gold" style="padding: 6px 12px; font-size: 0.8rem;">
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

      <!-- Next Scheduled Meeting Highlight -->
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

            <div style="display: flex; gap: 10px;">
              <a href="#agenda" class="btn btn-primary btn-sm" style="height: 40px; padding: 0 16px;">
                <i class="fa-solid fa-list-check"></i> View Agenda
              </a>
              <a href="#meetings" class="btn btn-outline btn-sm" style="height: 40px; padding: 0 16px;">
                <i class="fa-solid fa-user-tag"></i> Manage Roles
              </a>
            </div>
          </div>
        ` : `
          <div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
            No upcoming meetings scheduled.
          </div>
        `}
      </div>

      <!-- Main Action Shortcuts Grid -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-compass"></i> Navigation & Shortcuts</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          <a href="#members" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 14px; text-decoration: none;">
            <i class="fa-solid fa-users" style="color: var(--gold-primary); font-size: 1.1rem;"></i>
            <div style="text-align: left;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Members</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Directory & Profiles</div>
            </div>
          </a>

          <a href="#meetings" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 14px; text-decoration: none;">
            <i class="fa-solid fa-calendar-days" style="color: #3B82F6; font-size: 1.1rem;"></i>
            <div style="text-align: left;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Meetings</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Agendas & Roles</div>
            </div>
          </a>

          <a href="#attendance" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 14px; text-decoration: none;">
            <i class="fa-solid fa-clipboard-user" style="color: #10B981; font-size: 1.1rem;"></i>
            <div style="text-align: left;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Attendance</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Mark & History</div>
            </div>
          </a>

          <a href="#speeches" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 14px; text-decoration: none;">
            <i class="fa-solid fa-scroll" style="color: #8B5CF6; font-size: 1.1rem;"></i>
            <div style="text-align: left;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Speeches</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Progress & Track</div>
            </div>
          </a>

          <a href="#mentors" class="btn btn-outline" style="justify-content: flex-start; padding: 12px 14px; text-decoration: none;">
            <i class="fa-solid fa-user-graduate" style="color: #F59E0B; font-size: 1.1rem;"></i>
            <div style="text-align: left;">
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">Mentors</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Mentee Directory</div>
            </div>
          </a>
        </div>
      </div>

    </div>
  `;
}
