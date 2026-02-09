// Essential CSS styles for AI Navigator sidebar - Grok Elite Edition

const NAVIGATOR_STYLES = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
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
    right: 0;
    width: 60px;
    height: 100vh;
    background: transparent;
    pointer-events: none;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 20px;
  }

  /* Minimap Track - Thin vertical strip with flex layout */
  .minimap-track {
    position: fixed;
    top: 0;
    right: 20px;
    width: 40px;
    height: 100vh;
    background: transparent;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 12px;
    overflow: visible;
    padding: 20px 0;
  }

  /* Minimap Line (Grok-style horizontal lines) */
  .minimap-line {
    height: 2px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 4px;
    pointer-events: auto;
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

  /* User lines - 6px wide */
  .minimap-line.user {
    width: 6px;
  }

  /* AI lines - 14px wide */
  .minimap-line.ai {
    width: 14px;
  }

  /* Hover State - Triggered when mouse enters invisible hitbox or visible line */
  .minimap-line:hover {
    background: #ffffff !important;
    width: 22px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 1) !important;
    cursor: pointer;
  }

  .minimap-line.pinned {
    background: rgba(255, 215, 0, 0.6);
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.6);
  }

  .minimap-line.pinned:hover {
    background: #ffffff !important;
    width: 22px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 1) !important;
  }

  .minimap-line.highlighted {
    background: rgba(255, 255, 255, 0.8);
    width: 20px;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
  }

  .minimap-line.highlighted:hover {
    background: #ffffff !important;
    width: 22px !important;
    box-shadow: 0 0 8px rgba(255, 255, 255, 1) !important;
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

  /* Hover Preview Tooltip - Follows cursor vertically */
  .hover-preview {
    position: fixed;
    right: 50px;
    padding: 10px 14px;
    background: rgba(20, 20, 20, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.95);
    font-size: 12px;
    line-height: 1.5;
    max-width: 250px;
    white-space: normal;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
    pointer-events: auto;
    z-index: 2147483647;
  }
`;
