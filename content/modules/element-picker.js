// Element Picker Module
// Click-to-select element with hover highlight overlay

let isActive = false;
let overlay = null;
let selectedCallback = null;

export function activate(onSelected) {
  if (isActive) return;
  isActive = true;
  selectedCallback = onSelected;

  createOverlay();
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);

  // Change cursor
  document.body.style.cursor = 'crosshair';
}

export function deactivate() {
  if (!isActive) return;
  isActive = false;
  selectedCallback = null;

  removeOverlay();
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);

  document.body.style.cursor = '';
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'uicloner-overlay';
  overlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 2147483647;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    transition: all 0.1s ease;
    display: none;
  `;

  // Label for showing tag name
  const label = document.createElement('div');
  label.id = 'uicloner-label';
  label.style.cssText = `
    position: absolute;
    top: -22px;
    left: -2px;
    background: #3b82f6;
    color: white;
    font-size: 11px;
    font-family: -apple-system, sans-serif;
    padding: 2px 6px;
    border-radius: 3px 3px 0 0;
    white-space: nowrap;
    pointer-events: none;
  `;
  overlay.appendChild(label);

  document.body.appendChild(overlay);
}

function removeOverlay() {
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
  overlay = null;
}

function handleMouseMove(e) {
  if (!isActive || !overlay) return;

  // Ignore the overlay itself
  const element = getElementAtPoint(e.clientX, e.clientY);
  if (!element || element === document.body || element === document.documentElement) {
    overlay.style.display = 'none';
    return;
  }

  const rect = element.getBoundingClientRect();
  overlay.style.display = 'block';
  overlay.style.top = rect.top + 'px';
  overlay.style.left = rect.left + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';

  // Update label
  const label = overlay.querySelector('#uicloner-label');
  if (label) {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    label.textContent = `${tagName}${id}`;
  }
}

function handleClick(e) {
  if (!isActive) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const element = getElementAtPoint(e.clientX, e.clientY);
  if (!element) {
    deactivate();
    return;
  }

  const callback = selectedCallback;
  deactivate();

  if (callback) {
    callback(element);
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    deactivate();
    if (selectedCallback) {
      // Signal cancellation
      selectedCallback(null);
    }
  }
}

function getElementAtPoint(x, y) {
  // Temporarily hide overlay to get element beneath it
  if (overlay) {
    overlay.style.display = 'none';
  }
  const element = document.elementFromPoint(x, y);
  if (overlay) {
    overlay.style.display = 'block';
  }
  return element;
}
