/**
 * Notification & Audio Chime Service for Club Connect
 * Provides browser Web Notifications, in-app sound synthesis (no asset files needed),
 * unread count calculations, and mark-as-read tracking.
 */

const STORAGE_READS_KEY = 'pssgavel_chat_reads';

class NotificationService {
  constructor() {
    this.audioContext = null;
  }

  /**
   * Initializes Web Audio Context on user interaction to comply with browser autoplay policies.
   */
  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Plays a pleasant, subtle two-tone notification chime synthesized via Web Audio API.
   */
  playChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.15);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.35);
    } catch {
      // Audio playback fails gracefully if unpermitted
    }
  }

  /**
   * Request browser notification permission.
   */
  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  /**
   * Sends a desktop/system notification if tab is in the background or permitted.
   */
  notify({ title, body, icon = '/gavel-club-logo.svg', tag = 'chat-message', onClick }) {
    this.playChime();

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        tag,
        badge: '/gavel-club-logo.svg',
        silent: true // sound is handled cleanly by our chime
      });

      if (typeof onClick === 'function') {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    } catch {
      // Notification creation fallback
    }
  }

  /**
   * Read receipt tracking per conversation
   */
  getReadMap() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_READS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  markConversationRead(conversationId, userEmail) {
    if (!conversationId || !userEmail) return;
    const cleanEmail = String(userEmail).trim().toLowerCase();
    const map = this.getReadMap();
    if (!map[conversationId]) map[conversationId] = {};
    map[conversationId][cleanEmail] = new Date().toISOString();
    localStorage.setItem(STORAGE_READS_KEY, JSON.stringify(map));
  }

  getLastRead(conversationId, userEmail) {
    if (!conversationId || !userEmail) return null;
    const cleanEmail = String(userEmail).trim().toLowerCase();
    const map = this.getReadMap();
    return map[conversationId]?.[cleanEmail] || null;
  }
}

export const notificationService = new NotificationService();
