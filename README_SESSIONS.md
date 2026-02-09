# 📚 Session Detection & Timeline Chapters

## What's Been Implemented

### ✅ Time Analysis
- **Timestamp Extraction** from messages:
  - ChatGPT: Checks for `<time>` elements, `datetime` attributes, `title` attributes
  - Claude: Looks for time elements with datetime
  - Gemini: Timestamp detection via time elements
  - **Fallback:** Incremental timestamps (1 hour per 10 messages) for development/testing

### ✅ Grouping Logic
- **`groupMessagesIntoSessions()` function:**
  - Groups messages based on time gaps
  - Default gap: **45 minutes** between messages
  - Creates session objects with:
    - Unique session ID
    - Title (formatted as "Session: [Date] [Time]")
    - Start/end timestamps
    - Array of message IDs in session
    - Array of message indices

### ✅ Session Breaks
- **Session Break objects** inserted between sessions:
  - ID for the break
  - Position (after which message)
  - Timestamp (middle of the gap)
  - Gap duration in minutes

### ✅ Sidebar UI Updates
- **Minimap Container:**
  - Thin horizontal lines (Session Dividers) between session groups
  - Dots highlighted when hovering over session titles
  - Visual hierarchy with larger dots for hovered sessions

- **Timeline View** (when sidebar expanded):
  - Lists all sessions as clickable chapters
  - Shows session title and message count
  - Hover effects highlight corresponding dots on minimap
  - Click to scroll to session start

### ✅ Visual Hierarchy
- **Hover Effects:**
  - When hovering over a session title, corresponding dots are highlighted
  - Dots in hovered session become larger (3px vs 2px)
  - Yellow ring appears around hovered session dots
  - Background color intensifies

### ✅ Persistence
- **Session titles stored** in `chrome.storage.local`
- User can rename sessions (placeholder for future feature)
- Titles persist across page reloads
- Merges with existing titles when sessions are recalculated

---

## How It Works

### 1. Timestamp Extraction
```javascript
// Tries multiple methods to find timestamp:
1. <time> element with datetime attribute
2. title attribute with date
3. data-time or data-timestamp attributes
4. Fallback: Incremental timestamps for testing
```

### 2. Session Grouping
```javascript
// Algorithm:
1. Iterate through messages in order
2. Calculate time gap between consecutive messages
3. If gap > 45 minutes:
   - End current session
   - Create session break
   - Start new session
4. Add message to current session
```

### 3. Visual Rendering
```javascript
// Minimap:
- Session dividers: Horizontal lines at break points
- Message dots: Colored by type (blue=AI, white=User)
- Hover highlighting: Dots in hovered session get larger + ring

// Timeline:
- List of sessions with titles
- Click to scroll to session start
- Hover to highlight dots
```

---

## Configuration

### Session Gap Duration
Default: **45 minutes**

To change, modify the `groupMessagesIntoSessions()` call:
```javascript
const { sessions, sessionBreaks } = groupMessagesIntoSessions(messagesData, 60); // 60 minutes
```

### Session Title Format
Current format: `"Session: [Month] [Day] [Time]"`

Example: `"Session: Dec 15 10:30 AM"`

To customize, modify `formatSessionTitle()` function.

---

## Testing

### Step 1: Load Extension
1. Reload extension in `chrome://extensions/`
2. Visit ChatGPT or Claude
3. Open a conversation with messages from different times

### Step 2: Check Console
You should see:
```
✅ Found X messages on [platform].
📚 Grouped into Y sessions.
```

### Step 3: View Sessions
1. Expand the sidebar
2. Scroll down to see "Timeline" section
3. You should see sessions listed with titles

### Step 4: Test Hover
1. Hover over a session title
2. Corresponding dots on minimap should highlight
3. Dots should become larger with yellow ring

### Step 5: Test Click
1. Click a session title
2. Page should scroll to first message in that session

### Step 6: Check Dividers
1. Look at minimap
2. You should see horizontal lines between sessions
3. Lines appear at session break points

---

## Development/Testing Mode

If timestamps aren't available (old chats), the system uses **incremental timestamps**:
- 1 hour gap for every 10 messages
- This creates visible session breaks for testing

Example:
- Messages 0-9: 1 hour ago
- Messages 10-19: 2 hours ago
- Messages 20-29: 3 hours ago
- etc.

This ensures you can see session dividers even in old chats without timestamps.

---

## Troubleshooting

### Issue: No Sessions Detected

**Check:**
1. Console for session count
2. Verify messages have timestamps
3. Check if gap threshold is too high

**Solution:**
- Lower the gap threshold (e.g., 30 minutes)
- Check timestamp extraction is working
- Verify messages are being detected

### Issue: Too Many Sessions

**Cause:** Gap threshold too low

**Solution:**
- Increase gap threshold (e.g., 60 or 90 minutes)
- Adjust based on your usage patterns

### Issue: Session Dividers Not Visible

**Check:**
1. Verify `sessionBreaks` array exists
2. Check minimap container height
3. Verify break positions are calculated

**Solution:**
- Ensure session breaks are being created
- Check minimap container is visible
- Verify offset calculations

### Issue: Hover Not Working

**Check:**
1. `hoveredSessionId` state is updating
2. Session message IDs match message IDs
3. CSS classes are applying

**Solution:**
- Check React DevTools for state
- Verify session.messageIds includes message.id
- Check browser console for errors

---

## Future Enhancements

### Session Renaming
Currently, session titles are auto-generated. Future feature:
- Click to edit session title
- Save to `chrome.storage.local`
- Persist across reloads

### Session Summarization
Future AI-powered feature:
- Summarize session content
- Generate better titles
- Extract key topics

### Session Filtering
- Filter timeline by date range
- Search sessions by title
- Collapse/expand sessions

### Session Statistics
- Message count per session
- Average response time
- Most active time of day

---

## Data Structure

### Session Object
```javascript
{
  id: "session-1234567890",
  title: "Session: Dec 15 10:30 AM",
  startTime: 1234567890000,
  endTime: 1234567895000,
  messageIds: ["msg-1", "msg-2", ...],
  messageIndices: [0, 1, 2, ...]
}
```

### Session Break Object
```javascript
{
  id: "break-msg-1-msg-2",
  afterMessageIndex: 5,
  timestamp: 1234567892500,
  gapMinutes: 60
}
```

---

**Sessions are now working! Your long chats are organized into chapters. 🎉**
