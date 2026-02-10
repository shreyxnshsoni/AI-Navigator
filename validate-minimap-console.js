/**
 * AI Navigator Minimap Layout Validation - Browser Console Script
 * Copy and paste this into the browser console when on ChatGPT with a chat
 * that has 4+ messages and the minimap visible.
 */

(function() {
  const TOLERANCE = 0.5;

  const host = document.getElementById('navigator-root');
  if (!host?.shadowRoot) {
    console.error('❌ navigator-root not found. Ensure AI Navigator is loaded and you have a chat with 4+ messages.');
    return;
  }

  const container = host.shadowRoot.querySelector('.minimap-container');
  const aiLine = host.shadowRoot.querySelector('.minimap-line.ai');
  const userLine = host.shadowRoot.querySelector('.minimap-line.user');

  if (!container) {
    console.error('❌ minimap-container not found');
    return;
  }

  const rect = container.getBoundingClientRect();
  const offset = window.innerWidth - rect.right;

  const result = { offset, ai: null, user: null };
  if (aiLine) {
    const s = getComputedStyle(aiLine);
    result.ai = { width: parseFloat(s.width), height: parseFloat(s.height) };
  }
  if (userLine) {
    const s = getComputedStyle(userLine);
    result.user = { width: parseFloat(s.width), height: parseFloat(s.height) };
  }

  function pass(actual, expected) {
    return Math.abs(actual - expected) <= TOLERANCE;
  }

  const offsetOk = pass(result.offset, 22);
  const aiWidthOk = result.ai ? pass(result.ai.width, 11) : false;
  const aiHeightOk = result.ai ? pass(result.ai.height, 1) : false;
  const userWidthOk = result.user ? pass(result.user.width, 5) : false;
  const userHeightOk = result.user ? pass(result.user.height, 1) : false;

  console.log('\n========== AI NAVIGATOR MINIMAP VALIDATION ==========\n');
  console.log('Offset from right edge:', result.offset + 'px', offsetOk ? '✅ PASS' : '❌ FAIL', '(expected 22±0.5)');
  if (result.ai) {
    console.log('AI line:  width', result.ai.width + 'px', aiWidthOk ? '✅' : '❌', 'height', result.ai.height + 'px', aiHeightOk ? '✅' : '❌', '(expected 11x1)');
  } else console.log('AI line: not found');
  if (result.user) {
    console.log('User line: width', result.user.width + 'px', userWidthOk ? '✅' : '❌', 'height', result.user.height + 'px', userHeightOk ? '✅' : '❌', '(expected 5x1)');
  } else console.log('User line: not found');
  console.log('\n' + (offsetOk && aiWidthOk && aiHeightOk && userWidthOk && userHeightOk ? '✅ All pass' : '❌ Some fail') + '\n');

  return result;
})();
