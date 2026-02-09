// Platform Configuration - Centralized Selectors
// Update this file if AI platforms change their HTML structure

const PLATFORM_CONFIG = {
  chatgpt: {
    name: 'ChatGPT',
    messageSelectors: [
      'article',
      '[data-message-author-role]',
      '[data-message-id]'
    ],
    userMessageIndicators: [
      '[data-message-author-role="user"]',
      '[data-author="user"]'
    ],
    aiMessageIndicators: [
      '[data-message-author-role="assistant"]',
      '[data-author="assistant"]'
    ],
    timestampSelectors: [
      'time[datetime]',
      'time[title]',
      '[data-time]',
      '[data-timestamp]'
    ],
    buttonContainerSelectors: [
      '[class*="flex"] [class*="gap"]',
      '.flex.items-center.gap',
      '[class*="button"]'
    ]
  },
  
  claude: {
    name: 'Claude',
    messageSelectors: [
      '.font-user-message',
      '.font-claude-message',
      '[class*="Message"]',
      '[data-message-id]'
    ],
    userMessageIndicators: [
      '.font-user-message',
      '[class*="user-message"]'
    ],
    aiMessageIndicators: [
      '.font-claude-message',
      '[class*="claude-message"]'
    ],
    timestampSelectors: [
      'time[datetime]',
      '[data-time]'
    ],
    buttonContainerSelectors: [
      '[class*="action"]',
      '.flex.items-center',
      '[class*="button"]'
    ]
  },
  
  gemini: {
    name: 'Gemini',
    messageSelectors: [
      '[data-message-id]',
      '.message',
      '[data-role]'
    ],
    userMessageIndicators: [
      '[data-role="user"]',
      '[data-author="user"]'
    ],
    aiMessageIndicators: [
      '[data-role="model"]',
      '[data-author="model"]'
    ],
    timestampSelectors: [
      'time[datetime]',
      '[data-time]'
    ],
    buttonContainerSelectors: [
      '.flex.items-center',
      '[class*="button"]'
    ]
  },
  
  grok: {
    name: 'Grok',
    messageSelectors: [
      '[data-testid*="message"]',
      '.message-content',
      '[class*="message"]'
    ],
    userMessageIndicators: [
      '[data-testid*="user"]',
      '[data-author="user"]'
    ],
    aiMessageIndicators: [
      '[data-testid*="assistant"]',
      '[data-author="assistant"]'
    ],
    timestampSelectors: [
      'time[datetime]',
      '[data-time]'
    ],
    buttonContainerSelectors: [
      '[class*="button"]',
      '.flex.items-center'
    ]
  }
};

// Helper function to detect platform
function detectPlatform() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return 'chatgpt';
  } else if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
    return 'gemini';
  } else if (hostname.includes('x.ai') || hostname.includes('grok')) {
    return 'grok';
  }
  
  return 'unknown';
}

// Helper function to get platform config
function getPlatformConfig() {
  const platform = detectPlatform();
  return PLATFORM_CONFIG[platform] || null;
}

// Export for use in content.js
if (typeof window !== 'undefined') {
  window.PLATFORM_CONFIG = PLATFORM_CONFIG;
  window.detectPlatform = detectPlatform;
  window.getPlatformConfig = getPlatformConfig;
}
