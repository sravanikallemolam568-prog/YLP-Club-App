// Floating AI Assistant Chat Widget powered by Google Gemini API

import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';
import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';
import { showToast } from './Modal.js';

const GEMINI_RETRY_DELAYS_MS = [1000, 2000];
let chatHistory = [];
let isOpen = false;
let isRequestInFlight = false;
let lastFailedPrompt = '';
let handleSendMessage = null;

function classifyGeminiError(err) {
  const code = (err?.code || '').toLowerCase();
  const message = (err && err.message ? String(err.message) : '').toLowerCase();

  if (code.includes('unauthenticated')) return 'Sign in again to use the club assistant.';
  if (code.includes('permission-denied')) return 'Your club account is not authorized to use the assistant.';
  if (code.includes('resource-exhausted')) return 'Gemini usage limit reached. Please try again later.';
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) return 'Gemini is temporarily busy. Please try again in a moment.';
  if (!message) return 'Something went wrong with the AI Assistant. Please try again.';
  if (message.includes('server .env file')) return 'Add GEMINI_API_KEY to the local .env file and restart Vite to enable the assistant.';
  if (message.includes('api key') || message.includes('invalid api key') || message.includes('invalid key') || message.includes('authentication')) {
    return 'Gemini API key is invalid. Please check the API configuration.';
  }
  if (message.includes('quota') || message.includes('rate limit') || message.includes('resource_exhausted') || message.includes('429') || message.includes('limit reached')) {
    return 'Gemini usage limit reached. Please try again later.';
  }
  if (message.includes('high demand') || message.includes('temporarily busy') || message.includes('503') || message.includes('too many requests') || message.includes('unavailable') && message.includes('service')) {
    return 'Gemini is temporarily busy. Please try again in a moment.';
  }
  if (message.includes('model not found') || message.includes('404') || message.includes('model unavailable') || message.includes('not found') && message.includes('model')) {
    return 'The selected Gemini model is currently unavailable.';
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Unable to connect to Gemini. Please check your internet connection.';
  }
  return 'Something went wrong with the AI Assistant. Please try again.';
}

function getLocalClubContext() {
  const user = authService.getCurrentUser();
  return {
    asOf: new Date().toISOString().slice(0, 10),
    currentUser: { name: user?.name || 'Local user', role: user?.role || 'President', branch: user?.branch || 'Miyapur' },
    members: dbService.getMembers().map(({ id, name, branch, mentor, speechesCompleted, speechProgressPct, status }) => ({
      id, name, branch, mentor, speechesCompleted, speechProgressPct, status
    })),
    meetings: dbService.getMeetings(),
    attendance: dbService.getAttendance(),
    speechProgram: dbService.getSpeechList(),
    mentors: dbService.getMentors().map(({ id, juniorName, mentorName, speechScope, assignedDate }) => ({
      id, juniorName, mentorName, speechScope, assignedDate
    })),
    committee: Object.fromEntries(Object.entries(dbService.getECCommittee()).filter(([key]) => !key.toLowerCase().includes('email'))),
    media: dbService.getMedia().map(({ title, category, type, description, date, uploadedBy, meetingId }) => ({
      title, category, type, description, date, uploadedBy, meetingId
    }))
  };
}

async function sendMessageToGemini(userMessage) {
  const history = chatHistory.filter(message => !message.isError).slice(0, -1).slice(-8).map(message => ({
    role: message.role,
    text: message.parts?.[0]?.text || ''
  }));

  let replyText;
  if (functions) {
    const callAssistant = httpsCallable(functions, 'geminiAssistant', { timeout: 60000 });
    const result = await callAssistant({ message: userMessage, history });
    replyText = result.data?.text?.trim();
  } else if (import.meta.env.DEV) {
    const response = await fetch('/api/gemini-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, history, context: getLocalClubContext() })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.error || `Assistant request failed (${response.status}).`);
      error.status = response.status;
      throw error;
    }
    replyText = result.text?.trim();
  } else {
    throw new Error('Configure Firebase to use the AI Assistant in the deployed app.');
  }

  if (!replyText) throw new Error('The assistant returned no answer.');
  return replyText;
}

function isTransientGeminiError(error) {
  const message = (error?.message || '').toLowerCase();
  return error?.name === 'AbortError' ||
    ['functions/unavailable', 'functions/deadline-exceeded', 'functions/internal'].includes(error?.code) ||
    [500, 502, 503, 504].includes(error?.status) ||
    message.includes('high demand') ||
    message.includes('temporarily busy') ||
    message.includes('overloaded');
}

