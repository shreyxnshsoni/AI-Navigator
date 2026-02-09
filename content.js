console.log("🚀 AI Navigator Extension Active!");

// Global state
let shadowRoot = null;
let sidebarRoot = null;
let isSidebarInitialized = false;

// ============================================
// INITIALIZATION FUNCTIONS - Defined at top
// ============================================

// Initialize function - defined at very top so it's always available
function init() {
  // Create Shadow DOM
  initializeSidebar();
  
  // Setup scroll listeners
  setupScrollListeners();
  
  // Initial message scan
  findMessages();
}

// Function to initialize sidebar - creates Shadow DOM
// Defined at very top so MutationObserver can access it
function initializeSidebar() {
  if (isSidebarInitialized) {
    return;
  }

  try {
    // Create container
    const container = document.createElement('div');
    container.id = 'navigator-root';
    container.style.cssText = 'position: fixed; top: 0; right: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
    
    // Append to documentElement to keep UI clean
    document.documentElement.appendChild(container);
    
    // Create Shadow DOM
    shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Inject custom styles from style-fix.js
    const styleTag = document.createElement('style');
    styleTag.textContent = typeof NAVIGATOR_STYLES !== 'undefined' ? NAVIGATOR_STYLES : '';
    shadowRoot.appendChild(styleTag);
    
    // Create React root div
    const reactRoot = document.createElement('div');
    reactRoot.id = 'sidebar-root';
    shadowRoot.appendChild(reactRoot);
    
    isSidebarInitialized = true;
    console.log('✅ Shadow DOM created with navigator-root');
    
    // Trigger sidebar.js to mount (it watches for navigator-root)
    // Sidebar.js will find it and mount React component
  } catch (error) {
    console.error('❌ Error initializing sidebar:', error);
  }
}

