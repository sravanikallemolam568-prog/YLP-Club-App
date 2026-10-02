// 10-Role Tracker Frequency Matrix View

import { dbService } from '../services/dbService.js';

export function renderRolesView(branchFilter = 'All') {
  let members = dbService.getMembers();
  let meetings = dbService.getMeetings();

  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
    meetings = meetings.filter(m => m.branch === branchFilter);
  }

  const roleTypes = [
    'Sergeant', 'Gavelier', 'Topic Master', 'Evaluator', 'Timer',
    'Ah-Counter', 'Listener', 'Videographer', 'General Evaluator', 'Activity Master'
  ];

  // Calculate frequency counts of roles for each member across meetings
  const memberRoleMatrix = members.map(member => {
    const roleCounts = {};
    roleTypes.forEach(role => roleCounts[role] = 0);

    meetings.forEach(mtg => {
      if (mtg.roles) {
        Object.entries(mtg.roles).forEach(([role, assignedMember]) => {
          if (assignedMember === member.name && roleCounts[role] !== undefined) {
            roleCounts[role] += 1;
          }
        });
      }
    });

    const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);

    return {
      member,
      roleCounts,
      totalRoles
    };
  });

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-award" style="color: var(--gold-primary);"></i> 10-Role Tracker Matrix</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Lifetime role performance frequency across all official Gavel Club meeting roles.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-table-cells"></i> Member Role Frequency Matrix</div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Branch</th>
                ${roleTypes.map(r => `<th style="font-size: 0.78rem;">${r}</th>`).join('')}
                <th>Total Roles</th>
              </tr>
            </thead>
            <tbody>
              ${memberRoleMatrix.map(item => `
                <tr>
                  <td style="font-weight: 700;">${item.member.name}</td>
                  <td><span class="badge badge-gold">${item.member.branch}</span></td>
                  ${roleTypes.map(r => `
                    <td style="text-align: center; font-weight: 600; color: ${item.roleCounts[r] > 0 ? 'var(--gold-bright)' : 'var(--text-muted)'};">
                      ${item.roleCounts[r]}
                    </td>
                  `).join('')}
                  <td style="font-weight: 800; color: var(--gold-primary); text-align: center;">${item.totalRoles}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
