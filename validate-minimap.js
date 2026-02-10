#!/usr/bin/env node
/**
 * AI Navigator Minimap Layout Validation
 * Validates minimap-container offset and minimap-line dimensions against spec.
 * Spec: offset=22px, ai line 11x1px, user line 5x1px (±0.5px tolerance)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const EXTENSION_PATH = path.join(__dirname);
const CHATGPT_URL = 'https://chatgpt.com/';
const CHROME_USER_DATA =
  process.env.CHROME_USER_DATA ||
  path.join(process.env.HOME || process.env.USERPROFILE, 'Library', 'Application Support', 'Google', 'Chrome');
const TIMEOUT_MS = 30000;
const TOLERANCE = 0.5;

async function waitForMinimap(page) {
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    const found = await page.evaluate(() => {
      const host = document.getElementById('navigator-root');
      if (!host?.shadowRoot) return false;
      const container = host.shadowRoot.querySelector('.minimap-container');
      const aiLine = host.shadowRoot.querySelector('.minimap-line.ai');
      const userLine = host.shadowRoot.querySelector('.minimap-line.user');
      return !!(container && (aiLine || userLine));
    });
    if (found) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function measureMinimap(page) {
  return page.evaluate((tolerance) => {
    const host = document.getElementById('navigator-root');
    if (!host?.shadowRoot) return { error: 'navigator-root not found' };

    const container = host.shadowRoot.querySelector('.minimap-container');
    const aiLine = host.shadowRoot.querySelector('.minimap-line.ai');
    const userLine = host.shadowRoot.querySelector('.minimap-line.user');

    if (!container) return { error: 'minimap-container not found' };

    const rect = container.getBoundingClientRect();
    const offset = window.innerWidth - rect.right;

    const result = {
      offset,
      innerWidth: window.innerWidth,
      rectRight: rect.right,
      ai: null,
      user: null,
    };

    if (aiLine) {
      const s = getComputedStyle(aiLine);
      result.ai = {
        width: parseFloat(s.width),
        height: parseFloat(s.height),
      };
    }
    if (userLine) {
      const s = getComputedStyle(userLine);
      result.user = {
        width: parseFloat(s.width),
        height: parseFloat(s.height),
      };
    }
    return result;
  }, TOLERANCE);
}

function assertInRange(actual, expected, tolerance, name) {
  const diff = Math.abs(actual - expected);
  return { pass: diff <= tolerance, actual, expected, tolerance, name };
}

async function main() {
  const screenshotPath = path.join(__dirname, 'minimap-validation-screenshot.png');
  const useUserProfile = process.env.USE_USER_PROFILE === '1';

  const launchOptions = {
    headless: false,
    defaultViewport: null,
  };

  if (useUserProfile && fs.existsSync(CHROME_USER_DATA)) {
    console.log('Using your Chrome profile (must close Chrome first)...');
    launchOptions.userDataDir = CHROME_USER_DATA;
  } else {
    console.log('Launching Chrome with AI Navigator extension...');
    launchOptions.args = [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
    ];
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = (await browser.pages())[0] || (await browser.newPage());
    await page.setViewport({ width: 1280, height: 900 });

    console.log('Navigating to ChatGPT...');
    await page.goto(CHATGPT_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('Waiting for minimap (up to 30s)...');
    const minimapFound = await waitForMinimap(page);
    if (!minimapFound) {
      console.error(
        '\n❌ Minimap did not appear within 30 seconds. Ensure:\n' +
          '  - You are logged in to ChatGPT\n' +
          '  - You have an open chat with at least 4 messages\n' +
          '  - The extension is loading correctly'
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('Screenshot saved to:', screenshotPath);
      process.exit(1);
    }

    console.log('Minimap found. Measuring layout...');
    const m = await measureMinimap(page);
    if (m.error) {
      console.error('Error:', m.error);
      process.exit(1);
    }

    // Run assertions
    const offsetCheck = assertInRange(m.offset, 22, TOLERANCE, 'offset from right');
    const aiWidthCheck = m.ai
      ? assertInRange(m.ai.width, 11, TOLERANCE, 'ai line width')
      : { pass: false, actual: null, expected: 11, name: 'ai line width (no element)' };
    const aiHeightCheck = m.ai
      ? assertInRange(m.ai.height, 1, TOLERANCE, 'ai line height')
      : { pass: false, actual: null, expected: 1, name: 'ai line height (no element)' };
    const userWidthCheck = m.user
      ? assertInRange(m.user.width, 5, TOLERANCE, 'user line width')
      : { pass: false, actual: null, expected: 5, name: 'user line width (no element)' };
    const userHeightCheck = m.user
      ? assertInRange(m.user.height, 1, TOLERANCE, 'user line height')
      : { pass: false, actual: null, expected: 1, name: 'user line height (no element)' };

    // Capture screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('\nScreenshot saved to:', screenshotPath);

    // Print report
    console.log('\n========== MINIMAP LAYOUT VALIDATION REPORT ==========\n');
    console.log('Offset from right edge:');
    console.log(`  Measured: ${m.offset}px | Expected: 22px (±${TOLERANCE}px) | ${offsetCheck.pass ? 'PASS' : 'FAIL'}`);

    if (m.ai) {
      console.log('\nAI line (.minimap-line.ai):');
      console.log(`  Width:  ${m.ai.width}px | Expected: 11px (±${TOLERANCE}px) | ${aiWidthCheck.pass ? 'PASS' : 'FAIL'}`);
      console.log(`  Height: ${m.ai.height}px | Expected: 1px (±${TOLERANCE}px) | ${aiHeightCheck.pass ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('\nAI line: Not found (no .minimap-line.ai element)');
    }

    if (m.user) {
      console.log('\nUser line (.minimap-line.user):');
      console.log(`  Width:  ${m.user.width}px | Expected: 5px (±${TOLERANCE}px) | ${userWidthCheck.pass ? 'PASS' : 'FAIL'}`);
      console.log(`  Height: ${m.user.height}px | Expected: 1px (±${TOLERANCE}px) | ${userHeightCheck.pass ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('\nUser line: Not found (no .minimap-line.user element)');
    }

    const allPass =
      offsetCheck.pass &&
      aiWidthCheck.pass &&
      aiHeightCheck.pass &&
      userWidthCheck.pass &&
      userHeightCheck.pass;

    console.log('\n' + (allPass ? '✅ All measurements PASS' : '❌ Some measurements FAIL'));
    console.log('\nScreenshot artifact:', screenshotPath);
    console.log('\n========================================================\n');

    process.exit(allPass ? 0 : 1);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