async function sendMessageWithRetry(userMessage) {
  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await sendMessageToGemini(userMessage);
    } catch (error) {
      if (!isTransientGeminiError(error) || attempt === GEMINI_RETRY_DELAYS_MS.length) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, GEMINI_RETRY_DELAYS_MS[attempt]));
    }
  }
  throw new Error('Gemini request could not be completed.');
}

function bindRetryActions() {
  document.querySelectorAll('[data-retry-message]').forEach(button => {
    button.onclick = () => {
      const retryMessage = button.dataset.retryMessage || '';
      if (retryMessage && typeof handleSendMessage === 'function') {
        handleSendMessage(retryMessage);
      }
    };
  });
}

function renderChatMessages() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  if (chatHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px 10px; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">🤖</div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); font-weight: 600;">Hi! I'm your Gavel Club Assistant.</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Ask about club records, app sections, meeting roles, or speeches.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = chatHistory.map(msg => {
    const isUser = msg.role === 'user';
    const text = msg.parts?.[0]?.text || '';
    const retryButton = msg.isError && msg.retryPrompt ? `
      <div style="margin-top: 8px; display: flex; justify-content: flex-start;">
        <button type="button" class="btn btn-outline btn-sm" data-retry-message="${escapeHtml(msg.retryPrompt)}" style="font-size: 0.75rem; padding: 6px 10px; border-radius: 10px;">
          Try Again
        </button>
      </div>
    ` : '';

    return `
      <div style="display: flex; flex-direction: ${isUser ? 'row-reverse' : 'row'}; gap: 8px; margin-bottom: 10px; align-items: flex-end;">
        <div style="width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
          background: ${isUser ? 'var(--teal-primary)' : 'rgba(69,201,189,0.18)'}; color: ${isUser ? '#123532' : 'var(--teal-deep)'};">
          <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div style="max-width: 78%; padding: 10px 13px; border-radius: ${isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
          background: ${isUser ? 'var(--gold-primary)' : 'var(--badge-bg)'}; 
          color: ${isUser ? '#000' : 'var(--text-primary)'}; 
          font-size: 0.84rem; line-height: 1.5;
          border: 1px solid ${isUser ? 'transparent' : 'var(--border-color)'};
          word-break: break-word;">
          ${escapeHtml(text).replace(/\n/g, '<br>')}
          ${retryButton}
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
  bindRetryActions();
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function injectChatUI() {
  // Remove existing if present
  document.getElementById('ai-chat-widget')?.remove();

  const widget = document.createElement('div');
  widget.id = 'ai-chat-widget';
  widget.innerHTML = `
    <!-- Floating Trigger Button -->
    <button id="ai-chat-toggle-btn" style="
      position: fixed; bottom: 88px; right: 18px; z-index: 9998;
      width: 54px; height: 54px; border-radius: 50%;
      background: linear-gradient(135deg, var(--teal-primary), var(--teal-deep));
      color: #FFFFFF; border: none; cursor: pointer;
      box-shadow: 0 6px 24px rgba(30,125,118,0.35);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.35rem; transition: transform 0.2s ease;
    " title="AI Assistant">
      <i class="fa-solid fa-robot"></i>
    </button>

    <!-- Chat Panel -->
    <div id="ai-chat-panel" style="
      position: fixed; bottom: 158px; right: 14px; z-index: 9997;
      width: min(360px, calc(100vw - 28px)); height: 480px;
      background: var(--bg-card, #0F1A2B); border: 1px solid var(--border-color, rgba(255,255,255,0.1));
      border-radius: 20px; box-shadow: 0 12px 48px rgba(0,0,0,0.5);
      display: none; flex-direction: column; overflow: hidden;
    ">
      <!-- Panel Header -->
      <div style="
        padding: 14px 16px; background: linear-gradient(135deg, var(--teal-primary), var(--teal-deep));
        color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-robot" style="font-size: 1.1rem;"></i>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">Gavel Club AI Assistant</div>
            <div title="Your question and role-appropriate club data are sent to Google Gemini for a reply." style="font-size: 0.72rem; opacity: 0.9;">Gemini · live club context</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="ai-clear-btn" style="background: rgba(255,255,255,0.15); border: none; color: #FFF; border-radius: 8px; padding: 4px 8px; cursor: pointer; font-size: 0.75rem;">
            <i class="fa-solid fa-trash"></i>
          </button>
          <button id="ai-chat-close-btn" style="background: rgba(255,255,255,0.15); border: none; color: #FFF; border-radius: 8px; padding: 4px 8px; cursor: pointer; font-size: 0.9rem;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <!-- Messages Area -->
      <div id="ai-chat-messages" style="
        flex: 1; overflow-y: auto; padding: 14px 12px;
        scroll-behavior: smooth;
      "></div>

      <!-- Input Bar -->
      <div style="
        padding: 10px 12px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.1));
        display: flex; gap: 8px; align-items: flex-end; background: var(--bg-card, #0F1A2B); flex-shrink: 0;
      ">
        <textarea id="ai-chat-input" placeholder="Ask me about meetings, speeches, roles..." style="
          flex: 1; border-radius: 12px; border: 1px solid var(--border-color, rgba(255,255,255,0.1));
          background: var(--badge-bg, rgba(255,255,255,0.05)); color: var(--text-primary, #FFF);
          padding: 10px 13px; font-size: 0.84rem; resize: none; outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif; min-height: 42px; max-height: 100px;
          line-height: 1.4;
        " rows="1"></textarea>
        <button id="ai-send-btn" style="
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--teal-primary), var(--teal-deep)); border: none;
          color: #FFF; cursor: pointer; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s ease;
        ">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);
  bindWidgetEvents();
  renderChatMessages();
}

