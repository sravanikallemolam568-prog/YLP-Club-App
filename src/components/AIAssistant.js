// Floating AI Assistant Chat Widget powered by Google Gemini API

import { dbService } from '../services/dbService.js';
import { authService } from '../services/authService.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const API_KEY_STORAGE = 'pssgavel_gemini_key';
let chatHistory = [];
let isOpen = false;

function getClubContext() {
  const members = dbService.getMembers();
  const meetings = dbService.getMeetings();
  const nextMeeting = meetings.find(m => m.status === 'Upcoming') || meetings[0];
  const user = authService.getCurrentUser();

  return `
You are a smart AI assistant embedded in the PSS Miyapur Gavel Club app.
You help club members and EC officers with club-related questions.

Club name: PSS Miyapur Gavel Club
Current user: ${user?.name || 'Member'} (Role: ${user?.role || 'Member'})
Total members: ${members.length}
Active branches: Miyapur, GHMC, MKR
Total meetings held: ${meetings.length}
Next scheduled meeting: ${nextMeeting ? `${nextMeeting.date} at ${nextMeeting.startTime}, Branch: ${nextMeeting.branch}` : 'None scheduled'}
Gavelier of next meeting: ${nextMeeting?.roles?.Gavelier || 'TBD'}

You can:
- Answer questions about Gavel Club / Toastmasters roles and procedures
- Give info about attendance, members, speech programs, and meeting agendas
- Suggest tips for speeches, evaluations, and table topics
- Explain 10 Toastmasters roles (Gavelier, Sergeant, Topic Master, Timer, Ah-Counter, Listener, Evaluator, Videographer, General Evaluator, Activity Master)
- Help with general youth leadership and public speaking queries

Always be friendly, concise, and professional. Avoid making up data—use the context above.
`;
}

async function sendMessageToGemini(userMessage, apiKey) {
  chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const systemContext = getClubContext();

  const body = {
    system_instruction: { parts: [{ text: systemContext }] },
    contents: chatHistory
  };

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || 'API request failed');
  }

  const data = await response.json();
  const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
  chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
  return replyText;
}

function renderChatMessages() {
  const container = document.getElementById('ai-chat-messages');
  if (!container) return;

  if (chatHistory.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px 10px; color: var(--text-muted);">
        <div style="font-size: 2rem; margin-bottom: 8px;">🤖</div>
        <div style="font-size: 0.88rem; color: var(--text-secondary); font-weight: 600;">Hi! I'm your Gavel Club AI Assistant.</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Ask me anything about meetings, roles, speeches, or public speaking tips.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = chatHistory.map(msg => {
    const isUser = msg.role === 'user';
    const text = msg.parts?.[0]?.text || '';

    return `
      <div style="display: flex; flex-direction: ${isUser ? 'row-reverse' : 'row'}; gap: 8px; margin-bottom: 10px; align-items: flex-end;">
        <div style="width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
          background: ${isUser ? 'var(--gold-primary)' : 'rgba(99,102,241,0.2)'}; color: ${isUser ? '#000' : '#818CF8'};">
          <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div style="max-width: 78%; padding: 10px 13px; border-radius: ${isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
          background: ${isUser ? 'var(--gold-primary)' : 'var(--badge-bg)'}; 
          color: ${isUser ? '#000' : 'var(--text-primary)'}; 
          font-size: 0.84rem; line-height: 1.5;
          border: 1px solid ${isUser ? 'transparent' : 'var(--border-color)'};
          word-break: break-word;">
          ${text.replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
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
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      color: #FFFFFF; border: none; cursor: pointer;
      box-shadow: 0 6px 24px rgba(99,102,241,0.55);
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
        padding: 14px 16px; background: linear-gradient(135deg, #6366F1, #8B5CF6);
        color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-robot" style="font-size: 1.1rem;"></i>
          <div>
            <div style="font-weight: 800; font-size: 0.95rem;">Gavel Club AI Assistant</div>
            <div style="font-size: 0.72rem; opacity: 0.85;">Powered by Google Gemini</div>
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
          background: linear-gradient(135deg, #6366F1, #8B5CF6); border: none;
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

function getOrPromptApiKey() {
  let key = localStorage.getItem(API_KEY_STORAGE);
  if (!key || key.trim() === '') {
    key = prompt(
      '🤖 Gavel Club AI Assistant\n\nEnter your Google Gemini API Key to activate the AI assistant.\n\nGet a free key at: https://aistudio.google.com/app/apikey\n\nYour key is stored locally on this device only.'
    );
    if (key && key.trim()) {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    } else {
      return null;
    }
  }
  return key;
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
    renderChatMessages();
  });

  const handleSend = async () => {
    const message = input?.value.trim();
    if (!message) return;

    const apiKey = getOrPromptApiKey();
    if (!apiKey) return;

    input.value = '';
    input.style.height = 'auto';

    // Append user message immediately
    renderChatMessages();
    
    // Show loading indicator
    const messages = document.getElementById('ai-chat-messages');
    if (messages) {
      messages.innerHTML += `
        <div id="ai-typing-indicator" style="display: flex; gap: 8px; align-items: flex-end; margin-bottom: 10px;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: rgba(99,102,241,0.2); color: #818CF8; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;">
            <i class="fa-solid fa-robot"></i>
          </div>
          <div style="padding: 10px 14px; background: var(--badge-bg); border-radius: 14px 14px 14px 4px; border: 1px solid var(--border-color);">
            <span style="display: inline-flex; gap: 3px; align-items: center;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #818CF8; animation: bounce 1s infinite;"></span>
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #818CF8; animation: bounce 1s 0.15s infinite;"></span>
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #818CF8; animation: bounce 1s 0.3s infinite;"></span>
            </span>
          </div>
        </div>
      `;
      messages.scrollTop = messages.scrollHeight;
    }

    sendBtn.disabled = true;

    try {
      await sendMessageToGemini(message, apiKey);
    } catch (err) {
      // If auth error, clear stored key
      if (err.message.includes('API_KEY') || err.message.includes('invalid') || err.message.includes('400')) {
        localStorage.removeItem(API_KEY_STORAGE);
      }
      chatHistory.push({ role: 'model', parts: [{ text: `⚠️ Error: ${err.message}. Please try again or check your API key.` }] });
    }

    sendBtn.disabled = false;
    renderChatMessages();
  };

  sendBtn?.addEventListener('click', handleSend);

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Auto-resize textarea
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
