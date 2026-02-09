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

    // Load messages from chrome.storage.local
    React.useEffect(() => {
      const loadData = () => {
        chrome.storage.local.get(['messagesData'], (result) => {
          if (result.messagesData && result.messagesData.length > 0) {
            setMessagesData(result.messagesData);
            setCurrentMessageIndex(result.messagesData.length - 1);
          }
        });
      };

      // Initial load
      loadData();

      // Listen for storage updates
      const listener = (changes) => {
        if (changes.messagesData) {
          setMessagesData(changes.messagesData.newValue || []);
          setCurrentMessageIndex(changes.messagesData.newValue?.length - 1 || 0);
        }
      };

      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }, []);

    // Handle line click - scroll to message
    const handleLineClick = (messageId) => {
      // Send message to content script to scroll with precision snap
      window.postMessage({
        type: 'SCROLL_TO_MESSAGE',
        messageId: messageId,
        block: 'start',
        offset: -100
      }, '*');

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

    // Lifecycle Visibility: Hide minimap if less than 4 messages
    if (messagesData.length < 4) {
      return null;
    }

    // Render the minimap lines
    const renderMinimapLines = () => {
      if (!visibleMessages || visibleMessages.length === 0) return null;

      return visibleMessages.map((message, index) => {
        const isCurrent = messagesData.indexOf(message) === currentMessageIndex;
        const isHovered = hoveredLineId === message.id;
        const isUser = message.role === 'user';
        
        // Get message preview text
        const previewText = message.text ? message.text.substring(0, 100) : 'Message';
        
        return React.createElement('div', {
          key: message.id,
          className: `minimap-line ${isUser ? 'user' : 'ai'}`,
          onClick: () => handleLineClick(message.id),
          onMouseEnter: (e) => {
            setHoveredLineId(message.id);
            setHoverPreview({
              type: message.role,
              text: previewText
            });
            // Calculate tooltip position
            const rect = e.currentTarget.getBoundingClientRect();
            setHoverPosition({ top: rect.top + rect.height / 2 });
          },
          onMouseLeave: () => {
            setHoveredLineId(null);
            setHoverPreview(null);
          },
          style: {
            width: isHovered ? '22px' : (isUser ? '6px' : '14px'),
            height: '2px',
            backgroundColor: isHovered || isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            boxShadow: isHovered ? '0 0 8px rgba(255, 255, 255, 1)' : 'none',
            transition: 'all 0.2s ease',
            pointerEvents: 'auto',
            position: 'relative',
            borderRadius: '4px'
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
      className: 'minimap-container',
      style: {
        pointerEvents: 'none'
      }
    },
      // Minimap Track - Vertical strip on far right with uniform spacing
      React.createElement('div', {
        className: 'minimap-track',
        style: {
          position: 'fixed',
          top: 0,
          right: '20px',
          width: '40px',
          height: '100vh',
          background: 'transparent',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '12px'
        }
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
          position: 'fixed',
          top: `${hoverPosition.top}px`,
          right: '50px',
          pointerEvents: 'auto',
          transform: 'translateY(-50%)',
          zIndex: 2147483647
        }
      },
        React.createElement('div', {
          style: {
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: hoverPreview.type === 'user' ? 'rgba(255, 255, 255, 0.8)' : '#00f2ff'
          }
        }, hoverPreview.type === 'user' ? 'You' : 'AI'),
        React.createElement('div', {
          style: {
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'rgba(255, 255, 255, 0.95)'
          }
        }, hoverPreview.text)
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
