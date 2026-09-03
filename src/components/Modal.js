// Reusable Modal Dialog & Toast Helper

export function openModal(title, bodyContentHtml, footerButtonsHtml = '') {
  let modalOverlay = document.getElementById('global-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'global-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-container animate-fade-in">
      <div class="modal-header">
        <h3 style="margin: 0; font-size: 1.15rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          ${title}
        </h3>
        <button id="modal-close-btn" class="btn btn-outline btn-icon" style="width: 32px; height: 32px; border: none;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">
        ${bodyContentHtml}
      </div>
      ${footerButtonsHtml ? `<div class="modal-footer">${footerButtonsHtml}</div>` : ''}
    </div>
  `;

  modalOverlay.classList.add('active');

  const closeBtn = document.getElementById('modal-close-btn');
  closeBtn.onclick = () => closeModal();

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) closeModal();
  };
}

export function closeModal() {
  const modalOverlay = document.getElementById('global-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}" style="color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#D4AF37'};"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
