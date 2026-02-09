# 🗺️ Minimap Logic & Message Mapping

## What's Been Implemented

### ✅ Data Collection
- **Enhanced `findMessages()` function** now returns detailed message data:
  - Unique ID for each message
  - Vertical offset from scroll container
  - Message type (User or AI)
  - Index position

### ✅ Coordinate Mapping
- **`mapOffsetToPercentage()` function** in Sidebar:
  - Maps message vertical position to minimap percentage
  - Formula: `(offset / containerHeight) * 100`
  - Handles edge cases (clamps between 0-100%)

### ✅ Rendering Dots
- **Interactive dots** rendered on minimap:
  - **AI Dots:** Blue (`bg-blue-400/80`)
  - **User Dots:** White/Gray (`bg-white/60`)
  - Hover effects (scale + shadow)
  - Positioned using absolute positioning with percentage-based top

### ✅ Jump Feature
- **Click handler** on each dot:
  - Sends `postMessage` to content script
  - Content script scrolls to message using `scrollIntoView`
  - Smooth scrolling with `behavior: 'smooth'`
  - Brief highlight effect (blue background flash)

### ✅ Real-Time Syncing
- **Multiple update mechanisms:**
  - `MutationObserver` detects DOM changes
  - `chrome.storage.onChanged` listener for storage updates
  - Polling interval (1 second) as backup
  - Updates message positions on scroll/resize

---

## How It Works

### 1. Message Detection
```javascript
// Finds messages on page
// Detects type (User/AI) based on platform
// Calculates vertical offset
// Stores in chrome.storage
```

### 2. Position Calculation
```javascript
// Gets scrollable container (handles virtual scrolling)
// Calculates relative position: elementTop - containerTop
// Maps to percentage: (offset / containerHeight) * 100
```

### 3. Dot Rendering
```javascript
// Maps each message to a dot
// Position: top: `${percentage}%`
// Color: Blue for AI, White for User
// Click handler: scrolls to message
```

### 4. Scrolling
```javascript
// Sidebar sends postMessage
// Content script receives message
// Finds element by ID
// Scrolls with smooth behavior
// Highlights message briefly
```

---

## Platform-Specific Detection

### ChatGPT
- Selectors: `article`, `[data-message-author-role]`
- Type detection: `data-message-author-role` attribute

### Claude
- Selectors: `.font-user-message`, `.font-claude-message`
- Type detection: CSS class names

### Gemini
- Selectors: `[data-message-id]`, `.message`
- Type detection: `data-role` attribute

### Grok
- Selectors: `[data-testid*="message"]`
- Type detection: test ID patterns

---

## Virtual Scrolling Support

The code handles virtual scrolling by:

1. **Finding scrollable container:**
   - Checks for `main`, `[role="main"]`, or elements with overflow
   - Falls back to `document.body`

2. **Calculating relative positions:**
   - Uses container's `scrollHeight` instead of document height
   - Accounts for container's top offset

3. **Real-time updates:**
   - MutationObserver detects when messages are added/removed
   - Recalculates positions on scroll

---

## Testing the Minimap

### Step 1: Load Extension
1. Reload extension in `chrome://extensions/`
2. Visit ChatGPT or Claude
3. Open a conversation with multiple messages

### Step 2: Check Console
You should see:
```
✅ Found X messages on [platform].
```

### Step 3: See the Dots
1. Expand the sidebar (click arrow)
2. Look at the minimap container
3. You should see dots representing messages:
   - **Blue dots** = AI messages
   - **White dots** = User messages

### Step 4: Test Clicking
1. Click any dot
2. Page should smoothly scroll to that message
3. Message should briefly highlight in blue

---

## Troubleshooting

### Issue: No Dots Appearing

**Check:**
1. Console for message detection logs
2. `chrome.storage.local` in DevTools → Application → Storage
3. Verify `messagesData` array exists

**Solution:**
- Refresh the page
- Check if messages are being detected
- Verify platform selectors are correct

### Issue: Dots in Wrong Position

**Cause:** Virtual scrolling or container detection issue

**Solution:**
- Check `containerHeight` in storage
- Verify scrollable container is detected correctly
- May need to adjust `getScrollableContainer()` function

### Issue: Clicking Doesn't Scroll

**Check:**
1. Console for postMessage errors
2. Verify `window.navigatorMessageElements` Map exists
3. Check if message ID matches

**Solution:**
- Ensure element references are stored
- Verify postMessage is working
- Check for CSP (Content Security Policy) blocking

### Issue: Dots Not Updating

**Check:**
1. MutationObserver is running
2. Storage listener is active
3. Polling interval is working

**Solution:**
- Check console for errors
- Verify storage updates are happening
- May need to increase polling frequency

---

## Performance Considerations

### Current Implementation
- **Polling:** 1 second interval (can be optimized)
- **MutationObserver:** Watches entire body (can be scoped)
- **Storage:** Stores all message data (scales to ~1000 messages)

### Optimizations (Future)
1. **Debounce updates:** Wait for scroll to stop before recalculating
2. **Throttle MutationObserver:** Limit callback frequency
3. **Virtual rendering:** Only render visible dots
4. **Lazy loading:** Load message data on demand

---

## Next Steps

Now that minimap is working, you can add:

1. **Session Detection** - Group dots by time gaps
2. **Message Pinning** - Highlight important messages
3. **Search** - Filter dots by keyword
4. **Zoom** - Zoom in/out on minimap
5. **Current Position Indicator** - Show where you are in chat

---

**The minimap is now functional! Click dots to jump to messages. 🎉**
