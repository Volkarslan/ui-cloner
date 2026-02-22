// Pseudo-Element Extractor
// Extracts ::before and ::after computed styles

import { DESIGN_PROPERTIES } from '../helpers/design-properties.js';

export function extractPseudoElements(element) {
  const result = {};

  const before = extractPseudo(element, '::before');
  if (before) result.before = before;

  const after = extractPseudo(element, '::after');
  if (after) result.after = after;

  if (Object.keys(result).length === 0) return null;
  return result;
}

function extractPseudo(element, pseudo) {
  try {
    const computed = window.getComputedStyle(element, pseudo);

    // Check if pseudo-element exists
    const content = computed.getPropertyValue('content');
    if (!content || content === 'none' || content === 'normal' || content === '""') {
      return null;
    }

    const display = computed.getPropertyValue('display');
    if (display === 'none') return null;

    const result = {
      content: content,
    };

    // Extract design-relevant properties
    const relevantProps = [
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'width', 'height',
      'background-color', 'background-image',
      'color', 'font-size', 'font-weight', 'font-family',
      'border-top-left-radius', 'border-top-right-radius',
      'border-bottom-left-radius', 'border-bottom-right-radius',
      'opacity', 'transform',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    ];

    for (const prop of relevantProps) {
      const value = computed.getPropertyValue(prop).trim();
      if (value && value !== 'auto' && value !== 'none' && value !== 'normal' &&
          value !== '0px' && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)') {
        result[prop] = value;
      }
    }

    return result;
  } catch (e) {
    return null;
  }
}
