# 🚀 AI Navigator - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Load Extension into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in top right corner)
3. Click **Load unpacked**
4. Select this project folder (`AI NAVIGATOR`)
5. The extension should now appear in your extensions list

### Step 2: Test It

1. Visit [ChatGPT](https://chatgpt.com) or [Claude](https://claude.ai)
2. Open a conversation with multiple messages
3. Open Developer Console (`F12` or `Cmd+Option+I` on Mac)
4. You should see: `🚀 AI Navigator Extension Active!`
5. You should see: `✅ Found X messages on [platform].`

### Step 3: Verify Popup

1. Click the extension icon in Chrome toolbar
2. Popup should show status and message count

---

## Project Structure

```
AI NAVIGATOR/
├── manifest.json          # Extension configuration
├── content.js            # Script that runs on AI chat pages
├── content.css           # Styles for the extension
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
└── icons/                # Extension icons (create these)
```

---

## Next Steps

### 1. Create Icons (Optional for now)

Create an `icons/` folder and add:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

For now, the extension will work without icons (Chrome will show a default).

### 2. Build the Minimap UI

Once the basic extension is working, you can:

1. Create a React sidebar component
2. Inject it into the chat page
3. Build the minimap visualization
4. Add message pinning functionality

---

## How It Works

### Content Script (`content.js`)

- Runs on AI chat pages (ChatGPT, Claude, Gemini, Grok)
- Scans the page for messages every 2 seconds
- Uses MutationObserver to detect new messages
- Stores message count in `chrome.storage.local`

### Message Detection

The script detects messages using platform-specific selectors:

- **ChatGPT**: `article`, `[data-message-author-role]`
- **Claude**: `.font-user-message`, `.font-claude-message`
- **Gemini**: `[data-message-id]`, `.message`
- **Grok**: `[data-testid*="message"]`, `.message-content`

---

## Troubleshooting

### Extension not loading?
- Make sure Developer Mode is enabled
- Check for errors in `chrome://extensions/` (click "Errors" button)
- Verify `manifest.json` is valid JSON

### No messages detected?
- Open Console (`F12`) and check for errors
- The selectors might need updating if the AI platform changed their HTML
- Try refreshing the page

### Popup not working?
- Check `popup.html` and `popup.js` are in the root folder
- Verify manifest.json has correct popup path

---

## Development Tips

### Reload Extension After Changes

1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension card
3. Refresh the AI chat page

### Debug Content Script

1. Open AI chat page
2. Open Developer Console (`F12`)
3. Look for console.log messages from `content.js`

### Debug Popup

1. Right-click extension icon → "Inspect popup"
2. Opens DevTools for the popup

---

## Storage API

The extension uses `chrome.storage.local` to store data:

```javascript
// Save data
chrome.storage.local.set({ messageCount: 10 });

// Read data
chrome.storage.local.get(['messageCount'], (result) => {
  console.log(result.messageCount);
});
```

**Storage Limit**: 10MB (roughly 5 million words)

---

## Ready for Next Phase?

Once this basic setup is working, you can build:

1. **Minimap UI** - Visual representation of the chat
2. **Message Pinning** - Star important messages
3. **Session Detection** - Group messages by time
4. **Search** - Fast local search
5. **Timestamps** - Add time metadata

---

**Happy Building! 🚀**
