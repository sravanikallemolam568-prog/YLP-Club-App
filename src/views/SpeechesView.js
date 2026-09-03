// 10-Speech Progress Tracker View

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderSpeechesView(branchFilter = 'All') {
  let members = dbService.getMembers();
  if (branchFilter !== 'All') {
    members = members.filter(m => m.branch === branchFilter);
  }

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

      <!-- Speech Curriculum Overview Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        ${speeches.map(s => `
          <div class="card" style="border-left: 4px solid var(--gold-primary);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="badge badge-gold">Speech #${s.id}</span>
              <i class="fa-solid fa-microphone" style="color: var(--gold-primary);"></i>
            </div>
            <div style="font-weight: 700; font-size: 1.05rem; margin-top: 8px;">${s.title}</div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">${s.desc}</div>
          </div>
        `).join('')}
      </div>

      <!-- Member Speech Progress Table / Cards -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-chart-line"></i> Member Speech Progress Registry</div>
        </div>
        <div class="mobile-card-grid">
          ${members.map(m => `
            <div style="padding: 14px; border: 1px solid var(--border-color); border-radius: 12px; background-color: var(--badge-bg);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 700;">${m.name} (${m.branch})</div>
                <span class="badge badge-gold">${m.speechesCompleted || 0} / 10 Speeches</span>
              </div>
              <div style="margin-top: 10px;">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${(m.speechesCompleted || 0) * 10}%"></div>
                </div>
              </div>
            </div>
          `).join('')}
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
