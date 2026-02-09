# ⭐ Message Pinning & Knowledge Asset System

## What's Been Implemented

### ✅ DOM Injection (Pin Button)
- **Pin buttons injected** into every message:
  - Small star icon (SVG) that toggles between outline and solid yellow
  - Positioned near native action buttons (Copy/Like)
  - Platform-specific placement:
    - **ChatGPT:** Bottom of message, near button group
    - **Claude:** Action bar area
    - **Fallback:** Creates container at end of message

### ✅ State Management
- **Pin/Unpin Toggle:**
  - Click pin button to toggle state
  - Saves message data to `chrome.storage.local`:
    - Message ID
    - Text snippet (first 100 characters)
    - Vertical offset
    - Timestamp
    - Platform
  - Updates button appearance (outline ↔ solid yellow)

### ✅ Minimap Visualization
- **Yellow Star Icons** on minimap:
  - Rendered at vertical position of pinned messages
  - Positioned **slightly to the left** of regular dots (4px vs 8px)
  - Clickable to scroll to pinned message
  - Hover shows snippet preview

### ✅ Pinned Dashboard
- **Pinned Items Section** in expanded sidebar:
  - Shows at top (above minimap)
  - Lists all pinned messages with snippets
  - Displays pin date
  - Click snippet to scroll to message
  - Only visible when sidebar is expanded and pins exist

### ✅ Persistence
- **Pins persist across reloads:**
  - Loaded from `chrome.storage.local` on page load
  - Pin buttons restored with correct state
  - Minimap stars appear immediately
  - Pinned dashboard populated automatically

---

## How It Works

### 1. Pin Button Injection
```javascript
// For each message:
1. Find or create button container
2. Create pin button with SVG star icon
3. Set initial state (pinned/unpinned)
4. Add click handler
5. Inject into message element
```

### 2. Pin Toggle Logic
```javascript
// On click:
1. Check current pin state
2. If pinned → Unpin (remove from storage)
3. If unpinned → Pin (save to storage)
4. Update button appearance
5. Update storage
6. Trigger sidebar update
```

### 3. Storage Structure
```javascript
pinnedMessages: {
  "msg-chatgpt-0-1234567890": {
    id: "msg-chatgpt-0-1234567890",
    snippet: "First 100 characters of message...",
    offset: 1234,
    timestamp: 1234567890000,
    platform: "chatgpt"
  },
  // ... more pinned messages
}
```

### 4. Minimap Rendering
```javascript
// Render order:
1. Session break dividers
2. Pinned stars (left side, 4px)
3. Message dots (right side, 8px, shifted if pinned)
```

### 5. Pinned Dashboard
```javascript
// Display:
- Header with star icon and count
- List of pinned items
- Each item shows:
  - Snippet (first 100 chars)
  - Pin date
  - Click to scroll
```

---

## Button Placement

### ChatGPT
- Looks for button group at bottom of message
- Selectors: `[class*="flex"] [class*="gap"]`, `.flex.items-center.gap`
- Falls back to creating container at end of message

### Claude
- Looks for action bar
- Selectors: `[class*="action"]`, `.flex.items-center`
- Falls back to creating container

### Universal Fallback
- Creates `.navigator-pin-container` div
- Appends to message element
- Styled with flexbox to match native buttons

---

## Snippet Extraction

The system extracts the first **100 characters** of message text:

1. **Tries multiple selectors:**
   - `p`, `div[class*="text"]`, `div[class*="message"]`
   - `.markdown`, `[class*="prose"]`, `pre`, `code`

2. **Falls back to:**
   - Element's `textContent` or `innerText`

3. **Truncates:**
   - First 100 characters
   - Adds "..." if longer

**Purpose:** Keep storage lightweight while providing useful previews.

---

## Visual Design

