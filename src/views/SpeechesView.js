// 10-Speech Progress Tracker View

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderSpeechesView(branchFilter = 'All') {
  let members = dbService.getMembers();
  if (branchFilter !== 'All') members = members.filter(m => m.branch === branchFilter);

  const speeches = dbService.getSpeechList();

  setTimeout(() => {
    bindSpeechesEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-scroll" style="color: var(--gold-primary);"></i> 10-Speech Tracker</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Track progress across all 10 Toastmasters & Gavel Club speeches.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="record-speech-btn" class="btn btn-primary">
            <i class="fa-solid fa-circle-check"></i> Record Speech Completion
          </button>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-chart-line"></i> Member Speech Progress Registry</div>
        </div>
        <div class="table-container speech-table-wrap">
          <table class="data-table speech-table">
            <thead><tr><th>Member</th>${speeches.map(s => `<th title="${s.title}">Speech ${s.id}</th>`).join('')}<th>Total</th></tr></thead>
            <tbody>
              ${members.map(m => { const completed = m.speechesCompleted || 0; return `<tr><td><div class="member-table-name"><span class="table-avatar">${m.name.charAt(0)}</span><div><strong>${m.name}</strong><small>${m.branch}</small></div></div></td>${speeches.map(s => `<td class="speech-status-cell ${s.id <= completed ? 'is-complete' : ''}" aria-label="${s.id <= completed ? 'Completed' : 'Pending'}"><span class="speech-status-dot"></span></td>`).join('')}<td><strong>${completed}/10</strong></td></tr>`; }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function bindSpeechesEvents() {
  const recordBtn = document.getElementById('record-speech-btn');
  recordBtn?.addEventListener('click', () => {
    const members = dbService.getMembers();
    const speeches = dbService.getSpeechList();

    const modalHtml = `
      <form id="record-speech-form">
        <div class="form-group">
          <label class="form-label required">Select Member</label>
          <select id="rec-member-id" class="form-select" required>
            ${members.map(m => `<option value="${m.id}">${m.name} (${m.branch}) - Current: ${m.speechesCompleted} Speeches</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label required">Speech Completed</label>
          <select id="rec-speech-num" class="form-select" required>
            ${speeches.map(s => `<option value="${s.id}">Speech #${s.id}: ${s.title}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Evaluator Name</label>
          <input type="text" id="rec-evaluator" class="form-input" placeholder="e.g. Kiran Kumar" />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">
          <i class="fa-solid fa-check"></i> Save Speech Progress
        </button>
      </form>
    `;

    openModal('Record Member Speech Completion', modalHtml);

    document.getElementById('record-speech-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const memberId = document.getElementById('rec-member-id').value;
      const speechNum = parseInt(document.getElementById('rec-speech-num').value, 10);
      const member = dbService.getMembers().find(m => m.id === memberId);
      if (member) {
        const newCount = Math.max(member.speechesCompleted || 0, speechNum);
        dbService.updateMember(memberId, { speechesCompleted: newCount });
        showToast(`Updated ${member.name}'s speech progress to ${newCount} speeches!`, 'success');
        closeModal();
      }
    });
  });
}
