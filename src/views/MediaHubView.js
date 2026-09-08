// Meeting-Based Media Hub View (Vertical List of Meeting Dates)

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { openModal, closeModal, showToast } from '../components/Modal.js';

export function renderMediaHubView(branchFilter = 'All') {
  let meetings = dbService.getMeetings();
  let allMedia = dbService.getMedia();

  if (branchFilter !== 'All') {
    meetings = meetings.filter(m => m.branch === branchFilter);
  }

  // Group media by meeting ID
  const meetingMediaGroups = meetings.map(mtg => {
    const mtgMedia = allMedia.filter(m => m.meetingId === mtg.id);
    const photos = mtgMedia.filter(m => m.type === 'image' || !m.type);
    const videos = mtgMedia.filter(m => m.type === 'video');
    return {
      meeting: mtg,
      media: mtgMedia,
      photos,
      videos
    };
  });

  // General club media
  const generalMedia = allMedia.filter(m => !m.meetingId || !meetings.some(mtg => mtg.id === m.meetingId));
  const generalPhotos = generalMedia.filter(m => m.type === 'image' || !m.type);
  const generalVideos = generalMedia.filter(m => m.type === 'video');

  setTimeout(() => {
    bindMediaHubEvents(meetingMediaGroups, { media: generalMedia, photos: generalPhotos, videos: generalVideos });
  }, 50);

  return `
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Top Action Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 1.5rem; color: var(--text-primary);"><i class="fa-solid fa-photo-film" style="color: var(--gold-primary);"></i> Meeting Media Hub</h2>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Select a meeting date from the list below to view its photos and video recordings.</p>
        </div>
        ${authService.isECOfficer() ? `
          <button id="add-media-btn" class="btn btn-primary">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload Media
          </button>
        ` : ''}
      </div>

      <!-- Meeting Folders Vertical List Container -->
      <div class="card" style="padding: 16px;">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-calendar-days"></i> Meeting Dates List</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${meetingMediaGroups.map((group, idx) => `
            <div class="meeting-media-row" data-idx="${idx}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--badge-bg); border-radius: 12px; border: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap; cursor: pointer; transition: background 0.2s ease;">
              
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(212,175,55,0.15); color: var(--gold-primary); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                  <i class="fa-solid fa-folder-open"></i>
                </div>
                <div>
                  <div style="font-weight: 800; font-size: 1.05rem; color: var(--gold-primary);">
                    ${group.meeting.date} (${group.meeting.startTime})
                    <span class="badge badge-gold" style="margin-left: 6px; font-size: 0.72rem;">${group.meeting.branch}</span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <span><i class="fa-solid fa-image" style="color: var(--gold-bright);"></i> ${group.photos.length} Photos</span>
                    <span><i class="fa-solid fa-video" style="color: #3B82F6;"></i> ${group.videos.length} Videos</span>
                    <span><i class="fa-solid fa-user-tie" style="color: var(--text-muted);"></i> Gavelier: ${group.meeting.roles?.Gavelier || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-primary btn-sm open-meeting-media-btn" data-idx="${idx}" style="height: 36px; padding: 0 14px; font-size: 0.82rem;">
                  <i class="fa-solid fa-photo-film"></i> View Photos & Videos
                </button>
                ${authService.isECOfficer() ? `
                  <button class="btn btn-danger btn-sm delete-meeting-media-btn" data-meetingid="${group.meeting.id}" style="height: 36px; padding: 0 12px; font-size: 0.82rem;" title="Remove all media for this meeting">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                ` : ''}
              </div>

            </div>
          `).join('')}

          <!-- General Club Events List Item -->
          <div class="general-media-row" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--badge-bg); border-radius: 12px; border: 1px solid var(--border-color); gap: 12px; flex-wrap: wrap; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(59,130,246,0.15); color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">
                <i class="fa-solid fa-star"></i>
              </div>
              <div>
                <div style="font-weight: 800; font-size: 1.05rem; color: #3B82F6;">
                  Special Club Events & Contests
                  <span class="badge badge-info" style="margin-left: 6px; font-size: 0.72rem;">All Branches</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px; display: flex; gap: 10px;">
                  <span><i class="fa-solid fa-image" style="color: var(--gold-bright);"></i> ${generalPhotos.length} Photos</span>
                  <span><i class="fa-solid fa-video" style="color: #3B82F6;"></i> ${generalVideos.length} Videos</span>
                </div>
              </div>
            </div>

            <button id="open-general-media-btn" class="btn btn-outline btn-sm" style="height: 36px; padding: 0 14px; font-size: 0.82rem; border-color: #3B82F6; color: #3B82F6;">
              <i class="fa-solid fa-photo-film"></i> View Event Media
            </button>
          </div>

        </div>
      </div>

    </div>
  `;
}

function bindMediaHubEvents(meetingMediaGroups, generalGroup) {
  document.querySelectorAll('.open-meeting-media-btn, .meeting-media-row').forEach(elem => {
    elem.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
      const group = meetingMediaGroups[idx];
      if (group) {
        openMeetingMediaModal(group.meeting.date, group.meeting.branch, group.photos, group.videos);
      }
    });
  });

  // Delete all media for a specific meeting
  document.querySelectorAll('.delete-meeting-media-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const meetingId = e.currentTarget.getAttribute('data-meetingid');
      if (confirm('Remove all photos and videos for this meeting date? This cannot be undone.')) {
        let all = dbService.getMedia();
        all = all.filter(m => m.meetingId !== meetingId);
        localStorage.setItem('pssgavel_media', JSON.stringify(all));
        showToast('All media for this meeting removed.', 'info');
        window.location.reload();
      }
    });
  });


  const generalBtn = document.getElementById('open-general-media-btn');
  const generalRow = document.querySelector('.general-media-row');
  const openGeneral = (e) => {
    e.stopPropagation();
    openMeetingMediaModal('Club Events & Contests', 'All Branches', generalGroup.photos, generalGroup.videos);
  };
  generalBtn?.addEventListener('click', openGeneral);
  generalRow?.addEventListener('click', openGeneral);

  // Upload Media Modal
  document.getElementById('add-media-btn')?.addEventListener('click', () => {
    const meetings = dbService.getMeetings();
    const modalHtml = `
      <form id="upload-media-form">
        <div class="form-group">
          <label class="form-label required">Title / Event Name</label>
          <input type="text" id="media-title" class="form-input" placeholder="e.g. Table Topics Winner Photo" required />
        </div>

        <div class="form-group">
          <label class="form-label required">Select Associated Meeting Date</label>
          <select id="media-meeting" class="form-select" required>
            ${meetings.map(m => `<option value="${m.id}">${m.date} - ${m.branch} (${m.startTime})</option>`).join('')}
            <option value="">Club Events / General</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Format</label>
          <select id="media-type" class="form-select" required>
            <option value="image">📷 Photo / Image URL</option>
            <option value="video">🎥 Video URL (MP4 / Web Video)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label required">Direct Photo or Video URL</label>
          <input type="url" id="media-url" class="form-input" placeholder="https://images.unsplash.com/..." required />
        </div>

        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="media-category" class="form-select">
            <option value="Meetings">Meetings</option>
            <option value="Speeches">Speeches</option>
            <option value="Events">Events & Contests</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Description / Caption</label>
          <textarea id="media-desc" class="form-input" rows="2" placeholder="Add a short caption..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px; height: 46px;">
          <i class="fa-solid fa-cloud-arrow-up"></i> Upload Media
        </button>
      </form>
    `;

    openModal('Upload Media to Meeting Date', modalHtml);

    document.getElementById('upload-media-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('media-title').value.trim();
      const meetingId = document.getElementById('media-meeting').value;
      const type = document.getElementById('media-type').value;
      const url = document.getElementById('media-url').value.trim();
      const category = document.getElementById('media-category').value;
      const description = document.getElementById('media-desc').value.trim();
      const user = authService.getCurrentUser();

      dbService.addMedia({ title, meetingId, type, url, category, description, uploadedBy: user ? user.name : 'EC Officer' });
      showToast('Media uploaded successfully!', 'success');
      closeModal();
      window.location.reload();
    });
  });
}

