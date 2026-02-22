// UICloner Background Service Worker
// Handles message routing between side panel and content script

const MSG = {
  START_FULL_SCAN: 'START_FULL_SCAN',
  START_ELEMENT_SELECT: 'START_ELEMENT_SELECT',
  CANCEL_OPERATION: 'CANCEL_OPERATION',
  SCAN_PROGRESS: 'SCAN_PROGRESS',
  SCAN_COMPLETE: 'SCAN_COMPLETE',
  ELEMENT_SELECTED: 'ELEMENT_SELECTED',
  SCAN_ERROR: 'SCAN_ERROR',
  CONTENT_READY: 'CONTENT_READY',
};

// Track scanning state per tab
const tabState = new Map();

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Message routing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Message from content script (has sender.tab)
  if (sender.tab) {
    handleContentMessage(message, sender);
    return;
  }

  // Message from side panel (no sender.tab)
  handleSidePanelMessage(message, sendResponse);
  return true; // keep channel open for async response
});

async function handleSidePanelMessage(message, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    switch (message.type) {
      case MSG.START_FULL_SCAN:
      case MSG.START_ELEMENT_SELECT:
      case MSG.CANCEL_OPERATION:
        tabState.set(tab.id, { scanning: true, progress: 0 });
        chrome.tabs.sendMessage(tab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ error: 'Content script not ready. Please refresh the page.' });
          } else {
            sendResponse(response);
          }
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

function handleContentMessage(message, sender) {
  const tabId = sender.tab.id;

  switch (message.type) {
    case MSG.SCAN_PROGRESS:
      tabState.set(tabId, { scanning: true, progress: message.data.percent });
      // Forward to side panel
      chrome.runtime.sendMessage(message).catch(() => {
        // Side panel might not be open
      });
      break;

    case MSG.SCAN_COMPLETE:
    case MSG.ELEMENT_SELECTED:
      tabState.set(tabId, { scanning: false, progress: 100 });
      chrome.runtime.sendMessage(message).catch(() => {});
      break;

    case MSG.SCAN_ERROR:
      tabState.set(tabId, { scanning: false, progress: 0 });
      chrome.runtime.sendMessage(message).catch(() => {});
      break;

    case MSG.CONTENT_READY:
      // Content script is loaded and ready
      break;
  }
}
