// Configurable Dynamic Agenda View with Automatic Time Recalculation & Branded Image Card Generator

import { dbService } from '../services/dbService.js';
import { AgendaImageService } from '../services/agendaImageService.js';
import { showToast } from '../components/Modal.js';

export function renderAgendaConfigView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  if (branchFilter !== 'All') {
    meetings = meetings.filter(m => m.branch === branchFilter);
  }
  const selectedMeeting = meetings[0] || dbService.getMeetings()[0];

  setTimeout(() => {
    bindAgendaEvents(selectedMeeting);
  }, 50);

  if (!selectedMeeting) {
    return `<div class="card"><p>No meetings available to configure agenda.</p></div>`;
  }

  const items = AgendaImageService.calculateAgendaTimings(selectedMeeting.startTime || '10:00 AM', selectedMeeting.agenda || []);
  const generatedText = AgendaImageService.generateAgendaText(selectedMeeting.date, selectedMeeting.branch, selectedMeeting.startTime, selectedMeeting.agenda);

  return `
    <div class="animate-fade-in">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 1.5rem;"><i class="fa-solid fa-list-check" style="color: var(--gold-primary);"></i> Configurable Meeting Agenda</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Dynamic agenda timing auto-recalculation & branded agenda image card generator.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="gen-agenda-text-btn" class="btn btn-outline">
            <i class="fa-solid fa-copy"></i> Copy Agenda Text
          </button>
          <button id="gen-agenda-img-btn" class="btn btn-primary">
            <i class="fa-solid fa-image"></i> Generate Agenda Image
          </button>
        </div>
      </div>

      <!-- Config Controls Bar -->
      <div class="card" style="margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Select Meeting Date & Branch</label>
            <select id="agenda-meeting-select" class="form-select">
              ${dbService.getMeetings().map(m => `
                <option value="${m.id}" ${m.id === selectedMeeting.id ? 'selected' : ''}>${m.date} - ${m.branch} (${m.startTime})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Meeting Start Time</label>
            <input type="text" id="agenda-start-time-input" class="form-input" value="${selectedMeeting.startTime || '10:00 AM'}" placeholder="e.g. 10:00 AM" />
          </div>
        </div>
      </div>

      <!-- Live Agenda Item Editor Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-sliders"></i> Dynamic Timeline Editor</div>
          <button id="add-agenda-row-btn" class="btn btn-outline btn-sm"><i class="fa-solid fa-plus"></i> Add Agenda Item</button>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Activity / Agenda Item</th>
                <th>Assigned Member</th>
                <th>Duration (Mins)</th>
                <th>Auto Start Time</th>
                <th>Auto End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="agenda-editor-rows">
              ${items.map((item, idx) => `
                <tr data-index="${idx}">
                  <td style="font-weight: 700;">#${idx + 1}</td>
                  <td>
                    <input type="text" class="form-input agenda-activity" value="${item.activity}" style="min-height: 38px;" />
                  </td>
                  <td>
                    <select class="form-select agenda-member" style="min-height: 38px;">
                      <option value="TBD" ${!item.member || item.member === 'TBD' ? 'selected' : ''}>TBD</option>
                      ${dbService.getMembers().map(m => `
                        <option value="${m.name}" ${item.member === m.name ? 'selected' : ''}>${m.name}</option>
                      `).join('')}
                    </select>
                  </td>
                  <td>
                    <input type="number" class="form-input agenda-duration" value="${item.duration || 5}" min="1" max="120" style="width: 80px; min-height: 38px;" />
                  </td>
                  <td style="font-weight: 700; color: var(--gold-primary);">${item.startTime}</td>
                  <td style="font-weight: 700; color: var(--text-primary);">${item.endTime}</td>
                  <td>
                    <button class="btn btn-danger btn-sm remove-row-btn" data-index="${idx}"><i class="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Generated Branded Image Preview Section -->
      <div id="agenda-image-preview-container" class="card" style="display: none; text-align: center; margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-wand-magic-sparkles"></i> Generated Branded Agenda Card Image</div>
          <div style="display: flex; gap: 8px;">
            <a id="download-agenda-img-link" class="btn btn-primary btn-sm" download="PSS_Miyapur_Gavel_Club_Agenda.png">
              <i class="fa-solid fa-download"></i> Download Image
            </a>
            <button id="share-whatsapp-btn" class="btn btn-navy btn-sm">
              <i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> Share on WhatsApp
            </button>
          </div>
        </div>
        <div id="canvas-wrapper" style="overflow-x: auto; padding: 10px;"></div>
      </div>
    </div>
  `;
}

function bindAgendaEvents(selectedMeeting) {
  const startTimeInput = document.getElementById('agenda-start-time-input');
  const meetingSelect = document.getElementById('agenda-meeting-select');

  startTimeInput?.addEventListener('change', () => {
    if (selectedMeeting) {
      selectedMeeting.startTime = startTimeInput.value;
      dbService.updateMeeting(selectedMeeting.id, { startTime: startTimeInput.value });
      recalcAgendaUi(selectedMeeting);
    }
  });

  meetingSelect?.addEventListener('change', () => {
    const meetingId = meetingSelect.value;
    const meeting = dbService.getMeetings().find(m => m.id === meetingId);
    if (meeting) renderAgendaConfigView(meeting.branch);
  });

  // Delegated duration change event for live time recalculation across all subsequent rows!
  document.getElementById('agenda-editor-rows')?.addEventListener('input', (e) => {
    if (e.target.classList.contains('agenda-duration') || e.target.classList.contains('agenda-activity') || e.target.classList.contains('agenda-member')) {
      saveAndRecalcAgendaRows(selectedMeeting);
    }
  });

  document.getElementById('add-agenda-row-btn')?.addEventListener('click', () => {
    selectedMeeting.agenda.push({ order: selectedMeeting.agenda.length + 1, activity: 'New Activity', member: 'TBD', duration: 10 });
    dbService.updateMeeting(selectedMeeting.id, { agenda: selectedMeeting.agenda });
    recalcAgendaUi(selectedMeeting);
  });

  // Generate Image Card Button Click
  document.getElementById('gen-agenda-img-btn')?.addEventListener('click', () => {
    saveAndRecalcAgendaRows(selectedMeeting);
    const canvas = AgendaImageService.renderAgendaCanvas(selectedMeeting.date, selectedMeeting.branch, selectedMeeting.startTime, selectedMeeting.agenda);
    
    const wrapper = document.getElementById('canvas-wrapper');
    const container = document.getElementById('agenda-image-preview-container');
    const downloadLink = document.getElementById('download-agenda-img-link');

    if (wrapper && container && downloadLink) {
      wrapper.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      canvas.style.borderRadius = '12px';
      wrapper.appendChild(canvas);

      const dataUrl = canvas.toDataURL('image/png');
      downloadLink.href = dataUrl;
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
      showToast('Branded Agenda Image Card generated successfully!', 'success');
    }
  });

  document.getElementById('gen-agenda-text-btn')?.addEventListener('click', () => {
    const text = AgendaImageService.generateAgendaText(selectedMeeting.date, selectedMeeting.branch, selectedMeeting.startTime, selectedMeeting.agenda);
    navigator.clipboard.writeText(text);
    showToast('Agenda text copied to clipboard!', 'success');
  });

  document.getElementById('share-whatsapp-btn')?.addEventListener('click', () => {
    const text = AgendaImageService.generateAgendaText(selectedMeeting.date, selectedMeeting.branch, selectedMeeting.startTime, selectedMeeting.agenda);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  });
}

function saveAndRecalcAgendaRows(selectedMeeting) {
  const rows = document.querySelectorAll('#agenda-editor-rows tr');
  const updatedAgenda = [];
  rows.forEach((row, idx) => {
    const activity = row.querySelector('.agenda-activity')?.value || 'Activity';
    const member = row.querySelector('.agenda-member')?.value || 'TBD';
    const duration = parseInt(row.querySelector('.agenda-duration')?.value || '5', 10);
    updatedAgenda.push({ order: idx + 1, activity, member, duration });
  });

  selectedMeeting.agenda = updatedAgenda;
  dbService.updateMeeting(selectedMeeting.id, { agenda: updatedAgenda });
  recalcAgendaUi(selectedMeeting);
}

function recalcAgendaUi(selectedMeeting) {
  const items = AgendaImageService.calculateAgendaTimings(selectedMeeting.startTime || '10:00 AM', selectedMeeting.agenda || []);
  const rows = document.querySelectorAll('#agenda-editor-rows tr');
  rows.forEach((row, idx) => {
    if (items[idx]) {
      const cells = row.querySelectorAll('td');
      if (cells[4]) cells[4].textContent = items[idx].startTime;
      if (cells[5]) cells[5].textContent = items[idx].endTime;
    }
  });
}