// Function to detect message type (User or AI) - Uses PLATFORM_CONFIG
function detectMessageType(element, platform) {
  if (!element) return 'unknown';
  
  const config = window.getPlatformConfig && window.getPlatformConfig();
  if (!config) {
    // Fallback if config not loaded
    const role = element.getAttribute('data-message-author-role') || element.getAttribute('data-role');
    if (role === 'user') return 'user';
    if (role === 'assistant' || role === 'model') return 'ai';
    return 'unknown';
  }
  
  // Try user indicators first
  for (const selector of config.userMessageIndicators || []) {
    // Validate selector: must be non-empty string (strict check)
    if (typeof selector !== 'string' || selector.trim() === '') continue;
    try {
      const trimmedSelector = selector.trim();
      if (element.matches && trimmedSelector && trimmedSelector.trim() && element.matches(trimmedSelector)) return 'user';
      if (element.querySelector && trimmedSelector && trimmedSelector.trim() && element.querySelector(trimmedSelector)) return 'user';
      // Check data attributes
      const attrMatch = trimmedSelector.match(/\[([^\]]+)\]/);
      if (attrMatch) {
        const attrParts = attrMatch[1].split('=');
        if (attrParts.length === 2) {
          const attrName = attrParts[0].trim();
          const attrValue = attrParts[1].trim().replace(/['"]/g, '');
          if (attrName && attrValue && element.getAttribute(attrName) === attrValue) return 'user';
        }
      }
    } catch (e) {
      // Skip invalid selectors - log in development only
      if (console && console.debug) console.debug('Invalid selector:', selector, e);
      continue;
    }
  }
  
  // Try AI indicators
  for (const selector of config.aiMessageIndicators || []) {
    // Validate selector: must be non-empty string (strict check)
    if (typeof selector !== 'string' || selector.trim() === '') continue;
    try {
      const trimmedSelector = selector.trim();
      if (element.matches && trimmedSelector && trimmedSelector.trim() && element.matches(trimmedSelector)) return 'ai';
      if (element.querySelector && trimmedSelector && trimmedSelector.trim() && element.querySelector(trimmedSelector)) return 'ai';
      // Check data attributes
      const attrMatch = trimmedSelector.match(/\[([^\]]+)\]/);
      if (attrMatch) {
        const attrParts = attrMatch[1].split('=');
        if (attrParts.length === 2) {
          const attrName = attrParts[0].trim();
          const attrValue = attrParts[1].trim().replace(/['"]/g, '');
          if (attrName && attrValue && element.getAttribute(attrName) === attrValue) return 'ai';
        }
      }
    } catch (e) {
      // Skip invalid selectors - log in development only
      if (console && console.debug) console.debug('Invalid selector:', selector, e);
      continue;
    }
  }
  
  // Fallback: check data attributes directly
  const role = element.getAttribute('data-message-author-role') || element.getAttribute('data-role');
  if (role === 'user') return 'user';
  if (role === 'assistant' || role === 'model') return 'ai';
  
  return 'unknown';
}

// Function to extract timestamp from message element - Uses PLATFORM_CONFIG
function extractTimestamp(element, platform, index, totalMessages) {
  let timestamp = null;
  const config = window.getPlatformConfig && window.getPlatformConfig();
  
  if (config && config.timestampSelectors) {
    // Try all timestamp selectors from config
    for (const selector of config.timestampSelectors) {
      // Strict validation: must be string and not empty
      if (!selector || typeof selector !== 'string' || selector.trim() === '') continue;
      try {
        if (selector.includes('time')) {
          const timeSelector = selector.split('[')[0];
          if (!timeSelector || !timeSelector.trim()) continue;
          const timeElement = element.querySelector(timeSelector);
          if (timeElement) {
            const datetime = timeElement.getAttribute('datetime') || timeElement.getAttribute('title');
            if (datetime) {
              timestamp = new Date(datetime).getTime();
              if (!isNaN(timestamp)) break;
            }
          }
        } else if (selector.startsWith('[')) {
          // Data attribute selector
          const attrName = selector.replace(/[\[\]]/g, '').split('=')[0];
          const attrValue = element.getAttribute(attrName);
          if (attrValue) {
            timestamp = new Date(attrValue).getTime();
            if (!isNaN(timestamp)) break;
          }
        }
      } catch (e) {
        // Skip invalid selectors
        if (console && console.debug) console.debug('Invalid timestamp selector:', selector, e);
        continue;
      }
    }
  }
  
  // Fallback: Check title attribute for date
  if (!timestamp) {
    const title = element.getAttribute('title');
    if (title) {
      const dateMatch = title.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) {
        timestamp = new Date(dateMatch[0]).getTime();
      }
    }
  }
  
  // Final fallback: Use current time for new messages, or incremental for old messages
  if (!timestamp || isNaN(timestamp)) {
    // For development/testing: create incremental timestamps
    // 1 hour gap for every 10 messages (for testing UI)
    const hoursAgo = Math.floor((totalMessages - index) / 10);
    timestamp = Date.now() - (hoursAgo * 60 * 60 * 1000);
  }
  
  return timestamp;
}

// Function to format session title
function formatSessionTitle(timestamp) {
  const date = new Date(timestamp);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `Session: ${dateStr} ${timeStr}`;
}

// Function to group messages into sessions based on time gaps
function groupMessagesIntoSessions(messagesData, sessionGapMinutes = 45) {
  if (!messagesData || messagesData.length === 0) {
    return { sessions: [], sessionBreaks: [] };
  }
  
  const sessions = [];
  const sessionBreaks = [];
  let currentSession = {
    id: `session-${Date.now()}`,
    title: '',
    startTime: null,
    endTime: null,
    messageIds: [],
    messageIndices: []
  };
  
  const sessionGapMs = sessionGapMinutes * 60 * 1000; // Convert to milliseconds
  
  for (let i = 0; i < messagesData.length; i++) {
    const message = messagesData[i];
    const messageTime = message.timestamp || Date.now();
    
    // Initialize first session
    if (i === 0) {
      currentSession.startTime = messageTime;
      currentSession.title = formatSessionTitle(messageTime);
    }
    
    // Check if there's a gap > sessionGapMinutes
    if (i > 0) {
      const prevMessage = messagesData[i - 1];
      const prevTime = prevMessage.timestamp || Date.now();
      const timeGap = messageTime - prevTime;
      
      if (timeGap > sessionGapMs) {
        // End current session
        currentSession.endTime = prevTime;
        currentSession.messageIds.push(prevMessage.id);
        currentSession.messageIndices.push(prevMessage.index);
        sessions.push({ ...currentSession });
        
        // Add session break
        sessionBreaks.push({
          id: `break-${prevMessage.id}-${message.id}`,
          afterMessageIndex: prevMessage.index,
          timestamp: prevTime + (timeGap / 2), // Middle of the gap
          gapMinutes: Math.round(timeGap / (60 * 1000))
        });
        
        // Start new session
        currentSession = {
          id: `session-${Date.now()}-${i}`,
          title: formatSessionTitle(messageTime),
          startTime: messageTime,
          endTime: null,
          messageIds: [],
          messageIndices: []
        };
      }
    }
    
    // Add message to current session
    currentSession.messageIds.push(message.id);
    currentSession.messageIndices.push(message.index);
    currentSession.endTime = messageTime;
  }
  
  // Add the last session
  if (currentSession.messageIds.length > 0) {
    sessions.push(currentSession);
  }
  
  return { sessions, sessionBreaks };
}

// Function to get scrollable container (handles virtual scrolling)
function getScrollableContainer() {
  // Try to find the main chat container
  const containers = [
    (() => { const s = 'main'; return s && s.trim() ? document.querySelector(s) : null; })(),
    (() => { const s = '[role="main"]'; return s && s.trim() ? document.querySelector(s) : null; })(),
    (() => { const s = '.flex.flex-col'; return s && s.trim() ? document.querySelector(s) : null; })(),
    (() => { const s = '[class*="overflow"]'; return s && s.trim() ? document.querySelector(s) : null; })(),
    (() => { const s = '[class*="scroll"]'; return s && s.trim() ? document.querySelector(s) : null; })(),
    document.body
  ];
  
  for (const container of containers) {
    if (container && (container.scrollHeight > container.clientHeight)) {
      return container;
    }
  }
  
  // Fallback: return the first scrollable parent or body
  const articleSelector = 'article';
  let element = (articleSelector && articleSelector.trim()) ? (document.querySelector(articleSelector) || document.body) : document.body;
  while (element && element !== document.body) {
    if (element.scrollHeight > element.clientHeight) {
      return element;
    }
    element = element.parentElement;
  }
  
  return document.body;
}

// Function to find messages on different platforms - Uses PLATFORM_CONFIG
const findMessages = () => {
  const platform = window.detectPlatform && window.detectPlatform() || 'unknown';
  const config = window.getPlatformConfig && window.getPlatformConfig();
  
  let messageElements = [];
  
  if (config && config.messageSelectors) {
    // Try all message selectors from config
    for (const selector of config.messageSelectors) {
      // Strict validation: must be string and not empty
      if (!selector || typeof selector !== 'string' || selector.trim() === '') continue;
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          messageElements = Array.from(elements);
          break; // Use first selector that finds messages
        }
      } catch (e) {
        // Skip invalid selectors
        if (console && console.debug) console.debug('Invalid selector:', selector, e);
        continue;
      }
    }
  } else {
    // Fallback to hardcoded selectors if config not available
    if (platform === 'chatgpt') {
      const s = 'article, [data-message-author-role]';
      if (s && s.trim()) messageElements = Array.from(document.querySelectorAll(s));
    } else if (platform === 'claude') {
      const s = '.font-user-message, .font-claude-message, [class*="Message"]';
      if (s && s.trim()) messageElements = Array.from(document.querySelectorAll(s));
    } else if (platform === 'gemini') {
      const s = '[data-message-id], .message';
      if (s && s.trim()) messageElements = Array.from(document.querySelectorAll(s));
    } else if (platform === 'grok') {
      const s = '[data-testid*="message"], .message-content';
      if (s && s.trim()) messageElements = Array.from(document.querySelectorAll(s));
    }
  }
  
  const count = messageElements.length;
  
  if (count > 0) {
    // Get scrollable container for accurate positioning
    const scrollContainer = getScrollableContainer();
    const containerTop = scrollContainer.getBoundingClientRect().top + window.scrollY;
    const containerHeight = scrollContainer.scrollHeight;
    
    // Build detailed message data array
    const messagesData = messageElements.map((element, index) => {
      // Generate unique ID
      const id = element.id || `msg-${platform}-${index}-${Date.now()}`;
      if (!element.id) element.id = id;
      
      // Get vertical position relative to scroll container
      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY || scrollContainer.scrollTop;
      const elementTop = rect.top + scrollY;
      const relativeTop = elementTop - containerTop;
      
      // Detect message type
      const type = detectMessageType(element, platform);
      
      // Extract timestamp
      const timestamp = extractTimestamp(element, platform, index, count);
      
      // Extract text content for search
      const textContent = extractMessageSnippet(element, platform);
      
      return {
        id: id,
        element: element, // Store reference for scrolling
        offset: relativeTop, // Vertical offset from container top
        type: type, // 'user' or 'ai'
        index: index,
        timestamp: timestamp, // Timestamp for session detection
        textContent: textContent // Text content for search
      };
    });
    
    // Group messages into sessions
    const { sessions, sessionBreaks } = groupMessagesIntoSessions(messagesData, 45);
    
    console.log(`✅ Found ${count} messages on ${platform}.`);
    console.log(`📚 Grouped into ${sessions.length} sessions.`);
    
    // Load existing session titles (user may have renamed them)
    chrome.storage.local.get(['sessionTitles'], (existing) => {
      const sessionTitles = existing.sessionTitles || {};
      
      // Merge with existing titles
      sessions.forEach(session => {
        if (sessionTitles[session.id]) {
          session.title = sessionTitles[session.id];
        }
      });
      
      // Store detailed message data with sessions
      chrome.storage.local.set({ 
        messageCount: count,
        platform: platform,
        messagesData: messagesData.map(msg => ({
          id: msg.id,
          offset: msg.offset,
          type: msg.type,
          index: msg.index,
          timestamp: msg.timestamp,
          textContent: msg.textContent // Include text for search
        })), // Store without element references (not serializable)
        sessions: sessions,
        sessionBreaks: sessionBreaks,
        containerHeight: containerHeight,
        lastUpdate: Date.now()
      });
    });
    
    // Store element references in a Map for scrolling (not in storage)
    if (!window.navigatorMessageElements) {
      window.navigatorMessageElements = new Map();
    }
    messagesData.forEach(msg => {
      window.navigatorMessageElements.set(msg.id, msg.element);
      
      // Add hover listeners for message-to-dot highlighting
      if (msg.element && !msg.element.hasAttribute('data-navigator-hover-setup')) {
        msg.element.setAttribute('data-navigator-hover-setup', 'true');
        msg.element.classList.add('navigator-message-hover');
        
        msg.element.addEventListener('mouseenter', () => {
          // Send message to sidebar to highlight corresponding dot
          window.postMessage({
            source: 'ai-navigator-content',
            action: 'highlightMessage',
            messageId: msg.id
          }, '*');
        });
        
        msg.element.addEventListener('mouseleave', () => {
          // Remove highlight
          window.postMessage({
            source: 'ai-navigator-content',
            action: 'unhighlightMessage',
            messageId: msg.id
          }, '*');
        });
      }
    });
    
    // Inject pin buttons into messages
    injectPinButtons(messagesData, platform);
    
    return { messages: messageElements, messagesData, count, platform };
  }
  
  return { messages: [], messagesData: [], count: 0, platform };
};

