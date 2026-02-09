// Popup script to show extension status
document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  
  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const url = currentTab.url;
    
    // Check if we're on a supported AI platform
    const supportedPlatforms = [
      'chatgpt.com',
      'claude.ai',
      'gemini.google.com',
      'x.ai'
    ];
    
    const isSupported = supportedPlatforms.some(platform => url.includes(platform));
    
    if (isSupported) {
      statusDiv.textContent = '✅ Active on this page';
      statusDiv.classList.add('active');
      
      // Get message count from storage
      chrome.storage.local.get(['messageCount', 'platform'], (result) => {
        if (result.messageCount) {
          const info = document.querySelector('.info');
          info.innerHTML = `
            <p><strong>Platform:</strong> ${result.platform}</p>
            <p><strong>Messages found:</strong> ${result.messageCount}</p>
            <p>The minimap will appear on the right side of the chat.</p>
          `;
        }
      });
    } else {
      statusDiv.textContent = '⚠️ Visit an AI chat platform';
      statusDiv.style.background = '#fff3cd';
      statusDiv.style.color = '#856404';
      
      const info = document.querySelector('.info');
      info.innerHTML = `
        <p>Supported platforms:</p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>ChatGPT</li>
          <li>Claude</li>
          <li>Gemini</li>
          <li>Grok</li>
        </ul>
      `;
    }
  });
});
