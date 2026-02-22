// DOM Traversal Module
// Recursively walks the DOM tree and extracts visible elements

import { isVisible } from './visibility-checker.js';
import { extractCSS } from './css-extractor.js';
import { mapToTailwind } from './tailwind-mapper.js';

export function extractTree(rootElement, options = {}) {
  if (!rootElement) return null;

  const node = extractNode(rootElement, options, 0);
  return node;
}

function extractNode(element, options, depth) {
  // Check visibility
  if (!isVisible(element)) return null;

  // Optional depth limit
  if (options.maxDepth && depth > options.maxDepth) {
    return { tag: element.tagName.toLowerCase(), truncated: true, depth };
  }

  const node = {
    tag: element.tagName.toLowerCase(),
  };

  // Extract CSS (if extractor is initialized)
  if (options.extractCSS !== false) {
    const css = extractCSS(element);
    if (Object.keys(css).length > 0) {
      node.css = css;
      // Generate Tailwind suggestions
      const tailwind = mapToTailwind(css);
      if (tailwind) {
        node.tailwind = tailwind;
      }
    }
  }

  // Extract ARIA role (for semantic sectioning)
  const role = element.getAttribute('role');
  if (role) {
    node.role = role;
  }

  // Extract direct text content (not from children)
  const textContent = getDirectTextContent(element);
  if (textContent) {
    node.textContent = textContent;
  }

  // Extract image source
  if (element.tagName === 'IMG') {
    const src = element.currentSrc || element.src;
    if (src) {
      node.src = options.usePlaceholders ? `placeholder://${element.naturalWidth || element.width}x${element.naturalHeight || element.height}` : src;
    }
    const alt = element.getAttribute('alt');
    if (alt) node.alt = alt;
  }

  // Extract link href
  if (element.tagName === 'A') {
    const href = element.getAttribute('href');
    if (href) node.href = href;
  }

  // Extract input attributes
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
    const type = element.getAttribute('type');
    if (type) node.inputType = type;
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) node.placeholder = placeholder;
  }

  // Handle SVG elements
  if (element.tagName === 'svg' || element.tagName === 'SVG') {
    const width = element.getAttribute('width') || element.getBoundingClientRect().width;
    const height = element.getAttribute('height') || element.getBoundingClientRect().height;
    const fill = window.getComputedStyle(element).fill;
    const stroke = window.getComputedStyle(element).stroke;

    node.svgInfo = {
      width: String(width),
      height: String(height),
    };
    if (fill && fill !== 'none' && fill !== 'rgb(0, 0, 0)') node.svgInfo.fill = fill;
    if (stroke && stroke !== 'none') node.svgInfo.stroke = stroke;
    node.svgInfo.placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="currentColor" opacity="0.2"/></svg>`;

    // Don't recurse into SVG children
    return node;
  }

  // Process children
  const children = [];
  for (const child of element.children) {
    const childNode = extractNode(child, options, depth + 1);
    if (childNode) {
      children.push(childNode);
    }
  }

  if (children.length > 0) {
    node.children = children;
  }

  return node;
}

function getDirectTextContent(element) {
  let text = '';
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    }
  }
  text = text.trim();
  // Skip very long text (likely not UI text)
  if (text.length > 500) {
    text = text.substring(0, 500) + '...';
  }
  return text || null;
}