### Pin Button
- **Unpinned:** Outline star, 70% opacity
- **Pinned:** Solid yellow star (#fbbf24), 100% opacity
- **Hover:** Full opacity, subtle background
- **Size:** 16x16px SVG icon

### Minimap Stars
- **Color:** Yellow (#fbbf24)
- **Size:** 12px (3x3 in Tailwind)
- **Position:** Left side (4px from edge)
- **Hover:** Scale to 150%

### Pinned Dashboard
- **Header:** Yellow star icon + "Pinned Items" title
- **Items:** 
  - Border: Yellow tint (border-yellow-400/20)
  - Background: Semi-transparent
  - Hover: Highlight effect
  - Text: White with opacity levels

---

## Testing

### Step 1: Load Extension
1. Reload extension in `chrome://extensions/`
2. Visit ChatGPT or Claude
3. Open a conversation

### Step 2: Pin a Message
1. Look for star icon at bottom of a message
2. Click the star
3. Star should turn solid yellow
4. Console should show: `⭐ Pinned message: [id]`

### Step 3: Check Minimap
1. Expand sidebar
2. Look at minimap
3. You should see a **yellow star** on the left side
4. Star should be at the vertical position of the pinned message

### Step 4: Check Pinned Dashboard
1. Scroll to top of expanded sidebar
2. You should see "Pinned Items" section
3. Your pinned message snippet should appear
4. Click snippet → should scroll to message

### Step 5: Test Persistence
1. Reload the page
2. Pin buttons should still show as pinned
3. Minimap stars should still appear
4. Pinned dashboard should still show items

### Step 6: Unpin
1. Click the yellow star on a message
2. Star should turn to outline
3. Minimap star should disappear
4. Item should disappear from dashboard

---

## Troubleshooting

### Issue: Pin Buttons Not Appearing

**Check:**
1. Console for errors
2. Button container is being created
3. Messages are being detected

**Solution:**
- Verify `injectPinButtons()` is being called
- Check if button container selectors are correct
- Ensure messages have unique IDs

### Issue: Pins Not Persisting

**Check:**
1. `chrome.storage.local` in DevTools
2. Verify `pinnedMessages` object exists
3. Check for storage quota errors

**Solution:**
- Check storage quota (10MB limit)
- Verify storage permissions in manifest
- Check console for storage errors

### Issue: Stars Not on Minimap

**Check:**
1. `pinnedMessages` in storage
2. Message IDs match between storage and messagesData
3. Offset calculations are correct

**Solution:**
- Verify pinned message IDs match message IDs
- Check offset is being calculated correctly
- Ensure minimap container is rendering

### Issue: Dashboard Not Showing

**Check:**
1. Sidebar is expanded
2. `pinnedMessages` object has items
3. React state is updating

**Solution:**
- Verify sidebar `isExpanded` state
- Check `pinnedMessages` has keys
- Verify storage listener is working

---

## Storage Management

### Current Usage
- **Per pin:** ~200 bytes (ID + snippet + metadata)
- **100 pins:** ~20KB
- **1000 pins:** ~200KB
- **Well within 10MB limit**

### Cleanup (Future)
- Option to clear all pins
- Auto-remove pins for deleted messages
- Export pins to JSON

---

## Future Enhancements

### Pin Categories
- Organize pins by category/tag
- Filter pins by category
- Color-code pins

### Pin Notes
- Add custom notes to pins
- Search pins by note content
- Rich text notes

### Pin Export
- Export all pins to markdown
- Export to PDF
- Share pins with others

### Pin Search
- Search pinned messages
- Filter by date range
- Filter by platform

---

## Data Structure

### Pinned Message Object
```javascript
{
  id: "msg-chatgpt-0-1234567890",
  snippet: "First 100 characters of the message text...",
  offset: 1234, // Vertical position
  timestamp: 1234567890000, // When pinned
  platform: "chatgpt" // Platform identifier
}
```

### Storage Key
```javascript
chrome.storage.local.pinnedMessages = {
  [messageId]: PinnedMessageObject,
  // ... more pins
}
```

---

**Message Pinning is now live! Transform your chats into a searchable knowledge base. ⭐**
