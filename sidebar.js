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
    const timestampCacheRef = React.useRef({});

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

    const findMessageNodeDeep = (messageId, type) => {
      if (!messageId) return null;

      const roleSelector = type === 'user' ? 'user' : 'assistant';

      // First try role-scoped selector
      const primary = deepFind((el) => {
        const idAttr = el.getAttribute && el.getAttribute('data-message-id');
        const roleAttr = el.getAttribute && el.getAttribute('data-message-author-role');
        return idAttr === String(messageId) && roleAttr === roleSelector;
      });
      if (primary) return primary;

      // Fallback: any element with matching data-message-id
      const fallback = deepFind((el) => {
        const idAttr = el.getAttribute && el.getAttribute('data-message-id');
        return idAttr === String(messageId);
      });
      return fallback;
    };

    // Normalize a raw message into our internal shape with a strong type field and timestamp.
    // Type is bound 1:1 to the DOM role at the same index.
    const normalizeMessage = (raw, index, bubbles) => {
      if (!raw || typeof raw !== 'object') return raw;

      // Force type from [data-message-author-role] at the same index
      let derivedType = 'ai';
      if (Array.isArray(bubbles) && index >= 0 && index < bubbles.length) {
        const roleAttr = bubbles[index]?.getAttribute?.('data-message-author-role');
        if (roleAttr === 'user') {
          derivedType = 'user';
        } else if (roleAttr === 'assistant') {
          derivedType = 'ai';
        }
      }

      // Timestamp: prefer existing value, otherwise derive from DOM or use current time
      let ts = raw.timestamp || raw.time || raw.createdAt;
      const cache = timestampCacheRef.current || {};

      if (!ts && raw.id && cache[raw.id]) {
        ts = cache[raw.id];
      }

      if (!ts && raw.id) {
        try {
          const node = findMessageNodeDeep(raw.id, derivedType);
          if (node) {
            const timeEl = node.querySelector && node.querySelector('time');
            const rawTs = timeEl
              ? (timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent)
              : '';
            if (rawTs && rawTs.trim()) {
              ts = rawTs.trim();
            }
          }
        } catch (e) {
          // ignore and fall back to now
        }
      }

      if (!ts) {
        ts = new Date().toISOString();
      }

      if (raw.id) {
        cache[raw.id] = ts;
        timestampCacheRef.current = cache;
      }

      return {
        ...raw,
        type: derivedType,
        timestamp: ts
      };
    };

    const normalizeMessagesArray = (arr) => {
      if (!Array.isArray(arr)) return [];
      const bubbles = Array.from(document.querySelectorAll('[data-message-author-role]'));
      return arr.map((msg, index) => normalizeMessage(msg, index, bubbles));
    };

    // Load messages from chrome.storage.local and keep them refreshed
    React.useEffect(() => {
      const loadData = () => {
        chrome.storage.local.get(['messagesData'], (result) => {
          if (result.messagesData && result.messagesData.length > 0) {
            const normalized = normalizeMessagesArray(result.messagesData);
            setMessagesData(normalized);
            setCurrentMessageIndex(normalized.length - 1);
          } else {
            setMessagesData([]);
            setCurrentMessageIndex(0);
          }
        });
      };

      // Initial load
      loadData();

      // Listen for storage updates
      const listener = (changes) => {
        if (changes.messagesData) {
          const next = normalizeMessagesArray(changes.messagesData.newValue || []);
          setMessagesData(next);
          setCurrentMessageIndex(next.length - 1 || 0);
        }
      };

      chrome.storage.onChanged.addListener(listener);
      // Periodic refresh to stay in sync with live DOM scraper
      const intervalId = setInterval(loadData, 2000);

      return () => {
        chrome.storage.onChanged.removeListener(listener);
        clearInterval(intervalId);
      };
    }, []);

    // Handle line click - scroll to message using DOM lookup by data-message-id
    const handleLineClick = (messageId) => {
      try {
        if (!messageId) return;

        const message = messagesData.find(m => m.id === messageId);
        const target = findMessageNodeDeep(messageId, message ? message.type : undefined);

        if (target && typeof target.scrollIntoView === 'function') {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

          // Apply offset so the message is not hidden under the top nav
          setTimeout(() => {
            window.scrollBy(0, -84);
          }, 300);
        }
      } catch (err) {
        console.error('AI Navigator: failed to scroll to message', err);
      }

      // Update current message index
      const msgIndex = messagesData.findIndex(m => m.id === messageId);
      if (msgIndex !== -1) {
        setCurrentMessageIndex(msgIndex);
      }
    };

    // Calculate visible messages (last 20 if more than 20)
    const visibleMessages = React.useMemo(() => {
      if (messagesData.length <= 20) return messagesData;
      return messagesData.slice(-20);
    }, [messagesData]);

    // Calculate if we should show arrows (more than 20 messages and a line is hovered)
    const showArrows = messagesData.length > 20 && hoveredLineId !== null;

    // Handle arrow navigation
    const handleArrowClick = (direction) => {
      let targetIndex = currentMessageIndex;
      
      if (direction === 'up') {
        targetIndex = Math.max(0, currentMessageIndex - 1);
      } else {
        targetIndex = Math.min(messagesData.length - 1, currentMessageIndex + 1);
      }
      
      if (targetIndex !== currentMessageIndex && messagesData[targetIndex]) {
        setCurrentMessageIndex(targetIndex);
        handleLineClick(messagesData[targetIndex].id);
      }
    };

    // Visibility threshold: hide minimap UI when fewer than 4 messages
    const showMinimap = messagesData.length >= 4;

    // Render the minimap lines
    const renderMinimapLines = () => {
      if (!visibleMessages || visibleMessages.length === 0) return null;

      return visibleMessages.map((message, index) => {
        const isCurrent = messagesData.indexOf(message) === currentMessageIndex;
        const isHovered = hoveredLineId === message.id;
        const isUser = message.type === 'user';
        
        return React.createElement('div', {
          key: message.id,
          className: `minimap-line ${isUser ? 'user' : 'ai'}`,
          onClick: () => handleLineClick(message.id),
          onMouseEnter: (e) => {
            setHoveredLineId(message.id);

            // Scrape live DOM text for preview using role-ordered bubbles and a strict 10-word cap.
            let previewText = 'Message';
            let previewTimestamp = '';
            try {
              // Find the global index of this message in the full messages array
              const globalIndex = messagesData.findIndex(m => m.id === message.id);
              const allBubbles = Array.from(document.querySelectorAll('[data-message-author-role]'));

              let bubble = null;
              if (globalIndex >= 0 && globalIndex < allBubbles.length) {
                bubble = allBubbles[globalIndex];
              }

              if (bubble) {
                const sourceNode =
                  bubble.querySelector('.markdown') ||
                  bubble;

                const rawText = (sourceNode.innerText || sourceNode.textContent || '').trim();
                if (rawText) {
                  const words = rawText.split(/\s+/);
                  previewText = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
                }

                const timeEl = bubble.querySelector('time');
                const rawTs = timeEl
                  ? (timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent)
                  : (message.timestamp || message.time || message.createdAt || '');
                if (rawTs) {
                  previewTimestamp = formatTimestamp(rawTs.trim());
                }
              } else if (message.text) {
                const rawText = message.text.trim();
                const words = rawText.split(/\s+/);
                previewText = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
                if (message.timestamp || message.time || message.createdAt) {
                  previewTimestamp = formatTimestamp(message.timestamp || message.time || message.createdAt);
                }
              }
            } catch (err) {
              if (message.text) {
                const rawText = message.text.trim();
                const words = rawText.split(/\s+/);
                previewText = words.slice(0, 10).join(' ') + (words.length > 10 ? '...' : '');
                if (message.timestamp || message.time || message.createdAt) {
                  previewTimestamp = formatTimestamp(message.timestamp || message.time || message.createdAt);
                }
              }
            }

            setHoverPreview({
              type: message.type,
              text: previewText,
              timestamp: previewTimestamp
            });

            // Calculate tooltip position
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

    // Render arrow with tooltip
    const renderArrow = (direction, label) => {
      const isHovered = hoveredArrow === direction;
      
      return React.createElement('div', {
        key: direction,
        className: 'minimap-arrow',
        onMouseEnter: () => setHoveredArrow(direction),
        onMouseLeave: () => setHoveredArrow(null),
        onClick: () => handleArrowClick(direction),
        style: {
          opacity: showArrows ? 1 : 0,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: showArrows ? 'auto' : 'none'
        }
      },
        // Arrow icon
        React.createElement('svg', {
          width: '12',
          height: '12',
          viewBox: '0 0 12 12',
          fill: 'none',
          stroke: '#00f2ff',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        },
          direction === 'up' 
            ? React.createElement('path', { d: 'M6 2 L2 6 L6 10 M6 2 L10 6 L6 10' })
            : React.createElement('path', { d: 'M6 2 L2 6 L6 10 M6 2 L10 6 L6 10', transform: 'rotate(180 6 6)' })
        ),
        // Tooltip label
        isHovered && React.createElement('div', {
          className: 'arrow-tooltip',
          style: {
            position: 'absolute',
            right: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '6px 10px',
            background: 'rgba(20, 20, 20, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 2147483647,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)'
          }
        }, label)
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
        showArrows && renderArrow('up', 'Previous response'),
        // Message lines (last 20 if > 20, otherwise all)
        renderMinimapLines(),
        // Down Arrow (only when messages > 20 and a line is hovered)
        showArrows && renderArrow('down', 'Next response')
      ),
      // Hover Preview Tooltip - Follows cursor vertically
      hoverPreview && hoveredLineId && React.createElement('div', {
        className: 'hover-preview',
        style: {
          top: `${hoverPosition.top}px`
        }
      },
        React.createElement('div', {
          className: `hover-preview-box`
        },
          React.createElement('div', {
            className: `preview-header ${hoverPreview.type === 'user' ? 'user' : 'ai'}`
          },
            hoverPreview.type === 'user' ? 'You' : 'AI',
            hoverPreview.timestamp
              ? React.createElement('span', {
                  className: 'preview-timestamp'
                }, hoverPreview.timestamp)
              : null
          ),
          React.createElement('div', {
            className: 'preview-body'
          }, hoverPreview.text)
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
