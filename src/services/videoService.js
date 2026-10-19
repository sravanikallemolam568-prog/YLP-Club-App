/**
 * In-App WebRTC Video Calling Service for Club Connect
 * Uses the official Jitsi Meet WebRTC External API for real in-app video calling.
 * Provides mic/camera toggles, participant tracking, device permissions, and resource cleanup.
 */

import { authService } from './authService.js';

class VideoService {
  constructor() {
    this.api = null;
    this.activeRoom = null;
    this.isMuted = false;
    this.isVideoMuted = false;
    this.scriptLoadingPromise = null;
    this.listeners = new Map();
  }

  /**
   * Load the external Jitsi Meet WebRTC API script dynamically if not already loaded.
   */
  async loadScript() {
    if (window.JitsiMeetExternalAPI) {
      return true;
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById('jitsi-external-api-script');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => reject(new Error('Failed to load video calling SDK'));
        return;
      }

      const script = document.createElement('script');
      script.id = 'jitsi-external-api-script';
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        this.scriptLoadingPromise = null;
        reject(new Error('Could not connect to video calling servers. Please check your internet connection.'));
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Generates a safe, unique room name for club sessions.
   */
  sanitizeRoomName(rawName = '') {
    const clean = String(rawName).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `PSSGavelClub_${clean || 'GeneralRoom'}`;
  }

  /**
   * Starts or joins an in-app video call in the designated container.
   */
  async startCall({
    roomName,
    containerElement,
    currentUser,
    onCallEnded,
    onError,
    onParticipantJoined,
    onParticipantLeft
  }) {
    if (!containerElement) {
      throw new Error('Container element is required to mount video call.');
    }

    // Terminate existing call if active
    this.leaveCall();

    await this.loadScript();

    const user = currentUser || authService.getCurrentUser() || { name: 'Club Member', email: '', role: 'Member' };
    const sanitizedRoom = this.sanitizeRoomName(roomName);
    this.activeRoom = sanitizedRoom;

    const domain = 'meet.jit.si';
    const options = {
      roomName: sanitizedRoom,
      width: '100%',
      height: '100%',
      parentNode: containerElement,
      userInfo: {
        email: user.email || '',
        displayName: `${user.name || 'Member'} (${user.role || 'Member'})`
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        enableClosePage: false,
        toolbarButtons: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'profile',
          'chat',
          'recording',
          'livestreaming',
          'etherpad',
          'sharedvideo',
          'settings',
          'raisehand',
          'videoquality',
          'filmstrip',
          'invite',
          'feedback',
          'stats',
          'shortcuts',
          'tileview',
          'videobackgroundblur',
          'download',
          'help',
          'mute-everyone'
        ]
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DEFAULT_REMOTE_DISPLAY_NAME: 'Club Member'
      }
    };

    try {
      this.api = new window.JitsiMeetExternalAPI(domain, options);

      this.api.addEventListener('videoConferenceJoined', () => {
        this.emit('joined', { room: sanitizedRoom, user });
      });

      this.api.addEventListener('videoConferenceLeft', () => {
        this.cleanUp();
        if (typeof onCallEnded === 'function') onCallEnded();
      });

      this.api.addEventListener('readyToClose', () => {
        this.cleanUp();
        if (typeof onCallEnded === 'function') onCallEnded();
      });

      this.api.addEventListener('participantJoined', (participant) => {
        if (typeof onParticipantJoined === 'function') onParticipantJoined(participant);
      });

      this.api.addEventListener('participantLeft', (participant) => {
        if (typeof onParticipantLeft === 'function') onParticipantLeft(participant);
      });

      this.api.addEventListener('audioMuteStatusChanged', (status) => {
        this.isMuted = status.muted;
      });

      this.api.addEventListener('videoMuteStatusChanged', (status) => {
        this.isVideoMuted = status.muted;
      });

      return this.api;
    } catch (err) {
      if (typeof onError === 'function') onError(err);
      throw err;
    }
  }

  /**
   * Leave and dispose of active call resources cleanly.
   */
  leaveCall() {
    if (this.api) {
      try {
        this.api.executeCommand('hangup');
        this.api.dispose();
      } catch (e) {
        console.warn('Error during video call disposal:', e);
      }
      this.cleanUp();
    }
  }

  cleanUp() {
    this.api = null;
    this.activeRoom = null;
    this.isMuted = false;
    this.isVideoMuted = false;
  }

  isCallActive() {
    return !!this.api;
  }

  getActiveRoom() {
    return this.activeRoom;
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(fn => fn(data));
  }
}

export const videoService = new VideoService();
