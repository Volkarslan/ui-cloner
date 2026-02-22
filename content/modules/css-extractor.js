// CSS Extractor Module
// Extracts design-relevant, non-default CSS properties from elements

import { DESIGN_PROPERTIES } from '../helpers/design-properties.js';
import { initDefaultsCache, getDefaultsForTag, destroyDefaultsCache } from '../helpers/css-defaults.js';

// Properties to skip if they have these "trivial" values
const TRIVIAL_VALUES = {
  'background-color': ['rgba(0, 0, 0, 0)', 'transparent'],
  'background-image': ['none'],
  'box-shadow': ['none'],
  'text-shadow': ['none'],
  'transform': ['none'],
  'outline': ['none'],
  'outline-style': ['none'],
  'border-top-style': ['none'],
  'border-right-style': ['none'],
  'border-bottom-style': ['none'],
  'border-left-style': ['none'],
  'float': ['none'],
  'clear': ['none'],
  'cursor': ['auto'],
  'pointer-events': ['auto'],
  'list-style-type': ['none', 'disc'],
};

export async function initExtractor() {
  await initDefaultsCache();
}

export function cleanupExtractor() {
  destroyDefaultsCache();
}

export function extractCSS(element) {
  const computed = window.getComputedStyle(element);
  const tagName = element.tagName;
  const defaults = getDefaultsForTag(tagName);
  const result = {};

  for (const prop of DESIGN_PROPERTIES) {
    const value = computed.getPropertyValue(prop).trim();

    // Skip empty values
    if (!value) continue;

    // Skip if same as browser default
    const defaultValue = defaults.get(prop) || '';
    if (value === defaultValue) continue;

    // Skip trivial/meaningless values
    if (TRIVIAL_VALUES[prop] && TRIVIAL_VALUES[prop].includes(value)) continue;

    // Skip auto values for certain properties (usually meaningless)
    if (value === 'auto' && isAutoMeaningless(prop)) continue;

    // Skip normal values for certain properties
    if (value === 'normal' && isNormalMeaningless(prop)) continue;

    result[prop] = value;
  }

  // Clean up and simplify the result
  return simplifyCSS(result);
}

function isAutoMeaningless(prop) {
  const autoProps = [
    'top', 'right', 'bottom', 'left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'z-index',
  ];
  return autoProps.includes(prop);
}

function isNormalMeaningless(prop) {
  const normalProps = [
    'font-style', 'letter-spacing', 'word-spacing', 'white-space',
    'line-height', 'word-break',
  ];
  return normalProps.includes(prop);
}

function simplifyCSS(css) {
  const result = { ...css };

  // Combine border-radius if all corners are equal
  const corners = [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius'
  ];
  const cornerValues = corners.map(c => result[c]).filter(Boolean);
  if (cornerValues.length === 4 && new Set(cornerValues).size === 1) {
    result['border-radius'] = cornerValues[0];
    corners.forEach(c => delete result[c]);
  } else if (cornerValues.length > 0 && cornerValues.length < 4) {
    // Keep individual corners as-is
  }

  // Combine border widths if all are equal and have style
  const borderWidths = ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'];
  const borderStyles = ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'];
  const borderColors = ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];

  const bw = borderWidths.map(p => result[p]).filter(Boolean);
  const bs = borderStyles.map(p => result[p]).filter(Boolean);
  const bc = borderColors.map(p => result[p]).filter(Boolean);

  if (bw.length === 4 && new Set(bw).size === 1 &&
      bs.length === 4 && new Set(bs).size === 1 &&
      bc.length === 4 && new Set(bc).size === 1) {
    result['border'] = `${bw[0]} ${bs[0]} ${bc[0]}`;
    [...borderWidths, ...borderStyles, ...borderColors].forEach(p => delete result[p]);
  }

  // Combine padding if all sides are equal
  const paddings = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
  const pv = paddings.map(p => result[p]).filter(Boolean);
  if (pv.length === 4) {
    if (new Set(pv).size === 1) {
      result['padding'] = pv[0];
      paddings.forEach(p => delete result[p]);
    } else if (pv[0] === pv[2] && pv[1] === pv[3]) {
      result['padding'] = `${pv[0]} ${pv[1]}`;
      paddings.forEach(p => delete result[p]);
    }
  }

  // Combine margin if all sides are equal
  const margins = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
  const mv = margins.map(p => result[p]).filter(Boolean);
  if (mv.length === 4) {
    if (new Set(mv).size === 1) {
      result['margin'] = mv[0];
      margins.forEach(p => delete result[p]);
    } else if (mv[0] === mv[2] && mv[1] === mv[3]) {
      result['margin'] = `${mv[0]} ${mv[1]}`;
      margins.forEach(p => delete result[p]);
    }
  }

  // Remove position-related properties if position is static
  if (!result['position'] || result['position'] === 'static') {
    delete result['position'];
    delete result['top'];
    delete result['right'];
    delete result['bottom'];
    delete result['left'];
  }

  // Remove flex properties if display is not flex/inline-flex
  if (result['display'] !== 'flex' && result['display'] !== 'inline-flex') {
    const flexProps = ['flex-direction', 'flex-wrap', 'justify-content', 'align-items',
      'align-content', 'gap', 'row-gap', 'column-gap'];
    flexProps.forEach(p => delete result[p]);
  }

  // Remove grid properties if display is not grid/inline-grid
  if (result['display'] !== 'grid' && result['display'] !== 'inline-grid') {
    const gridProps = ['grid-template-columns', 'grid-template-rows', 'grid-column',
      'grid-row', 'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows'];
    gridProps.forEach(p => delete result[p]);
  }

  // Remove flex-grow/shrink/basis/order/align-self if parent is not flex
  // (This check can't be done here without parent context, so we skip it)

  // Remove object-fit if not an image/video
  // (handled in dom-traversal contextually)

  return result;
}
