# 📥 Download React Files - Required Step

## ⚠️ Important: You Must Download React Files

The extension now expects React and ReactDOM to be **local files** (not from CDN) to bypass ChatGPT's CSP restrictions.

---

## 🔽 Download Instructions

### Step 1: Download React

1. Open this link in your browser:
   **https://unpkg.com/react@18/umd/react.production.min.js**

2. Right-click on the page → **"Save As"** (or `Cmd+S` on Mac)

3. Save it as: `react.js` in your project folder:
   `/Users/shreyanshsoni/Desktop/AI NAVIGATOR/react.js`

### Step 2: Download ReactDOM

1. Open this link in your browser:
   **https://unpkg.com/react-dom@18/umd/react-dom.production.min.js**

2. Right-click on the page → **"Save As"** (or `Cmd+S` on Mac)

3. Save it as: `react-dom.js` in your project folder:
   `/Users/shreyanshsoni/Desktop/AI NAVIGATOR/react-dom.js`

---

## ✅ Verify Files Are Downloaded

After downloading, run this in terminal:

```bash
ls -lh react.js react-dom.js
```

You should see:
- `react.js` (~45KB)
- `react-dom.js` (~130KB)

---

## 🚀 After Downloading

1. **Reload extension** in `chrome://extensions/`
2. **Refresh** ChatGPT/Claude page
3. **Check console** for: `🚀 AI Navigator Extension Active!`

---

## 🐛 If Download Fails

### Option 1: Use Terminal (Mac)

```bash
cd "/Users/shreyanshsoni/Desktop/AI NAVIGATOR"
curl -o react.js https://unpkg.com/react@18/umd/react.production.min.js
curl -o react-dom.js https://unpkg.com/react-dom@18/umd/react-dom.production.min.js
```

### Option 2: Manual Download

1. Visit the URLs above
2. Copy all the code
3. Create new files `react.js` and `react-dom.js`
4. Paste the code into each file
5. Save

---

## 📋 Quick Check

After downloading, verify:

```bash
# Check files exist
ls react.js react-dom.js

# Check file sizes (should be ~45KB and ~130KB)
du -h react.js react-dom.js
```

---

**Once these files are downloaded, the extension will work! 🚀**
