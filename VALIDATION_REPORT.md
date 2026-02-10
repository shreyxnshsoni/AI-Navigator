# AI Navigator Minimap Validation Report

## Summary

Automated validation was set up, but the Puppeteer run landed on the ChatGPT login page (not logged in), so the minimap did not appear (it requires a chat with 4+ messages).

## What Was Done

1. **Validation script added** – `validate-minimap.js`  
   - Launches Chrome with the extension, navigates to ChatGPT, measures layout, and takes a screenshot.

2. **Console validation script added** – `validate-minimap-console.js`  
   - Paste into the browser DevTools console when on ChatGPT with a chat that has 4+ messages.

3. **Layout fix in `sidebar.js`** – inline width/height removed so the spec values from `style-fix.js` apply:
   - Previously: user 6px, ai 14px, height 2px (inline override)
   - Now: user 5px, ai 11px, height 1px (from CSS variables)

## How to Run Validation

### Option A: Puppeteer (automated)

```bash
# With extension loaded (fresh Chrome, must log in to ChatGPT first)
npm run validate:minimap

# With your Chrome profile (close Chrome first, then run)
USE_USER_PROFILE=1 npm run validate:minimap
```

Then open a chat with 4+ messages before the 30s timeout.

### Option B: Browser console (manual)

1. Open ChatGPT and log in.
2. Open a chat with at least 4 messages so the minimap appears.
3. Open DevTools (F12 or Cmd+Option+I) → Console.
4. Paste the contents of `validate-minimap-console.js` and press Enter.
5. Check the output for pass/fail on each measurement.

## Spec (from style-fix.js)

| Measurement | Expected | Tolerance |
|-------------|----------|-----------|
| Offset from right edge | 22px | ±0.5px |
| AI line width | 11px | ±0.5px |
| AI line height | 1px | ±0.5px |
| User line width | 5px | ±0.5px |
| User line height | 1px | ±0.5px |

## Screenshot Artifact

From the Puppeteer run: `minimap-validation-screenshot.png`  
(Shows the ChatGPT login page because the session was not logged in.)
