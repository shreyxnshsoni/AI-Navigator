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
    --navigator-line-thickness: 1px;
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

  /* Minimap Track - Thin vertical strip with flex layout */
  .minimap-track {
    position: fixed;
    top: 0;
    right: 22px !important;
    width: 40px;
    height: 100vh;
  background: transparent;
  pointer-events: auto !important;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 12px !important;
    overflow: visible;
    padding: 20px 0;
  }

  /* Minimap Line (Grok-style horizontal lines) */
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

  /* User lines */
  .minimap-line.user {
    width: 5px !important;
  }

  /* AI lines */
  .minimap-line.ai {
    width: 11px !important;
  }

  /* Hover State - Triggered when mouse enters invisible hitbox or visible line */
  .minimap-line:hover {
    background: #ffffff !important;
    width: 17px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8) !important;
    cursor: pointer;
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

  /* Minimap Arrows */
  .minimap-arrow {
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: rgba(30, 30, 40, 0.8);
    border: 1px solid rgba(0, 242, 255, 0.3);
    position: relative;
    z-index: 2147483647;
    transition: all 0.2s ease;
    pointer-events: auto !important;
    color: #00f2ff;
    opacity: 0;
  }

  .minimap-arrow:hover {
    opacity: 1 !important;
    background: rgba(30, 30, 40, 0.95);
    border-color: #00f2ff;
    box-shadow: 0 0 12px rgba(0, 242, 255, 0.6);
    transform: scale(1.1);
  }

  /* Arrow Tooltip */
  .arrow-tooltip {
    position: absolute;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    padding: 6px 10px;
    background: rgba(20, 20, 30, 0.95);
    border: 1px solid rgba(0, 242, 255, 0.4);
    border-radius: 6px;
    color: #ffffff;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 2147483647;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 242, 255, 0.4);
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  }

  .minimap-arrow svg {
    width: 12px;
    height: 12px;
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
`;
