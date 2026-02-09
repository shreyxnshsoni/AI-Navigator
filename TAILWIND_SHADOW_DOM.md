# Tailwind CSS in Shadow DOM - Setup Guide

## Current Setup (CDN Approach)

The extension currently uses **Tailwind CSS via CDN** which is injected into the Shadow DOM. This works immediately without a build step.

## If Styles Don't Appear

If Tailwind styles aren't showing up in the Shadow DOM, here are solutions:

### Solution 1: Use Tailwind Play CDN (Recommended for MVP)

The current setup uses the standard Tailwind CDN. If it doesn't work, try:

```javascript
// In content.js, replace the Tailwind link with:
const tailwindLink = document.createElement('link');
tailwindLink.rel = 'stylesheet';
tailwindLink.href = 'https://cdn.tailwindcss.com';
```

### Solution 2: Build Tailwind and Inject Styles

For a production build, you'll want to:

1. **Install Tailwind:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure `tailwind.config.js`:**
```javascript
module.exports = {
  content: ['./sidebar.js', './content.js'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

3. **Create `input.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. **Build CSS:**
```bash
npx tailwindcss -i ./input.css -o ./dist/tailwind.css --minify
```

5. **Inject into Shadow DOM:**
```javascript
// In content.js
const style = document.createElement('style');
style.textContent = await fetch(chrome.runtime.getURL('dist/tailwind.css')).then(r => r.text());
shadowRoot.appendChild(style);
```

### Solution 3: Use PostCSS to Inject Styles

Create `postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Then build and inject the compiled CSS into the Shadow DOM's `<style>` tag instead of using a `<link>` tag.

## Current Implementation

The extension uses **Solution 1 (CDN)** for simplicity. This works for the MVP and can be upgraded to a build process later.

## Testing

To verify Tailwind is working:

1. Open Chrome DevTools
2. Inspect the Shadow DOM (you'll see a `#shadow-root` element)
3. Check if Tailwind classes are being applied
4. Look for the `backdrop-blur-xl` and `bg-white/10` classes on the sidebar

## Troubleshooting

### Styles not appearing?
- Check browser console for errors loading Tailwind CDN
- Verify Shadow DOM is created (inspect `#navigator-root`)
- Check if Tailwind classes are in the HTML but not styled (means CSS didn't load)

### Shadow DOM not visible?
- Check `content.js` console logs
- Verify React and ReactDOM loaded successfully
- Check if `sidebar.js` is accessible (check `chrome://extensions/` → your extension → "Errors")

### React not loading?
- Check network tab for CDN requests
- Verify no Content Security Policy blocking external scripts
- Try using local React files instead of CDN

---

**For now, the CDN approach should work. Upgrade to a build process when you're ready for production!**
