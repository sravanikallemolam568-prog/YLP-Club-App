import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { closeModal, openModal, showToast } from '../components/Modal.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function makeId(prefix) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${id}`;
}

function toLocalDateTimeValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleString();
}

function getElectionStatus(election, now = Date.now()) {
  const opensAt = new Date(election.opensAt).getTime();
  const closesAt = new Date(election.closesAt).getTime();
  if (!Number.isFinite(opensAt) || !Number.isFinite(closesAt)) return 'Invalid schedule';
  if (now < opensAt) return 'Upcoming';
  if (now <= closesAt) return 'Open';
  return 'Closed';
}

function getVoterKey() {
  const user = authService.getCurrentUser();
  return (user?.email || user?.name || '').trim().toLowerCase();
}

export function renderECElectionsView() {
  const elections = dbService.getElections();
  const canManage = authService.canManageMeetings();
  const voterKey = getVoterKey();
  setTimeout(() => bindElectionEvents(), 50);

  return `
    <div class="animate-fade-in election-page">
      <header class="election-heading">
        <div>
          <div class="eyebrow">PSS MIYAPUR GAVEL</div>
          <h2>EC Elections</h2>
          <p>Review candidates and cast one vote for each committee position.</p>
        </div>
        ${canManage ? '<button id="create-election-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create election</button>' : ''}
      </header>

      <div class="election-local-notice"><i class="fa-solid fa-circle-info"></i><span>This poll is stored on this device only. Votes are not synced or secured across devices, so use a shared election service for official results.</span></div>

      ${elections.length ? elections.map(election => renderElectionCard(election, voterKey)).join('') : `
        <div class="connect-empty election-empty"><i class="fa-solid fa-check-to-slot"></i><h3>No EC elections yet</h3><p>${canManage ? 'Create an election and add candidates for each position.' : 'The EC has not created an election yet.'}</p></div>
      `}
    </div>
  `;
}

function renderElectionCard(election, voterKey) {
  const status = getElectionStatus(election);
  const isOpen = status === 'Open';
  const resultsVisible = status === 'Closed';
  const positions = Array.isArray(election.positions) ? election.positions : [];

  return `
    <section class="election-card">
      <div class="election-card-heading">
        <div>
          <span class="badge ${status === 'Open' ? 'badge-info' : 'badge-outline'}">${escapeHtml(status)}</span>
          <h3>${escapeHtml(election.title || 'EC Election')}</h3>
          ${election.description ? `<p>${escapeHtml(election.description)}</p>` : ''}
        </div>
        <div class="election-dates">
          <span><strong>Opens</strong>${escapeHtml(formatDate(election.opensAt))}</span>
          <span><strong>Closes</strong>${escapeHtml(formatDate(election.closesAt))}</span>
        </div>
      </div>

      ${positions.length ? positions.map(position => {
        const candidates = Array.isArray(position.candidates) ? position.candidates : [];
        const votes = Array.isArray(election.votes) ? election.votes : [];
        const existingVote = votes.find(vote => vote.positionId === position.id && vote.voterKey === voterKey);
        const counts = Object.fromEntries(candidates.map(candidate => [candidate.id, 0]));
        votes.filter(vote => vote.positionId === position.id).forEach(vote => {
          if (Object.hasOwn(counts, vote.candidateId)) counts[vote.candidateId] += 1;
        });

        return `
          <div class="election-position">
            <div class="election-position-heading"><h4>${escapeHtml(position.name)}</h4><span>${candidates.length} candidates</span></div>
            <div class="election-candidate-list">
              ${candidates.map(candidate => `
                <div class="election-candidate">
                  <div><strong>${escapeHtml(candidate.name)}</strong>${resultsVisible ? `<span>${counts[candidate.id] || 0} votes</span>` : ''}</div>
                  ${isOpen && !existingVote ? `<button class="btn btn-outline btn-sm cast-election-vote" type="button" data-election-id="${escapeHtml(election.id)}" data-position-id="${escapeHtml(position.id)}" data-candidate-id="${escapeHtml(candidate.id)}">Vote</button>` : ''}
                </div>
              `).join('') || '<p class="election-muted">No candidates were added.</p>'}
            </div>
            ${isOpen && existingVote ? '<p class="election-vote-note"><i class="fa-solid fa-circle-check"></i> Your vote for this position is recorded.</p>' : ''}
            ${!resultsVisible && status === 'Closed' ? '' : ''}
          </div>
        `;
      }).join('') : '<p class="election-muted">No positions were added to this election.</p>'}

      ${resultsVisible ? '<p class="election-vote-note"><i class="fa-solid fa-chart-column"></i> Results are shown because voting is closed.</p>' : ''}
    </section>
  `;
}