// Function to initialize sidebar - creates Shadow DOM
// Defined at top level so MutationObserver can access it
function initializeSidebar() {
  if (isSidebarInitialized) {
    return;
  }

  try {
    // Create container
    const container = document.createElement('div');
    container.id = 'navigator-root';
    container.style.cssText = 'position: fixed; top: 0; right: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';
    
    // Append to documentElement to keep UI clean
    document.documentElement.appendChild(container);
    
    // Create Shadow DOM
    shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Inject custom styles from style-fix.js
    const styleTag = document.createElement('style');
    styleTag.textContent = typeof NAVIGATOR_STYLES !== 'undefined' ? NAVIGATOR_STYLES : '';
    shadowRoot.appendChild(styleTag);
    
    // Create React root div
    const reactRoot = document.createElement('div');
    reactRoot.id = 'sidebar-root';
    shadowRoot.appendChild(reactRoot);
    
    isSidebarInitialized = true;
    console.log('✅ Shadow DOM created with navigator-root');
    
    // Trigger sidebar.js to mount (it watches for navigator-root)
    // Sidebar.js will find it and mount React component
  } catch (error) {
    console.error('❌ Error initializing sidebar:', error);
  }
}

// Initialize function - defined at top level
function init() {
  // Create Shadow DOM
  initializeSidebar();
  
  // Setup scroll listeners
  setupScrollListeners();
  
  // Initial message scan
  findMessages();
}

