// React-Cloner Content Script
// Entry point injected into web pages
// Orchestrates all extraction modules

import { extractTree } from './modules/dom-traversal.js';
import { initExtractor, cleanupExtractor } from './modules/css-extractor.js';
import { activate as activatePicker, deactivate as deactivatePicker } from './modules/element-picker.js';
import { autoScroll } from './modules/auto-scroller.js';
import { detectReactComponents, getComponentName } from './modules/react-detector.js';
import { deduplicateTree } from './modules/duplicate-detector.js';
import { sectionTree, countSections } from './modules/semantic-sectioner.js';
import { extractPseudoElements } from './modules/pseudo-elements.js';

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

let isScanning = false;

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case MSG.START_FULL_SCAN:
      handleFullScan(message.options || {});
      sendResponse({ status: 'started' });
      break;

    case MSG.START_ELEMENT_SELECT:
      handleElementSelect(message.options || {});
      sendResponse({ status: 'started' });
      break;

    case MSG.CANCEL_OPERATION:
      isScanning = false;
      deactivatePicker();
      sendResponse({ status: 'cancelled' });
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
  return true;
});

async function handleFullScan(options) {
  if (isScanning) return;
  isScanning = true;

  try {
    // Phase 1: Initialize
    sendProgress(2, 'initializing', 'Initializing CSS defaults cache...');
    await initExtractor();

    // Phase 2: Auto-scroll (if enabled)
    if (options.autoScroll !== false) {
      sendProgress(5, 'scrolling', 'Scrolling page to load all content...');
      try {
        await autoScroll((percent, phase, msg) => {
          // Map scroll progress to 5-40% of total
          sendProgress(5 + (percent * 0.35), phase, msg);
        }, options);
      } catch (e) {
        // Scroll was cancelled or failed, continue with extraction anyway
      }
    }

    // Phase 3: Detect React components
    sendProgress(42, 'detecting', 'Detecting React components...');
    const componentMap = detectReactComponents(document.body);

    // Phase 4: Extract DOM tree
    sendProgress(45, 'extracting', 'Extracting DOM tree with CSS and Tailwind...');
    let tree = extractTree(document.body, options);

    if (!tree) {
      throw new Error('Failed to extract DOM tree');
    }

    // Phase 5: Enrich with React component names
    sendProgress(65, 'enriching', 'Adding React component names...');
    enrichWithReactNames(tree, componentMap);

    // Phase 6: Add pseudo-elements
    sendProgress(70, 'pseudo', 'Extracting pseudo-elements...');
    enrichWithPseudoElements(tree, document.body);

    // Phase 7: Deduplicate repeated elements
    sendProgress(80, 'deduplicating', 'Detecting duplicate elements...');
    tree = deduplicateTree(tree);

    // Phase 8: Section by semantic landmarks
    sendProgress(88, 'sectioning', 'Splitting by semantic sections...');
    const sections = sectionTree(tree);
    const sectionCount = countSections(sections);

    sendProgress(95, 'finalizing', 'Cleaning up...');
    cleanupExtractor();

    sendProgress(100, 'complete', 'Extraction complete');

    // Build final output
    const output = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      sectionCount,
      sections,
    };

    chrome.runtime.sendMessage({
      type: MSG.SCAN_COMPLETE,
      data: output,
    });
  } catch (err) {
    cleanupExtractor();
    chrome.runtime.sendMessage({
      type: MSG.SCAN_ERROR,
      error: err.message,
    });
  } finally {
    isScanning = false;
  }
}

function handleElementSelect(options) {
  sendProgress(0, 'selecting', 'Click on an element to extract...');

  activatePicker(async (element) => {
    if (!element) {
      // Cancelled
      chrome.runtime.sendMessage({
        type: MSG.SCAN_ERROR,
        error: 'Element selection cancelled',
      });
      return;
    }

    isScanning = true;
    try {
      sendProgress(10, 'initializing', 'Initializing CSS extractor...');
      await initExtractor();

      sendProgress(30, 'detecting', 'Detecting React components...');
      const componentMap = detectReactComponents(element);

      sendProgress(40, 'extracting', 'Extracting element tree...');
      let tree = extractTree(element, options);

      if (!tree) {
        throw new Error('Failed to extract element tree');
      }

      sendProgress(60, 'enriching', 'Adding React component names...');
      enrichWithReactNames(tree, componentMap);

      sendProgress(70, 'pseudo', 'Extracting pseudo-elements...');
      enrichWithPseudoElements(tree, element);

      sendProgress(80, 'deduplicating', 'Detecting duplicates...');
      tree = deduplicateTree(tree);

      sendProgress(95, 'finalizing', 'Cleaning up...');
      cleanupExtractor();

      sendProgress(100, 'complete', 'Extraction complete');

      const output = {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        mode: 'element-select',
        tree,
      };

      chrome.runtime.sendMessage({
        type: MSG.ELEMENT_SELECTED,
        data: output,
      });
    } catch (err) {
      cleanupExtractor();
      chrome.runtime.sendMessage({
        type: MSG.SCAN_ERROR,
        error: err.message,
      });
    } finally {
      isScanning = false;
    }
  });
}

// --- Enrichment Functions ---

function enrichWithReactNames(node, componentMap) {
  if (!node || componentMap.size === 0) return;

  // We need to match nodes back to DOM elements
  // Since we can't store DOM references in the tree,
  // we do a parallel walk of the DOM and the tree
  enrichNodeRecursive(node, document.body, componentMap);
}

function enrichNodeRecursive(node, domElement, componentMap) {
  if (!node || !domElement) return;

  const name = componentMap.get(domElement);
  if (name) {
    node.reactComponent = name;
  }

  // Walk children in parallel
  if (node.children && domElement.children) {
    let treeIdx = 0;
    for (const domChild of domElement.children) {
      if (treeIdx >= (node.children?.length || 0)) break;

      // Match by tag name (best effort)
      const treeChild = node.children[treeIdx];
      if (treeChild && treeChild.tag === domChild.tagName.toLowerCase()) {
        enrichNodeRecursive(treeChild, domChild, componentMap);
        treeIdx++;
      }
    }
  }
}

function enrichWithPseudoElements(node, domElement) {
  if (!node || !domElement) return;

  const pseudo = extractPseudoElements(domElement);
  if (pseudo) {
    node.pseudoElements = pseudo;
  }

  // Walk children in parallel
  if (node.children && domElement.children) {
    let treeIdx = 0;
    for (const domChild of domElement.children) {
      if (treeIdx >= (node.children?.length || 0)) break;

      const treeChild = node.children[treeIdx];
      if (treeChild && treeChild.tag === domChild.tagName.toLowerCase()) {
        enrichWithPseudoElements(treeChild, domChild);
        treeIdx++;
      }
    }
  }
}

function sendProgress(percent, phase, message) {
  try {
    chrome.runtime.sendMessage({
      type: MSG.SCAN_PROGRESS,
      data: { percent, phase, message },
    });
  } catch (e) {
    // Side panel might not be open
  }
}

// Notify that content script is ready
try {
  chrome.runtime.sendMessage({ type: MSG.CONTENT_READY });
} catch (e) {
  // Extension context may not be available
}
