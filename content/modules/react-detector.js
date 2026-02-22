// React Component Name Detector
// Detects React component names by traversing the fiber tree
// Uses data attributes for cross-world communication

let fiberKey = null;
let componentMap = new Map();

export function detectReactComponents(rootElement) {
  componentMap.clear();
  fiberKey = findFiberKey(rootElement);

  if (!fiberKey) {
    // React not detected on this page
    return componentMap;
  }

  walkDOM(rootElement);
  return componentMap;
}

export function getComponentName(element) {
  return componentMap.get(element) || null;
}

export function isReactApp() {
  return fiberKey !== null;
}

function findFiberKey(root) {
  // Look for React fiber property on any DOM element
  // React 16/17: __reactInternalInstance$xxx
  // React 18+: __reactFiber$xxx
  const elements = root.querySelectorAll('*');

  for (let i = 0; i < Math.min(elements.length, 100); i++) {
    const el = elements[i];
    const keys = Object.keys(el);
    for (const key of keys) {
      if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
        return key;
      }
    }
  }

  return null;
}

function walkDOM(element) {
  if (!element || !element.children) return;

  // Try to get component name for this element
  const name = getReactComponentNameForElement(element);
  if (name) {
    componentMap.set(element, name);
  }

  // Walk children
  for (const child of element.children) {
    walkDOM(child);
  }
}

function getReactComponentNameForElement(element) {
  try {
    const fiber = element[fiberKey];
    if (!fiber) return null;

    // Walk up the fiber tree to find the nearest component fiber
    let current = fiber;
    // Limit traversal to avoid infinite loops
    let steps = 0;
    const maxSteps = 20;

    while (current && steps < maxSteps) {
      if (typeof current.type === 'function') {
        const name = current.type.displayName || current.type.name || null;
        if (name && isValidComponentName(name)) {
          return name;
        }
      }

      // Also check for class components
      if (current.type && current.type.prototype && current.type.prototype.isReactComponent) {
        const name = current.type.displayName || current.type.name || null;
        if (name && isValidComponentName(name)) {
          return name;
        }
      }

      current = current.return;
      steps++;
    }
  } catch (e) {
    // Silently fail - fiber structure might be unexpected
  }

  return null;
}

function isValidComponentName(name) {
  // Skip internal React components and fragments
  const skipNames = new Set([
    'Fragment',
    'Suspense',
    'StrictMode',
    'Profiler',
    'Provider',
    'Consumer',
    'Context',
    'ForwardRef',
    'Memo',
  ]);

  if (skipNames.has(name)) return false;
  if (name.startsWith('_')) return false;
  if (name.length < 2) return false;

  // Component names should start with uppercase
  if (name[0] !== name[0].toUpperCase()) return false;

  return true;
}
