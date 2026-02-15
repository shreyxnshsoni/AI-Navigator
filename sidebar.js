(function() {
  'use strict';

  // React and ReactDOM are available in Extension Context (Isolated World)
  if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
    console.error('❌ React or ReactDOM not available in Sidebar');
    return;
  }

  function Sidebar() {
    // State for messages and UI
    const [messagesData, setMessagesData] = React.useState([]);
    const [hoveredLineId, setHoveredLineId] = React.useState(null);
    const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
    const [hoveredArrow, setHoveredArrow] = React.useState(null);
    const [hoverPreview, setHoverPreview] = React.useState(null);
    const [hoverPosition, setHoverPosition] = React.useState({ top: 0 });

    const formatTimestamp = (raw) => {
      if (!raw) return '';
      try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const now = new Date();
          let hours = d.getHours();
          const minutes = d.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          const timePart = `${hours}:${minutes} ${ampm}`;

          const sameDay =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();

          if (sameDay) {
            return timePart;
          }

          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const datePart = `${months[d.getMonth()]} ${d.getDate()}`;
          return `${datePart}, ${timePart}`;
        }
      } catch (e) {
        // fall through and return raw
      }
      return String(raw);
    };

    // Helper: deep DOM traversal that can see into shadow roots
    const deepFind = (matchFn) => {
      const visited = new Set();
      const queue = [];
      queue.push(document);

      while (queue.length) {
        const node = queue.shift();
        if (!node || visited.has(node)) continue;
        visited.add(node);

        if (node.nodeType === 1) {
          const el = /** @type {Element} */ (node);
          if (matchFn(el)) {
            return el;
          }

          // Enqueue shadow root if present
          if (el.shadowRoot) {
            queue.push(el.shadowRoot);
          }
        }

        // Enqueue children (for both Document, ShadowRoot, and Element)
        const children = node.children || node.childNodes;
        if (children) {
          for (let i = 0; i < children.length; i++) {
            queue.push(children[i]);
          }
        }
      }

      return null;
    };

    // Primary Bubble Filter: only elements with .markdown or actual text (eliminates ghost lines)
    const isPrimaryBubble = (el) => {
      if (!el) return false;
      try {
        if (el.querySelector && el.querySelector('.markdown')) return true;
        const text = (el.innerText || el.textContent || '').trim();
        return text.length > 0;
      } catch (e) { return false; }
    };

    // De-duplication: when nested data-message-author-role exist, keep only the deepest content-bearing one
    const getDeepestPrimaryBubbles = (elements) => {
      const primary = elements.filter(isPrimaryBubble);
      return primary.filter(a => {
        return !primary.some(b => b !== a && a.contains(b));
      });
    };

    // Data-to-DOM Hard Sync: Scrape messageId from [data-message-id], role from [data-message-author-role].
    const buildMessagesFromDOM = () => {
      // Prefer [data-message-id] containers (ChatGPT); apply primary filter and de-duplication
      const byId = Array.from(document.querySelectorAll('[data-message-id]'));
      if (byId.length > 0) {
        const primary = getDeepestPrimaryBubbles(byId);
        primary.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        return primary.map((el, index) => {
          const messageId = el.getAttribute && el.getAttribute('data-message-id');
          const id = messageId ? String(messageId) : (el.id || 'navigator-msg-' + index + '-' + Date.now());
          const roleEl = el.querySelector && el.querySelector('[data-message-author-role]');
          const role = roleEl ? (roleEl.getAttribute('data-message-author-role') || '') : (el.getAttribute && el.getAttribute('data-message-author-role') || '');
          const type = role === 'user' ? 'user' : role === 'assistant' ? 'ai' : 'ai';
          let ts = null;
          try {
            const timeEl = el.querySelector && el.querySelector('time');
            if (timeEl) {
              const rawTs = timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent;
              if (rawTs && rawTs.trim()) ts = rawTs.trim();
            }
          } catch (e) {}
          if (!ts) ts = new Date().toISOString();
          return { id, type, index, timestamp: ts };
        });
      }
      // Fallback: [data-message-author-role]; apply primary filter and de-duplication
      const bubbles = Array.from(document.querySelectorAll('[data-message-author-role]'));
      const primary = getDeepestPrimaryBubbles(bubbles);
      primary.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      return primary.map((bubble, index) => {
        let id = bubble.getAttribute && bubble.getAttribute('data-message-id');
        if (!id && bubble.closest) {
          const parent = bubble.closest('[data-message-id]');
          if (parent) id = parent.getAttribute && parent.getAttribute('data-message-id');
        }
        if (!id) id = bubble.id;
        if (!id) {
          id = 'navigator-msg-' + index + '-' + Date.now();
          if (bubble.setAttribute) bubble.setAttribute('data-message-id', id);
        }
        const role = bubble.getAttribute && bubble.getAttribute('data-message-author-role');
        const type = role === 'user' ? 'user' : role === 'assistant' ? 'ai' : 'ai';
        let ts = null;
        try {
          const timeEl = bubble.querySelector && bubble.querySelector('time');
          if (timeEl) {
            const rawTs = timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent;
            if (rawTs && rawTs.trim()) ts = rawTs.trim();
          }
        } catch (e) {}
        if (!ts) ts = new Date().toISOString();
        return { id: String(id), type, index, timestamp: ts };
      });
    };

    // Find bubble by messageId: query [data-message-id] first, then fallbacks
    const findBubbleByMessageId = (messageId) => {
      if (!messageId) return null;
      try {
        const id = String(messageId);
        const allWithId = document.querySelectorAll('[data-message-id]');
        for (let i = 0; i < allWithId.length; i++) {
          const a = allWithId[i].getAttribute && allWithId[i].getAttribute('data-message-id');
          if (a === id) return allWithId[i];
        }
        const bubbles = document.querySelectorAll('[data-message-author-role]');
        for (let i = 0; i < bubbles.length; i++) {
          const b = bubbles[i];
          const attrId = b.getAttribute && b.getAttribute('data-message-id');
          if (attrId === id || (b.id && b.id === id)) return b;
          const parent = b.closest && b.closest('[data-message-id]');
          if (parent && parent.getAttribute && parent.getAttribute('data-message-id') === id) return parent;
        }
        return deepFind((el) => (el.getAttribute && el.getAttribute('data-message-id') === id) || (el.id === id));
      } catch (e) {
        return null;
      }
    };

    // Hard-ID Binding: Build messages from DOM. Sync on init, storage change, and interval.
    const refreshMessagesFromDOM = () => {
      const next = buildMessagesFromDOM();
      setMessagesData(next);
      setCurrentMessageIndex(Math.max(0, next.length - 1));
    };

    React.useEffect(() => {
      refreshMessagesFromDOM();

      const listener = (changes) => {
        try {
          if (!chrome.runtime?.id) return;
          if (changes && changes.messagesData) refreshMessagesFromDOM();
        } catch (e) {}
      };
      try {
        if (chrome.runtime?.id) {
          chrome.storage.onChanged.addListener(listener);
        }
      } catch (e) {}

      const intervalId = setInterval(() => {
        try {
          if (!chrome.runtime?.id) return;
          refreshMessagesFromDOM();
        } catch (e) {}
      }, 2000);

      return () => {
        try {
          if (chrome.runtime?.id) chrome.storage.onChanged.removeListener(listener);
        } catch (e) {}
        clearInterval(intervalId);
      };
    }, []);

    // Exact Start Navigation: Use messageId to find bubble, scrollIntoView, then -84px offset
    const handleLineClick = (messageId) => {
      try {
        if (!messageId) return;
        const target = findBubbleByMessageId(messageId);
        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => { window.scrollBy(0, -84); }, 300);
        }
      } catch (err) {
        console.error('AI Navigator: failed to scroll to message', err);
      }
      const msgIndex = messagesData.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) setCurrentMessageIndex(msgIndex);
    };

    // Calculate visible messages (last 20 if more than 20)
    const visibleMessages = React.useMemo(() => {
      if (messagesData.length <= 20) return messagesData;
      return messagesData.slice(-20);
    }, [messagesData]);

    // Arrows only when >10 messages (visual lockdown)
    const showArrows = messagesData.length > 10;

    // Message "at top" = bounding rect closest to 85px from top (accounts for -84px ChatGPT header)
    const getMessageIndexAtTopOfViewport = () => {
      if (!messagesData.length) return 0;
      let bestIndex = 0;
      let bestDist = Infinity;
      const anchorY = 85;
      for (let i = 0; i < messagesData.length; i++) {
        const bubble = findBubbleByMessageId(messagesData[i].id);
        if (!bubble) continue;
        const rect = bubble.getBoundingClientRect();
        const dist = Math.abs(rect.top - anchorY);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
      return bestIndex;
    };

    // Arrow navigation: Up = currentIndex - 1, Down = currentIndex + 1. Same scroll math as line clicks.
    const handleArrowClick = (direction) => {
      if (!messagesData.length) return;
      const currentIndex = getMessageIndexAtTopOfViewport();
      const targetIndex = direction === 'up' ? Math.max(0, currentIndex - 1) : Math.min(messagesData.length - 1, currentIndex + 1);
      if (targetIndex === currentIndex) return;
      const msg = messagesData[targetIndex];
      if (!msg) return;
      const target = findBubbleByMessageId(msg.id);
      if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { window.scrollBy(0, -84); }, 300);
      }
      setCurrentMessageIndex(targetIndex);
    };

    // Visibility threshold: hide minimap UI when fewer than 4 messages
    const showMinimap = messagesData.length >= 4;

    // Render the minimap lines
    const renderMinimapLines = () => {
      if (!visibleMessages || visibleMessages.length === 0) return null;

      return visibleMessages.map((message, index) => {
        const isCurrent = messagesData.indexOf(message) === currentMessageIndex;
        const isHovered = hoveredLineId === message.id;

        return React.createElement('div', {
          key: message.id,
          className: `minimap-line ${message.type === 'user' ? 'user-line' : 'ai-line'}`,
          onClick: () => handleLineClick(message.id),
          onMouseEnter: (e) => {
            setHoveredLineId(message.id);

            // Surgical Hover Sync: Use messageId to find bubble, grab text from .markdown only, 10-word cap
            let previewText = 'Message';
            let previewTimestamp = '';
            try {
              const bubble = findBubbleByMessageId(message.id);
              if (bubble) {
                const markdown = bubble.querySelector && bubble.querySelector('.markdown');
                const sourceNode = markdown || bubble;
                const rawText = (sourceNode.innerText || sourceNode.textContent || '').trim();
                if (rawText) {
                  const words = rawText.split(/\s+/);
                  previewText = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
                }
                const timeEl = bubble.querySelector && bubble.querySelector('time');
                const rawTs = timeEl ? (timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent) : (message.timestamp || '');
                previewTimestamp = (rawTs && rawTs.trim()) ? formatTimestamp(rawTs.trim()) : formatTimestamp(new Date().toISOString());
              } else {
                previewTimestamp = formatTimestamp(new Date().toISOString());
              }
            } catch (err) {
              previewTimestamp = formatTimestamp(new Date().toISOString());
            }

            setHoverPreview({ type: message.type, text: previewText, timestamp: previewTimestamp });
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverPosition({ top: rect.top + rect.height / 2 });
          },
          onMouseLeave: () => {
            setHoveredLineId(null);
            setHoverPreview(null);
          }
        });
      });
    };

    // Edge dimming: Up dimmed at first message, Down dimmed at last
    const topIndex = getMessageIndexAtTopOfViewport();
    const atFirst = topIndex <= 0;
    const atLast = topIndex >= messagesData.length - 1;

    // Render scroll indicator arrow (chevron up/down)
    const renderArrow = (direction, label) => {
      const isHovered = hoveredArrow === direction;
      const chevronPath = direction === 'up' ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6';
      const dimmed = direction === 'up' ? atFirst : atLast;
      return React.createElement('div', {
        key: direction,
        className: 'minimap-arrow',
        onMouseEnter: (e) => {
          setHoveredArrow(direction);
          setHoverPreview({ type: 'arrow', text: label });
          const rect = e.currentTarget.getBoundingClientRect();
          setHoverPosition({ top: rect.top + rect.height / 2 });
        },
        onMouseLeave: () => {
          setHoveredArrow(null);
          setHoverPreview(null);
        },
        onClick: () => handleArrowClick(direction),
        style: {
          opacity: showArrows ? (dimmed ? 0.3 : 1) : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: showArrows && !dimmed ? 'auto' : 'none',
          cursor: dimmed ? 'default' : 'pointer'
        }
      },
        React.createElement('svg', {
          width: '16',
          height: '16',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }, React.createElement('path', { d: chevronPath }))
      );
    };

    return React.createElement('div', {
      id: 'sidebar-root',
      className: `minimap-container${showMinimap ? '' : ' minimap-hidden'}`,
      style: {
        pointerEvents: 'none'
      }
    },
      // Minimap Track - only render when visibility threshold is met
      showMinimap && React.createElement('div', {
        className: 'minimap-track'
      },
        // Up Arrow (only when messages > 20 and a line is hovered)
        showArrows && renderArrow('up', 'Scroll Up'),
        // Message lines (last 20 if > 20, otherwise all)
        renderMinimapLines(),
        // Down Arrow (only when messages > 20 and a line is hovered)
        showArrows && renderArrow('down', 'Scroll Down')
      ),
      // Hover Preview Tooltip - You/AI labels (no Grok branding)
      hoverPreview && (hoveredLineId || hoverPreview.type === 'arrow') && React.createElement('div', {
        className: 'hover-preview',
        style: { top: `${hoverPosition.top}px` }
      },
        React.createElement('div', { className: 'hover-preview-box' },
          hoverPreview.type === 'arrow'
            ? React.createElement('div', { className: 'preview-body' }, hoverPreview.text)
            : React.createElement(React.Fragment, null,
                React.createElement('div', {
                  className: `preview-header ${hoverPreview.type === 'user' ? 'user' : 'ai'}`
                },
                  hoverPreview.type === 'user' ? 'You' : 'AI',
                  hoverPreview.timestamp
                    ? React.createElement('span', { className: 'preview-timestamp' }, ' • ' + hoverPreview.timestamp)
                    : null
                ),
                React.createElement('div', { className: 'preview-body' }, hoverPreview.text)
              )
        )
      )
    );
  }

  // Watch and Render - Self-sufficient sidebar logic
  function startWatching() {
    // Step 1: Wait for React and ReactDOM (loaded from manifest content_scripts)
    if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
      // Retry after 100ms
      setTimeout(startWatching, 100);
      return;
    }

    // Step 2: Watch for navigator-root element
    const watchInterval = setInterval(() => {
      const host = document.getElementById('navigator-root');

      if (host && host.shadowRoot) {
        // Found it! Now mount
        const shadowRoot = host.shadowRoot;
        const reactRootDiv = shadowRoot.getElementById('sidebar-root');

        if (reactRootDiv) {
          // Clear the interval - we found everything we need
          clearInterval(watchInterval);

          // Create React root and render
          const root = ReactDOM.createRoot(reactRootDiv);
          root.render(React.createElement(Sidebar));

          // Store reference for later access
          shadowRoot._reactRoot = root;

          console.log('✅ AI Navigator Fully Mounted');
        }
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(watchInterval);
    }, 10000);
  }

  // Start watching immediately
  startWatching();
})();