function electionPositionRow(positionName = '', candidates = '') {
  return `
    <div class="election-position-row">
      <label><span>Position</span><input class="form-input election-position-name" value="${escapeHtml(positionName)}" placeholder="e.g. President" required /></label>
      <label><span>Candidates (comma-separated)</span><input class="form-input election-candidates" value="${escapeHtml(candidates)}" placeholder="Candidate One, Candidate Two" required /></label>
      <button class="btn btn-outline btn-icon remove-election-position" type="button" aria-label="Remove position"><i class="fa-solid fa-trash"></i></button>
    </div>
  `;
}

function openCreateElectionModal() {
  const opensAt = new Date();
  const closesAt = new Date(opensAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  openModal('Create EC election', `
    <form id="create-election-form" class="election-create-form">
      <label><span>Election name</span><input id="election-title" class="form-input" maxlength="100" placeholder="e.g. 2027 Executive Committee" required /></label>
      <label><span>Details (optional)</span><textarea id="election-description" class="form-input" maxlength="500" rows="2" placeholder="Add a short note for voters."></textarea></label>
      <div class="election-schedule-fields">
        <label><span>Opens</span><input id="election-opens-at" class="form-input" type="datetime-local" value="${toLocalDateTimeValue(opensAt)}" required /></label>
        <label><span>Closes</span><input id="election-closes-at" class="form-input" type="datetime-local" value="${toLocalDateTimeValue(closesAt)}" required /></label>
      </div>
      <div class="election-position-list" id="election-position-list">${electionPositionRow()}</div>
      <button id="add-election-position" class="btn btn-outline btn-sm" type="button"><i class="fa-solid fa-plus"></i> Add position</button>
      <button class="btn btn-primary" type="submit"><i class="fa-solid fa-check-to-slot"></i> Create election</button>
    </form>
  `);

  document.getElementById('add-election-position')?.addEventListener('click', () => {
    document.getElementById('election-position-list')?.insertAdjacentHTML('beforeend', electionPositionRow());
  });

  document.getElementById('election-position-list')?.addEventListener('click', event => {
    const removeButton = event.target.closest('.remove-election-position');
    if (removeButton && document.querySelectorAll('.election-position-row').length > 1) {
      removeButton.closest('.election-position-row').remove();
    }
  });

  document.getElementById('create-election-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const title = document.getElementById('election-title').value.trim();
    const description = document.getElementById('election-description').value.trim();
    const opensAt = document.getElementById('election-opens-at').value;
    const closesAt = document.getElementById('election-closes-at').value;
    const openTime = new Date(opensAt).getTime();
    const closeTime = new Date(closesAt).getTime();

    if (!Number.isFinite(openTime) || !Number.isFinite(closeTime) || closeTime <= openTime) {
      showToast('Choose a closing time later than the opening time.', 'error');
      return;
    }

    const positions = [...document.querySelectorAll('.election-position-row')].map(row => {
      const name = row.querySelector('.election-position-name')?.value.trim();
      const names = (row.querySelector('.election-candidates')?.value || '').split(',').map(candidate => candidate.trim()).filter(Boolean);
      const uniqueNames = [...new Map(names.map(candidate => [candidate.toLowerCase(), candidate])).values()];
      return {
        id: makeId('POS'),
        name,
        candidates: uniqueNames.map(candidate => ({ id: makeId('CAND'), name: candidate }))
      };
    });

    if (positions.some(position => !position.name || position.candidates.length < 2)) {
      showToast('Each position needs a name and at least two distinct candidates.', 'error');
      return;
    }

    dbService.addElection({ title, description, opensAt: new Date(openTime).toISOString(), closesAt: new Date(closeTime).toISOString(), positions, votes: [] });
    closeModal();
    showToast('EC election created.', 'success');
    window.location.reload();
  });
}

function bindElectionEvents() {
  document.getElementById('create-election-btn')?.addEventListener('click', openCreateElectionModal);

  document.querySelectorAll('.cast-election-vote').forEach(button => {
    button.addEventListener('click', event => {
      const voterKey = getVoterKey();
      const elections = dbService.getElections();
      const election = elections.find(item => item.id === event.currentTarget.dataset.electionId);
      if (!election || getElectionStatus(election) !== 'Open') {
        showToast('Voting is not currently open.', 'error');
        return;
      }

      const positionId = event.currentTarget.dataset.positionId;
      const candidateId = event.currentTarget.dataset.candidateId;
      const votes = Array.isArray(election.votes) ? election.votes : [];
      if (votes.some(vote => vote.positionId === positionId && vote.voterKey === voterKey)) {
        showToast('You have already voted for this position.', 'info');
        return;
      }

      const position = election.positions.find(item => item.id === positionId);
      if (!position?.candidates.some(candidate => candidate.id === candidateId)) {
        showToast('That candidate is no longer available.', 'error');
        return;
      }

      election.votes = [...votes, { positionId, candidateId, voterKey, castAt: new Date().toISOString() }];
      dbService.updateElection(election.id, { votes: election.votes });
      showToast('Your vote has been recorded.', 'success');
      window.location.reload();
    });
  });
}