// Essential CSS styles for AI Navigator sidebar - Grok Elite Edition

const NAVIGATOR_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --navigator-right-offset: 22px;
    --navigator-line-gap: 12px;
    --navigator-ai-line-width: 11px;
    --navigator-user-line-width: 5px;
    --navigator-line-thickness: 2px;
  }

  #navigator-root {
    position: fixed;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
    pointer-events: none;
  }

  #sidebar-root {
    position: fixed;
    top: 0;
    right: 0;
    width: 40px;
    height: 100vh;
    background: transparent;
    display: flex;
    flex-direction: column;
    overflow: visible;
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Minimap Container - Vertical Track on Far Right */
  .minimap-container {
    position: fixed;
    top: 0;
    right: 22px !important;
    width: 60px;
    height: 100vh;
    background: transparent;
    pointer-events: none;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 0;
  }

  .minimap-container.minimap-hidden {
    display: none !important;
  }

  /* Minimap Track - Flush right, lines grow left. Layout lockdown. */
  .minimap-track {
    position: fixed;
    top: 0;
    right: 22px !important;
    width: 40px;
    height: 100vh;
    background: transparent;
    pointer-events: auto !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: flex-end !important;
    justify-content: center;
    gap: 12px !important;
    overflow: visible;
    padding: 20px 0;
  }

  /* Minimap Line - 2px thickness, 22px offset, 12px gap (tracking spec) */
  .minimap-line {
    height: 2px !important;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 2px;
  pointer-events: auto !important;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.3);
    position: relative;
    transform-origin: right center;
  }
  
  /* Invisible Hitbox - Expands hover area to 40px from the right edge */
  .minimap-line::before {
    content: '';
    position: absolute;
    right: 0;
    top: -10px;
    bottom: -10px;
    left: -40px;
    background: transparent;
    pointer-events: auto;
    z-index: 2;
  }

  .minimap-line.pinned {
    background: rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.8);
  }

  .minimap-line.pinned:hover {
    background: #ffffff !important;
    width: 17px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
  }

  .minimap-line.highlighted {
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
  }

  .minimap-line.highlighted:hover {
    background: #ffffff !important;
    width: 17px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
  }

  /* Minimap Arrows - Scroll indicators */
  .minimap-arrow {
    width: 16px;
    height: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    position: relative;
    z-index: 2147483647;
    transition: color 0.2s ease;
    pointer-events: auto !important;
    color: #8E8E93;
    flex-shrink: 0;
  }

  .minimap-arrow:hover {
    color: #FFFFFF !important;
  }

  .minimap-arrow svg {
    width: 16px;
    height: 16px;
  }

  /* Arrow Tooltip */
  .arrow-tooltip {
    position: absolute;
    right: 22px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    background: rgba(20, 20, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
  }

  /* Hover Preview Tooltip - Follows cursor vertically (positioning wrapper) */
  .hover-preview {
    position: fixed;
    right: 50px;
    pointer-events: auto;
    transform: translateY(-50%);
    z-index: 2147483647 !important;
  }

  /* Grok-style preview box */
  .hover-preview-box {
    background: #222222;
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 260px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .preview-header {
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 6px;
  }

  .preview-header.user {
    color: #ffffff;
  }

  .preview-header.ai {
    color: #8E8E93;
  }

  .preview-body {
    color: #ffffff;
    font-size: 14px;
    line-height: 1.4;
    white-space: normal;
    word-wrap: break-word;
  }

  .preview-timestamp {
    margin-left: 8px;
    font-size: 11px;
    color: #8E8E93;
    font-weight: 400;
  }

  /* High-Specificity DNA Lockdown - win over ChatGPT globals */
  #sidebar-root .minimap-track .minimap-line.user-line {
    width: 5px !important;
    height: 2px !important;
    background-color: #ffffff !important;
  }

  #sidebar-root .minimap-track .minimap-line.ai-line {
    width: 11px !important;
    height: 2px !important;
    background-color: #8E8E93 !important;
  }

  /* Expansion on hover - both types grow to 17px */
  #sidebar-root .minimap-track .minimap-line:hover {
    width: 17px !important;
    background-color: #ffffff !important;
  }
`;
