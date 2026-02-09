# 🚀 Quick Start - Test the Sidebar UI

## Step 1: Reload Extension

1. Go to `chrome://extensions/`
2. Find "AI Chat Navigator"
3. Click the **refresh icon** (🔄) to reload
4. Make sure it's **enabled** (toggle should be blue)

## Step 2: Visit AI Platform

1. Open a new tab
2. Go to [ChatGPT](https://chatgpt.com) or [Claude](https://claude.ai)
3. Open any conversation (or start a new one)

## Step 3: Open Console

Press `F12` (or `Cmd+Option+I` on Mac) to open Developer Console

## Step 4: Check Logs

You should see these messages in order:

```
🚀 AI Navigator Extension Active!
✅ React and ReactDOM loaded
✅ Sidebar script loaded
✅ Sidebar component registered
✅ Sidebar initialized in Shadow DOM
✅ Found X messages on [platform].
```

## Step 5: See the Sidebar! 🎉

Look at the **right side of your screen**. You should see:

- A **translucent sidebar** (16px wide by default)
- **Glassmorphism effect** (blurred, semi-transparent)
- **Pin icon** at the top
- **Arrow button** to expand/collapse

### If You See the Sidebar:
✅ **SUCCESS!** The UI is working. You can now:
- Click the arrow to expand (320px wide)
- See the minimap container
- View message count

### If You Don't See the Sidebar:

#### Check 1: Console Errors
- Look for red error messages
- Common issues:
  - `Failed to load sidebar.js` → Check manifest.json
  - `React is not defined` → CDN loading issue
  - `Cannot read property 'createRoot'` → ReactDOM not loaded

#### Check 2: Shadow DOM
1. Right-click on the page → **Inspect**
2. Look for `#navigator-root` in the HTML
3. Expand it to see `#shadow-root`
4. Check if React component is inside

#### Check 3: Network Tab
1. Open **Network** tab in DevTools
2. Look for:
   - `react.production.min.js` (should be 200 OK)
   - `react-dom.production.min.js` (should be 200 OK)
   - `sidebar.js` (should be 200 OK)

#### Check 4: Extension Permissions
1. Go to `chrome://extensions/`
2. Click **Details** on your extension
3. Check **Site access** is set correctly
4. Verify **web_accessible_resources** in manifest

## Troubleshooting

### Issue: "Failed to load sidebar.js"

**Solution:**
1. Check `manifest.json` has `web_accessible_resources`
2. Verify `sidebar.js` is in the root folder
3. Reload extension

### Issue: "React is not defined"

**Solution:**
1. Check internet connection (React loads from CDN)
2. Try refreshing the page
3. Check browser console for CSP errors

### Issue: Sidebar appears but no styles

**Solution:**
1. Tailwind CDN might be blocked
2. Check `TAILWIND_SHADOW_DOM.md` for alternatives
3. Verify Shadow DOM has `<link>` tag for Tailwind

### Issue: Sidebar covers chat scrollbar

**Solution:**
- This is expected! The sidebar is positioned on the right
- The chat scrollbar should still be visible
- If it's covered, we can adjust positioning (see `content.css`)

## Next Steps

Once the sidebar is visible:

1. **Message Mapping** - Add dots to minimap
2. **Session Detection** - Group messages by time
3. **Message Pinning** - Make pin icon functional
4. **Search** - Add search functionality

---

**Need help? Check `README_UI.md` for detailed troubleshooting!**
