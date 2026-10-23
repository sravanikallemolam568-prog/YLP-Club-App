# Club Connect — Complete UI/UX Redesign & Feature Walkthrough

Welcome to the comprehensive walkthrough guide for the redesigned **Club Connect** platform in the **PSS Miyapur Gavel Club** application.

---

## 1. Executive Summary

The Club Connect module has been completely redesigned from an overcrowded, multi-section page into a **modern, chat-first communication hub**. 

### Key Improvements Delivered:
- **Chat-First 4-Tab Navigation**: Organized into `Chat`, `Meetings`, `EC Contacts`, and `Support & Handbook`.
- **Hierarchical Real-Time Messaging**: Split-pane layout with dedicated channels (`General Club Discussion`, `EC Executive Chamber`) and private 1-on-1 direct conversations with each EC officer.
- **Message Delivery Status**: Real-time delivery ticks (`⏳ Sending...`, `✓ Sent`, `⚠️ Failed` with 1-click Retry).
- **Multi-Device / Multi-Tab Synchronization**: Real-time cross-tab updates via browser `BroadcastChannel` (instant local mode) and Firestore `onSnapshot` (cloud mode) without requiring page reloads.
- **Genuine In-App WebRTC Video Calling**: Full video conferencing powered by the Jitsi Meet WebRTC External API—complete with mic/camera toggles, screen sharing, tile grid view, and participant management inside an in-app modal overlay.
- **Strict 3-Tier Privacy Enforcement**:
  - **Tier 1 (President & Club Advisor)**: Full supervisory visibility across all club communications and direct inquiries.
  - **Tier 2 (EC Officers)**: Access to General, EC Executive Chamber, and their assigned direct communications.
  - **Tier 3 (Club Members)**: Access to General discussion and **strictly their own 1-on-1 direct conversations**. Other members' direct messages and the EC Executive Chamber are completely hidden and blocked.
- **Hardened Cloud Security Rules**: Updated `firestore.rules` to prevent sender impersonation, enforce message length constraints, and validate room permissions on the server.

---

## 2. Interface Tour & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  [💬 Chat]     [📅 Meetings (1)]     [👥 EC Contacts (7)]     [❓ Support] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ 🔍 Search chats...     │  │ 📢 General Club Discussion           │  │
│  ├────────────────────────┤  │ 👥 All club members and leadership    │  │
│  │ CHANNELS               │  │ [🎥 In-App Video Call]               │  │
│  │ • 📢 General Club      │  ├──────────────────────────────────────┤  │
│  │ • 🛡️ EC Leadership (EC)│  │ [Load earlier messages]              │  │
│  │                        │  │                                      │  │
│  │ DIRECT WITH EC OFFICERS│  │ 👤 Member: @President speech topic   │  │
│  │ • 👑 Sravani Kallemolam│  │            Today 11:20 AM  ✓         │  │
│  │ • 🎓 TM Ajith          │  │ 👑 President: Approved! Good luck.   │  │
│  │ • 📚 VP Education      │  │            Today 11:22 AM            │  │
│  │ • 👥 VP Membership     │  ├──────────────────────────────────────┤  │
│  │ • 📢 VP Public Rel.    │  │ @Mention: [@President] [@VP-Education]│  │
│  │ • 📝 Secretary         │  ├──────────────────────────────────────┤  │
│  │ • 🛡️ Sergeant-at-Arms  │  │ [ Type a message...          ] [Send]│  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Chat (Default Screen)
1. **Left Conversation Sidebar**:
   - **Search Filter**: Instantly filters channels and officers by name or keyword.
   - **Channels**:
     - `📢 General Club Discussion`: Open to all club members, officers, and guests.
     - `🛡️ EC Executive Chamber`: Supervisory room visible and accessible strictly to Tier 1 & 2 officers.
   - **Direct 1-on-1 Messages**: Direct channels with each elected officer:
     - 👑 **Sravani Kallemolam** (President)
     - 🎓 **TM Ajith** (Club Advisor & Mentor)
     - 📚 **VP Education**
     - 👥 **VP Membership**
     - 📢 **VP Public Relations**
     - 📝 **Secretary**
     - 🛡️ **Sergeant-at-Arms**
   - **Badges & Snippets**: Displays last message preview, timestamp, and unread count badges.
2. **Right Active Chat Pane**:
   - **Header**: Shows active channel/officer, presence subtitle, and **Video Call** shortcut button.
   - **Message Feed**: Grouped bubbles with sender badges (👑 President, 🛡️ Officer, 👤 Member), `@mention` highlight tags, timestamps, delivery ticks, and deletion controls.
   - **Quick Mention Chips**: Clickable buttons (`@President`, `@TM-Ajith`, `@VP-Education`, etc.) that insert formatted tags directly into the input.
   - **Input Bar**: Auto-expanding input field with keyboard submit and loading states.
   - **Mobile Responsiveness**: On screens `< 768px`, the split-pane automatically switches to an intuitive single-pane view with a top back button.

---

### Tab 2: Meetings
1. **Upcoming Sessions**: Cards displaying meeting date, time, branch location, and session status (`Upcoming`, `Live`, `Ended`).
2. **Instant Video Call Access**:
   - **Join In-App Call**: Launches WebRTC audio/video call inside the application with 1 click.
   - **External Link**: Opens Google Meet, Zoom, or Microsoft Teams if configured.
