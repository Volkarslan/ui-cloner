// Visibility Checker Module
// Determines if a DOM element is visible and should be extracted

const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'NOSCRIPT',
  'TEMPLATE', 'SLOT', 'BR', 'WBR',
]);

export function isVisible(element) {
  // Skip non-element nodes
  if (element.nodeType !== Node.ELEMENT_NODE) return false;

  // Skip non-visual tags
  if (SKIP_TAGS.has(element.tagName)) return false;

  // Check computed styles
  const style = window.getComputedStyle(element);
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (style.opacity === '0') return false;

  // Check dimensions (zero-size elements with no children are invisible)
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Exception: elements with overflow visible might have visible children
    if (style.overflow !== 'visible') return false;
    // Check if it has any visible child
    if (element.children.length === 0) return false;
  }

  // Check aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') return false;

  return true;
}

export function shouldSkipTag(tagName) {
  return SKIP_TAGS.has(tagName);
}
