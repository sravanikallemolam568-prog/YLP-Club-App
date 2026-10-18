// Member speech development progress view

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderSpeechesView(branchFilter = 'All') {
  let members = dbService.getMembers();
  if (branchFilter !== 'All') members = members.filter(m => m.branch === branchFilter);

  const speeches = dbService.getSpeechList();
  const totalProjects = members.length * speeches.length;
  const completedProjects = members.reduce((total, member) =>
    total + Math.min(Math.max(Number(member.speechesCompleted) || 0, 0), speeches.length), 0);
  const membersInProgress = members.filter(member => {
    const completed = Math.min(Math.max(Number(member.speechesCompleted) || 0, 0), speeches.length);
    return completed > 0 && completed < speeches.length;
  }).length;

  setTimeout(() => {
    bindSpeechesEvents();
  }, 50);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-microphone-lines" style="color: var(--teal-deep);"></i> Member Speech Progress</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Follow each member’s prepared-speech journey and next project.</p>
        </div>
        ${authService.canManageSpeeches() ? `
          <button id="record-speech-btn" class="btn btn-primary">
            <i class="fa-solid fa-circle-check"></i> Record progress
          </button>
        ` : ''}
      </div>

      <section class="speech-progress-summary" aria-label="Speech progress summary">
        <div><span>Projects completed</span><strong>${completedProjects} / ${totalProjects}</strong></div>
        <div><span>Members in progress</span><strong>${membersInProgress}</strong></div>
        <div class="speech-progress-summary-track" role="progressbar" aria-label="Overall speech project completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0}">
          <span style="width: ${totalProjects ? Math.round((completedProjects / totalProjects) * 100) : 0}%"></span>
        </div>
      </section>

      <section class="speech-member-list" aria-label="Member speech progress">
        ${members.length ? members.map(member => {
          const completed = Math.min(Math.max(Number(member.speechesCompleted) || 0, 0), speeches.length);
          const percentage = speeches.length ? Math.round((completed / speeches.length) * 100) : 0;
          const nextSpeech = speeches[completed];

          return `
            <article class="speech-member-row">
              <span class="speech-member-avatar" aria-hidden="true">${member.name.charAt(0)}</span>
              <div class="speech-member-details">
                <div class="speech-member-heading">
                  <div><strong>${member.name}</strong><small>${member.branch}</small></div>
                  <span class="speech-member-count">${completed} / ${speeches.length}</span>
                </div>
                <div class="speech-member-track" role="progressbar" aria-label="${member.name} speech progress" aria-valuemin="0" aria-valuemax="${speeches.length}" aria-valuenow="${completed}">
                  <span style="width: ${percentage}%"></span>
                </div>
                <p>${nextSpeech ? `Next: Speech ${nextSpeech.id} · ${nextSpeech.title}` : 'All speech projects completed'}</p>
              </div>
            </article>
          `;
        }).join('') : '<div class="speech-list-empty">No members found for this branch.</div>'}
      </section>
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