// Setup scroll and resize listeners
let scrollTimeout;
function setupScrollListeners() {
  const scrollContainer = getScrollableContainer();
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        findMessages(); // Recalculate positions
      }, 100); // Debounce scroll events
    }, { passive: true });
  }

  // Also update on window resize
  window.addEventListener('resize', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      findMessages(); // Recalculate positions
    }, 200);
  }, { passive: true });
}

// Initial scan
findMessages();

// Run every 2 seconds to catch new messages
setInterval(findMessages, 2000);

// Function to extract text snippet from message (first 100 chars)
function extractMessageSnippet(element, platform) {
  // Try to find the main text content
  const textSelectors = [
    'p', 'div[class*="text"]', 'div[class*="message"]', 
    '.markdown', '[class*="prose"]', 'pre', 'code'
  ];
  
  let text = '';
  for (const selector of textSelectors) {
    // Strict validation: must be string and not empty
    if (!selector || typeof selector !== 'string' || !selector.trim()) continue;
    try {
      const elements = element.querySelectorAll(selector);
      if (elements.length > 0) {
        text = Array.from(elements)
          .map(el => el.textContent || el.innerText)
          .join(' ')
          .trim();
        if (text.length > 0) break;
      }
    } catch (e) {
      // Skip invalid selectors
      continue;
    }
  }
  
  // Fallback to element's text content
  if (!text) {
    text = element.textContent || element.innerText || '';
  }
  
  // Return first 100 characters
  return text.substring(0, 100).trim() + (text.length > 100 ? '...' : '');
}