function bindWidgetEvents() {
  const toggleBtn = document.getElementById('ai-chat-toggle-btn');
  const closeBtn = document.getElementById('ai-chat-close-btn');
  const clearBtn = document.getElementById('ai-clear-btn');
  const sendBtn = document.getElementById('ai-send-btn');
  const input = document.getElementById('ai-chat-input');
  const panel = document.getElementById('ai-chat-panel');

  toggleBtn?.addEventListener('click', () => {
    isOpen = !isOpen;
    if (panel) panel.style.display = isOpen ? 'flex' : 'none';
    renderChatMessages();
    if (isOpen) input?.focus();
  });

  closeBtn?.addEventListener('click', () => {
    isOpen = false;
    if (panel) panel.style.display = 'none';
  });

  clearBtn?.addEventListener('click', () => {
    chatHistory = [];
    lastFailedPrompt = '';
    renderChatMessages();
  });

  const showThinkingIndicator = () => {
    const messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    const indicator = document.getElementById('ai-typing-indicator');
    if (indicator) return;

    messages.insertAdjacentHTML('beforeend', `
      <div id="ai-typing-indicator" style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 10px;">
        <div style="width: 30px; height: 30px; border-radius: 50%; background: rgba(69,201,189,0.18); color: var(--teal-deep); display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
          <i class="fa-solid fa-robot"></i>
        </div>
        <div style="padding: 10px 14px; background: var(--badge-bg); border-radius: 14px 14px 14px 4px; border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 0.8rem;">
          AI is thinking...
        </div>
      </div>
    `);
    messages.scrollTop = messages.scrollHeight;
  };

  const hideThinkingIndicator = () => {
    const indicator = document.getElementById('ai-typing-indicator');
    indicator?.remove();
  };

  const handleSend = async (retryPrompt = null) => {
    const message = (retryPrompt ?? input?.value ?? '').trim();
    if (!message) {
      showToast('Please enter a message before sending.', 'info');
      return;
    }
    if (isRequestInFlight) return;

    isRequestInFlight = true;
    lastFailedPrompt = message;
    input.value = '';
    input.style.height = 'auto';

    chatHistory.push({ role: 'user', parts: [{ text: message }] });
    renderChatMessages();
    showThinkingIndicator();
    sendBtn.disabled = true;

    try {
      const replyText = await sendMessageWithRetry(message);
      chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
      hideThinkingIndicator();
      renderChatMessages();
    } catch (error) {
      const friendlierMessage = classifyGeminiError(error);
      hideThinkingIndicator();
      chatHistory.push({
        role: 'model',
        parts: [{ text: friendlierMessage }],
        isError: true,
        retryPrompt: message
      });
      renderChatMessages();
    } finally {
      isRequestInFlight = false;
      sendBtn.disabled = false;
    }
  };

  handleSendMessage = handleSend;

  sendBtn?.addEventListener('click', () => handleSend());

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  input?.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

}

// Add bounce animation for typing indicator
const bounceStyle = document.createElement('style');
bounceStyle.textContent = `
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
  #ai-chat-toggle-btn:hover { transform: scale(1.1); }
`;
document.head.appendChild(bounceStyle);

export function initAIAssistant() {
  injectChatUI();
}