3. **Meeting Call Settings (Tier 1 & 2 Authority)**:
   - Expandable settings drawer allowing leaders to configure the meeting platform and custom call URL.

---

### Tab 3: EC Contacts Directory
1. **Officer Cards**: Profile cards displaying officer initials/avatar, official club role, Tier badge, phone, and email.
2. **"Message" Action**: Clicking **Message** instantly switches to the **Chat** tab and selects the 1-on-1 direct conversation with that officer.
3. **Filter**: Search bar to locate officers by name or role title.

---

### Tab 4: Support & Role Handbook
Subdivided into three clean subtabs:
1. **Support Tickets**:
   - Form to raise inquiries with category selection (`Meeting Access`, `Mentoring`, `Attendance`, `Event Query`, `General Help`), title, and details.
   - Real-time ticket list with status badges (`Open`, `In Progress`, `Resolved`) and status management dropdown for EC officers.
2. **Frequently Asked Questions (FAQs)**:
   - Interactive accordion answering common member questions regarding speech roles, meeting access, and privacy.
3. **Role Handbook & Permissions Matrix**:
   - Complete table outlining dashboard access and operational permissions for the President, VP Education, VP Membership, VP PR, Secretary, and Sergeant-at-Arms.

---

## 3. Technology Stack & New Services

### 1. In-App Video Service (`src/services/videoService.js`)
- Uses the **Jitsi Meet WebRTC External API**.
- Dynamically loads `https://meet.jit.si/external_api.js` on demand.
- Integrates local and remote audio/video tracks directly inside the `#cc-video-stage-container` element.
- Provides microphone toggle, camera toggle, screen share, tile view, and hang-up controls.
- Ensures total resource cleanup (`api.dispose()`) when closing the modal, releasing hardware camera/mic devices cleanly.

### 2. Notification Service (`src/services/notificationService.js`)
- Requests browser Web Notification permissions gracefully.
- Synthesizes a clean two-tone audio chime (587.33 Hz to 880 Hz to 1174.66 Hz) using the browser's native **Web Audio API** (`AudioContext`), avoiding external audio asset dependencies.
- Tracks unread message counts per conversation in local storage.

### 3. Database Service Enhancements (`src/services/dbService.js`)
- Updated `addECChatMessage(messageData)` to support:
  - `conversationId`: Segmenting messages into `general`, `ec-leadership`, or `dm_...`.
  - `status`: Optimistic states (`sending`, `sent`, `failed`).
  - `clientTempId`: Deduplication key.
- Dispatches changes to `BroadcastChannel('pssgavel_chat_channel')` for instant sub-10ms cross-tab updates.

### 4. Security Rules (`firestore.rules`)
- Enforces server-side conversation privacy:
  - Read access to `ec-leadership` requires verified leadership roles.
  - Read access to direct message documents requires caller to match `senderEmail`, `recipientEmail`, or be a club leader.
  - Write access enforces non-empty content (1–3000 chars) and validates `senderEmail == request.auth.token.email`.

### 5. Backend Cloud Function (`functions/index.js`)
- Added `generateVideoCallToken` callable function to issue authorized room credentials.

---

## 4. How to Run and Test Locally

### Step 1: Start the Development Server
Open PowerShell in the project directory:
```powershell
cd C:\Users\itsme\Downloads\YLP-Club-App-main\YLP-Club-App-main
npm run dev
```

### Step 2: Test Real-Time Messaging Across Two Windows
1. Open two browser windows side by side (e.g. Chrome and Chrome Incognito):
   - **Window A (President / Super Admin)**:
     - Sign in using Email: `sravanikallemolam568@gmail.com`, Phone: `9014231403`, Password: `123456`.
     - Open **Club Connect**.
     - Notice that both **General Club Discussion** and **EC Executive Chamber** are visible in the sidebar.
   - **Window B (Regular Club Member - Tier 3)**:
     - Sign in with a registered member credential from your member roster.
     - Open **Club Connect**.
     - Notice that **EC Executive Chamber** is hidden from this member.
2. In Window B (Member), select **Direct with EC Officers** -> **Sravani Kallemolam (President)**.
3. Send a message: `@President I have a doubt regarding speech project 2`.
4. In Window A (President), observe:
   - A notification chime plays.
   - The message bubble appears instantly with a green/teal indicator.
   - The President can reply directly.

### Step 3: Test In-App Video Calling
1. In either window, click **Start / Join In-App Call** in the chat header or in the **Meetings** tab.
2. A high-resolution video overlay will launch.
3. Allow camera/microphone access in your browser prompt.
4. Verify audio and video controls (mute microphone, turn video off, tile view).
5. Click **Leave Call** (red button) to cleanly disconnect and release media hardware.

---

## 5. Pushing Updates to GitHub

To push the committed changes to your repository (`https://github.com/sravanikallemolam568-prog/YLP-Club-App.git`):

Run the automated helper script from your terminal:
```powershell
cd C:\Users\itsme\Downloads\YLP-Club-App-main
.\push.bat
```
*(Or simply double-click `push.bat` in File Explorer)*