function openMeetingMediaModal(title, branch, photos, videos) {
  let currentPhotoIdx = 0;
  let currentVideoIdx = 0;
  let activeTab = photos.length > 0 ? 'photos' : 'videos';

  const renderContent = () => {
    return `
      <div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
          <i class="fa-solid fa-location-dot" style="color: #EF4444;"></i> Branch: <strong>${branch}</strong>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; background: var(--badge-bg); padding: 4px; border-radius: 12px; border: 1px solid var(--border-color); width: fit-content;">
          <button id="modal-tab-photos" class="tab-btn ${activeTab === 'photos' ? 'active' : ''}" style="padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; cursor: pointer;">
            📷 Photos (${photos.length})
          </button>
          <button id="modal-tab-videos" class="tab-btn ${activeTab === 'videos' ? 'active' : ''}" style="padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.84rem; cursor: pointer;">
            🎥 Videos (${videos.length})
          </button>
        </div>

        <div id="photos-tab-sec" style="display: ${activeTab === 'photos' ? 'block' : 'none'}; text-align: center;">
          ${photos.length === 0 ? `
            <div style="padding: 24px; color: var(--text-muted);">No photos available for this meeting date.</div>
          ` : `
            <div style="position: relative; background: #000; border-radius: 12px; overflow: hidden; max-height: 55vh; display: flex; align-items: center; justify-content: center;">
              <img src="${photos[currentPhotoIdx].url}" alt="${photos[currentPhotoIdx].title}" style="max-width: 100%; max-height: 55vh; object-fit: contain;" />
            </div>

            <div style="margin-top: 10px;">
              <h4 style="font-size: 1.05rem; color: var(--gold-primary); font-weight: 700;">${photos[currentPhotoIdx].title}</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">${photos[currentPhotoIdx].description || ''}</p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <button id="prev-photo-btn" class="btn btn-outline btn-sm" ${currentPhotoIdx === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Previous
              </button>
              
              <span style="font-weight: 700; font-size: 0.82rem; color: var(--gold-bright);">
                Photo ${currentPhotoIdx + 1} of ${photos.length}
              </span>

              <button id="next-photo-btn" class="btn btn-primary btn-sm" ${currentPhotoIdx === photos.length - 1 ? 'disabled' : ''}>
                Next <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          `}
        </div>

        <div id="videos-tab-sec" style="display: ${activeTab === 'videos' ? 'block' : 'none'}; text-align: center;">
          ${videos.length === 0 ? `
            <div style="padding: 24px; color: var(--text-muted);">No video recordings available for this meeting date.</div>
          ` : `
            <video src="${videos[currentVideoIdx].url}" controls autoplay style="width: 100%; max-height: 50vh; border-radius: 12px; background: #000; box-shadow: var(--shadow-md);"></video>

            <div style="margin-top: 10px;">
              <h4 style="font-size: 1.05rem; color: #3B82F6; font-weight: 700;">${videos[currentVideoIdx].title}</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">${videos[currentVideoIdx].description || ''}</p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-color);">
              <button id="prev-video-btn" class="btn btn-outline btn-sm" ${currentVideoIdx === 0 ? 'disabled' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Previous
              </button>
              
              <span style="font-weight: 700; font-size: 0.82rem; color: #3B82F6;">
                Video ${currentVideoIdx + 1} of ${videos.length}
              </span>

              <button id="next-video-btn" class="btn btn-primary btn-sm" ${currentVideoIdx === videos.length - 1 ? 'disabled' : ''} style="background: #3B82F6; border-color: #3B82F6;">
                Next <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          `}
        </div>

      </div>
    `;
  };

  openModal(`Meeting Media - ${title}`, renderContent());

  const bindTabEvents = () => {
    document.getElementById('modal-tab-photos')?.addEventListener('click', () => {
      activeTab = 'photos';
      const container = document.querySelector('.modal-body');
      if (container) {
        container.innerHTML = renderContent();
        bindTabEvents();
      }
    });

    document.getElementById('modal-tab-videos')?.addEventListener('click', () => {
      activeTab = 'videos';
      const container = document.querySelector('.modal-body');
      if (container) {
        container.innerHTML = renderContent();
        bindTabEvents();
      }
    });

    document.getElementById('prev-photo-btn')?.addEventListener('click', () => {
      if (currentPhotoIdx > 0) {
        currentPhotoIdx--;
        const container = document.querySelector('.modal-body');
        if (container) {
          container.innerHTML = renderContent();
          bindTabEvents();
        }
      }
    });

    document.getElementById('next-photo-btn')?.addEventListener('click', () => {
      if (currentPhotoIdx < photos.length - 1) {
        currentPhotoIdx++;
        const container = document.querySelector('.modal-body');
        if (container) {
          container.innerHTML = renderContent();
          bindTabEvents();
        }
      }
    });

    document.getElementById('prev-video-btn')?.addEventListener('click', () => {
      if (currentVideoIdx > 0) {
        currentVideoIdx--;
        const container = document.querySelector('.modal-body');
        if (container) {
          container.innerHTML = renderContent();
          bindTabEvents();
        }
      }
    });

    document.getElementById('next-video-btn')?.addEventListener('click', () => {
      if (currentVideoIdx < videos.length - 1) {
        currentVideoIdx++;
        const container = document.querySelector('.modal-body');
        if (container) {
          container.innerHTML = renderContent();
          bindTabEvents();
        }
      }
    });
  };

  bindTabEvents();
}