// Function to find button container for pin button injection - Uses PLATFORM_CONFIG
function findButtonContainer(element, platform) {
  const config = window.getPlatformConfig && window.getPlatformConfig();
  
  if (config && config.buttonContainerSelectors) {
    // Try all button container selectors from config
    for (const selector of config.buttonContainerSelectors) {
      // Strict validation: must be string and not empty
      if (!selector || typeof selector !== 'string' || selector.trim() === '') continue;
      try {
        const container = element.querySelector(selector);
        if (container) return container;
      } catch (e) {
        // Skip invalid selectors
        if (console && console.debug) console.debug('Invalid button container selector:', selector, e);
        continue;
      }
    }
  }
  
  // Fallback: Create container at end of message
  let container = element.querySelector('.navigator-pin-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'navigator-pin-container flex items-center gap-1';
    container.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-top: 8px;';
    element.appendChild(container);
  }
  return container;
}

// Function to create pin button
function createPinButton(messageId, isPinned, platform) {
  const button = document.createElement('button');
  button.className = 'navigator-pin-button';
  button.setAttribute('data-message-id', messageId);
  button.setAttribute('data-pinned', isPinned ? 'true' : 'false');
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    opacity: 0.7;
  `;
  button.onmouseenter = () => {
    button.style.opacity = '1';
    button.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
  };
  button.onmouseleave = () => {
    button.style.opacity = isPinned ? '1' : '0.7';
    button.style.backgroundColor = 'transparent';
  };
  
  // SVG Star icon
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', isPinned ? '#fbbf24' : 'none');
  svg.setAttribute('stroke', isPinned ? '#fbbf24' : 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.style.cssText = 'width: 16px; height: 16px;';
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z');
  svg.appendChild(path);
  
  button.appendChild(svg);
  button.title = isPinned ? 'Unpin message' : 'Pin message';
  
  // Click handler
  button.onclick = (e) => {
    e.stopPropagation();
    handlePinToggle(messageId, button, platform);
  };
  
  return button;
}

// Function to handle pin toggle
function handlePinToggle(messageId, button, platform) {
  chrome.storage.local.get(['pinnedMessages'], (result) => {
    const pinnedMessages = result.pinnedMessages || {};
    const isCurrentlyPinned = pinnedMessages[messageId] !== undefined;
    
    if (isCurrentlyPinned) {
      // Unpin
      delete pinnedMessages[messageId];
      button.setAttribute('data-pinned', 'false');
      button.querySelector('svg').setAttribute('fill', 'none');
      button.querySelector('svg').setAttribute('stroke', 'currentColor');
      button.title = 'Pin message';
      console.log(`📌 Unpinned message: ${messageId}`);
    } else {
      // Pin
      const element = window.navigatorMessageElements?.get(messageId);
      if (element) {
        const snippet = extractMessageSnippet(element, platform);
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;
        const offset = rect.top + scrollY;
        
        pinnedMessages[messageId] = {
          id: messageId,
          snippet: snippet,
          offset: offset,
          timestamp: Date.now(),
          platform: platform
        };
        
        button.setAttribute('data-pinned', 'true');
        button.querySelector('svg').setAttribute('fill', '#fbbf24');
        button.querySelector('svg').setAttribute('stroke', '#fbbf24');
        button.style.opacity = '1';
        button.title = 'Unpin message';
        console.log(`⭐ Pinned message: ${messageId}`);
      }
    }
    
    // Save to storage
    chrome.storage.local.set({ pinnedMessages: pinnedMessages });
  });
}

// Function to inject pin buttons into messages
function injectPinButtons(messagesData, platform) {
  chrome.storage.local.get(['pinnedMessages'], (result) => {
    const pinnedMessages = result.pinnedMessages || {};
    
    messagesData.forEach((msg) => {
      const element = msg.element;
      if (!element) return;
      
      // Check if pin button already exists
      let pinButton = element.querySelector('.navigator-pin-button');
      if (!pinButton) {
        // Find or create button container
        const container = findButtonContainer(element, platform);
        if (container) {
          const isPinned = pinnedMessages[msg.id] !== undefined;
          pinButton = createPinButton(msg.id, isPinned, platform);
          container.appendChild(pinButton);
        }
      } else {
        // Update existing button state
        const isPinned = pinnedMessages[msg.id] !== undefined;
        pinButton.setAttribute('data-pinned', isPinned ? 'true' : 'false');
        const svg = pinButton.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', isPinned ? '#fbbf24' : 'none');
          svg.setAttribute('stroke', isPinned ? '#fbbf24' : 'currentColor');
        }
        pinButton.title = isPinned ? 'Unpin message' : 'Pin message';
        pinButton.style.opacity = isPinned ? '1' : '0.7';
      }
    });
  });
}

// Function to handle scroll-to-message requests from sidebar
function handleScrollToMessage(messageId, options = {}) {
  const element = window.navigatorMessageElements?.get(messageId);
  if (element) {
    // Use block: 'start' for consistent positioning at message start
    const block = options.block || 'start';
    element.scrollIntoView({ behavior: 'smooth', block: block });
    
    // Add offset padding to account for sticky header (ChatGPT's top nav)
    if (options.offset) {
      setTimeout(() => {
        window.scrollBy(0, options.offset);
      }, 100); // Small delay to let scrollIntoView complete
    }
    
    // Highlight the message briefly at the very top
    element.style.transition = 'background-color 0.3s';
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, 1000);
    return true;
  }
  return false;
}

// Listen for messages from sidebar (via postMessage)
window.addEventListener('message', (event) => {
  // Only accept messages from our extension
  if (event.data && event.data.source === 'ai-navigator-sidebar') {
    if (event.data.action === 'scrollToMessage') {
      const success = handleScrollToMessage(event.data.messageId, {
        block: event.data.block || 'start',
        offset: event.data.offset || -100
      });
      // Send response back
      window.postMessage({
        source: 'ai-navigator-content',
        action: 'scrollResult',
        success: success,
        messageId: event.data.messageId
      }, '*');
    }
  }
});

// Also listen for DOM changes (new messages being added)
const observer = new MutationObserver(() => {
  findMessages();
  
  // Try to initialize sidebar if not already done
  if (!isSidebarInitialized) {
    initializeSidebar();
  }
});

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    setupScrollListeners();
    init();
  });
} else {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  setupScrollListeners();
  init();
}
