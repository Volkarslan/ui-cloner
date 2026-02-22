// Tailwind CSS Mapper Module
// Converts extracted CSS properties to Tailwind utility classes

import {
  SPACING_SCALE,
  FONT_SIZE_MAP,
  FONT_WEIGHT_MAP,
  BORDER_RADIUS_MAP,
  LINE_HEIGHT_MAP,
  OPACITY_MAP,
  WIDTH_MAP,
  HEIGHT_MAP,
  MAX_WIDTH_MAP,
  COLOR_PALETTE,
} from '../helpers/tailwind-values.js';

export function mapToTailwind(cssObj) {
  if (!cssObj || Object.keys(cssObj).length === 0) return '';

  const classes = [];

  // Handle shorthand properties first
  if (cssObj['padding']) {
    classes.push(...handleShorthandSpacing('p', cssObj['padding']));
  } else {
    addSpacingClass(classes, 'pt', cssObj['padding-top']);
    addSpacingClass(classes, 'pr', cssObj['padding-right']);
    addSpacingClass(classes, 'pb', cssObj['padding-bottom']);
    addSpacingClass(classes, 'pl', cssObj['padding-left']);
  }

  if (cssObj['margin']) {
    classes.push(...handleShorthandSpacing('m', cssObj['margin']));
  } else {
    addSpacingClass(classes, 'mt', cssObj['margin-top']);
    addSpacingClass(classes, 'mr', cssObj['margin-right']);
    addSpacingClass(classes, 'mb', cssObj['margin-bottom']);
    addSpacingClass(classes, 'ml', cssObj['margin-left']);
  }

  // Optimize: combine same padding/margin values
  optimizeSpacing(classes);

  // Display
  if (cssObj['display']) {
    const display = mapDisplay(cssObj['display']);
    if (display) classes.push(display);
  }

  // Position
  if (cssObj['position']) {
    classes.push(cssObj['position']); // relative, absolute, fixed, sticky
  }

  // Inset (top, right, bottom, left)
  addSpacingClass(classes, 'top', cssObj['top']);
  addSpacingClass(classes, 'right', cssObj['right']);
  addSpacingClass(classes, 'bottom', cssObj['bottom']);
  addSpacingClass(classes, 'left', cssObj['left']);

  // Width & Height
  if (cssObj['width']) {
    const w = WIDTH_MAP[cssObj['width']] || SPACING_SCALE[cssObj['width']];
    classes.push(w ? `w-${w}` : `w-[${cssObj['width']}]`);
  }
  if (cssObj['height']) {
    const h = HEIGHT_MAP[cssObj['height']] || SPACING_SCALE[cssObj['height']];
    classes.push(h ? `h-${h}` : `h-[${cssObj['height']}]`);
  }
  if (cssObj['min-width']) {
    const v = SPACING_SCALE[cssObj['min-width']];
    classes.push(v ? `min-w-${v}` : `min-w-[${cssObj['min-width']}]`);
  }
  if (cssObj['min-height']) {
    const v = SPACING_SCALE[cssObj['min-height']];
    classes.push(v ? `min-h-${v}` : `min-h-[${cssObj['min-height']}]`);
  }
  if (cssObj['max-width']) {
    const v = MAX_WIDTH_MAP[cssObj['max-width']] || SPACING_SCALE[cssObj['max-width']];
    classes.push(v ? `max-w-${v}` : `max-w-[${cssObj['max-width']}]`);
  }
  if (cssObj['max-height']) {
    const v = SPACING_SCALE[cssObj['max-height']];
    classes.push(v ? `max-h-${v}` : `max-h-[${cssObj['max-height']}]`);
  }

  // Flexbox
  if (cssObj['flex-direction'] === 'column') classes.push('flex-col');
  if (cssObj['flex-direction'] === 'column-reverse') classes.push('flex-col-reverse');
  if (cssObj['flex-direction'] === 'row-reverse') classes.push('flex-row-reverse');
  if (cssObj['flex-wrap'] === 'wrap') classes.push('flex-wrap');
  if (cssObj['flex-wrap'] === 'wrap-reverse') classes.push('flex-wrap-reverse');

  if (cssObj['justify-content']) {
    const jc = mapJustifyContent(cssObj['justify-content']);
    if (jc) classes.push(jc);
  }
  if (cssObj['align-items']) {
    const ai = mapAlignItems(cssObj['align-items']);
    if (ai) classes.push(ai);
  }
  if (cssObj['align-self']) {
    const as = mapAlignSelf(cssObj['align-self']);
    if (as) classes.push(as);
  }
  if (cssObj['gap']) {
    addSpacingClass(classes, 'gap', cssObj['gap']);
  }
  if (cssObj['row-gap']) {
    addSpacingClass(classes, 'gap-y', cssObj['row-gap']);
  }
  if (cssObj['column-gap']) {
    addSpacingClass(classes, 'gap-x', cssObj['column-gap']);
  }

  // Flex item properties
  if (cssObj['flex-grow'] === '1') classes.push('grow');
  if (cssObj['flex-grow'] === '0') classes.push('grow-0');
  if (cssObj['flex-shrink'] === '0') classes.push('shrink-0');

  // Grid
  if (cssObj['grid-template-columns']) {
    classes.push(`grid-cols-[${cssObj['grid-template-columns']}]`);
  }
  if (cssObj['grid-template-rows']) {
    classes.push(`grid-rows-[${cssObj['grid-template-rows']}]`);
  }

  // Typography
  if (cssObj['font-size']) {
    const fs = FONT_SIZE_MAP[cssObj['font-size']];
    classes.push(fs ? `text-${fs}` : `text-[${cssObj['font-size']}]`);
  }
  if (cssObj['font-weight']) {
    const fw = FONT_WEIGHT_MAP[cssObj['font-weight']];
    classes.push(fw ? `font-${fw}` : `font-[${cssObj['font-weight']}]`);
  }
  if (cssObj['font-style'] === 'italic') classes.push('italic');
  if (cssObj['font-family']) {
    const ff = mapFontFamily(cssObj['font-family']);
    if (ff) classes.push(ff);
  }
  if (cssObj['line-height']) {
    const lh = LINE_HEIGHT_MAP[cssObj['line-height']];
    if (lh) {
      classes.push(`leading-${lh}`);
    } else {
      classes.push(`leading-[${cssObj['line-height']}]`);
    }
  }
  if (cssObj['letter-spacing']) {
    classes.push(`tracking-[${cssObj['letter-spacing']}]`);
  }
  if (cssObj['text-align']) {
    const ta = cssObj['text-align'];
    if (['left', 'center', 'right', 'justify'].includes(ta)) {
      classes.push(`text-${ta}`);
    }
  }
  if (cssObj['text-decoration']) {
    if (cssObj['text-decoration'].includes('underline')) classes.push('underline');
    if (cssObj['text-decoration'].includes('line-through')) classes.push('line-through');
    if (cssObj['text-decoration'].includes('none')) classes.push('no-underline');
  }
  if (cssObj['text-transform']) {
    const tt = cssObj['text-transform'];
    if (tt === 'uppercase') classes.push('uppercase');
    if (tt === 'lowercase') classes.push('lowercase');
    if (tt === 'capitalize') classes.push('capitalize');
  }
  if (cssObj['white-space']) {
    const ws = cssObj['white-space'];
    if (ws === 'nowrap') classes.push('whitespace-nowrap');
    if (ws === 'pre') classes.push('whitespace-pre');
    if (ws === 'pre-wrap') classes.push('whitespace-pre-wrap');
    if (ws === 'break-spaces') classes.push('whitespace-break-spaces');
  }

  // Color
  if (cssObj['color']) {
    const c = mapColor('text', cssObj['color']);
    if (c) classes.push(c);
  }

  // Background
  if (cssObj['background-color']) {
    const c = mapColor('bg', cssObj['background-color']);
    if (c) classes.push(c);
  }

  // Border
  if (cssObj['border']) {
    const parts = cssObj['border'].split(' ');
    if (parts.length >= 2) {
      const width = parts[0];
      if (width === '1px') classes.push('border');
      else if (width === '2px') classes.push('border-2');
      else if (width === '4px') classes.push('border-4');
      else if (width === '8px') classes.push('border-8');
      else classes.push(`border-[${width}]`);

      if (parts[2]) {
        const bc = mapColor('border', parts.slice(2).join(' '));
        if (bc) classes.push(bc);
      }
    }
  } else {
    // Individual border widths
    if (cssObj['border-top-width'] && cssObj['border-top-style'] !== 'none') {
      classes.push(cssObj['border-top-width'] === '1px' ? 'border-t' : `border-t-[${cssObj['border-top-width']}]`);
    }
    if (cssObj['border-right-width'] && cssObj['border-right-style'] !== 'none') {
      classes.push(cssObj['border-right-width'] === '1px' ? 'border-r' : `border-r-[${cssObj['border-right-width']}]`);
    }
    if (cssObj['border-bottom-width'] && cssObj['border-bottom-style'] !== 'none') {
      classes.push(cssObj['border-bottom-width'] === '1px' ? 'border-b' : `border-b-[${cssObj['border-bottom-width']}]`);
    }
    if (cssObj['border-left-width'] && cssObj['border-left-style'] !== 'none') {
      classes.push(cssObj['border-left-width'] === '1px' ? 'border-l' : `border-l-[${cssObj['border-left-width']}]`);
    }
  }

  // Border radius
  if (cssObj['border-radius']) {
    const br = BORDER_RADIUS_MAP[cssObj['border-radius']];
    if (br === 'DEFAULT') classes.push('rounded');
    else if (br) classes.push(`rounded-${br}`);
    else classes.push(`rounded-[${cssObj['border-radius']}]`);
  } else {
    // Individual corners
    mapCornerRadius(classes, 'rounded-tl', cssObj['border-top-left-radius']);
    mapCornerRadius(classes, 'rounded-tr', cssObj['border-top-right-radius']);
    mapCornerRadius(classes, 'rounded-bl', cssObj['border-bottom-left-radius']);
    mapCornerRadius(classes, 'rounded-br', cssObj['border-bottom-right-radius']);
  }

  // Opacity
  if (cssObj['opacity'] && cssObj['opacity'] !== '1') {
    const op = OPACITY_MAP[cssObj['opacity']];
    classes.push(op ? `opacity-${op}` : `opacity-[${cssObj['opacity']}]`);
  }

  // Box shadow
  if (cssObj['box-shadow'] && cssObj['box-shadow'] !== 'none') {
    classes.push(`shadow-[${cssObj['box-shadow']}]`);
  }

  // Overflow
  if (cssObj['overflow'] && cssObj['overflow'] !== 'visible') {
    classes.push(`overflow-${cssObj['overflow']}`);
  } else {
    if (cssObj['overflow-x'] && cssObj['overflow-x'] !== 'visible') {
      classes.push(`overflow-x-${cssObj['overflow-x']}`);
    }
    if (cssObj['overflow-y'] && cssObj['overflow-y'] !== 'visible') {
      classes.push(`overflow-y-${cssObj['overflow-y']}`);
    }
  }

  // Z-index
  if (cssObj['z-index'] && cssObj['z-index'] !== 'auto') {
    const z = cssObj['z-index'];
    const standardZ = ['0', '10', '20', '30', '40', '50'];
    classes.push(standardZ.includes(z) ? `z-${z}` : `z-[${z}]`);
  }

  // Cursor
  if (cssObj['cursor'] && cssObj['cursor'] !== 'auto') {
    classes.push(`cursor-${cssObj['cursor']}`);
  }

  // Object fit
  if (cssObj['object-fit']) {
    classes.push(`object-${cssObj['object-fit']}`);
  }

  // Aspect ratio
  if (cssObj['aspect-ratio'] && cssObj['aspect-ratio'] !== 'auto') {
    const ar = cssObj['aspect-ratio'];
    if (ar === '1 / 1') classes.push('aspect-square');
    else if (ar === '16 / 9') classes.push('aspect-video');
    else classes.push(`aspect-[${ar.replace(/\s*\/\s*/, '/')}]`);
  }

  return classes.join(' ');
}

// --- Helper Functions ---

function addSpacingClass(classes, prefix, value) {
  if (!value) return;
  const scale = SPACING_SCALE[value];
  if (scale !== undefined) {
    classes.push(`${prefix}-${scale}`);
  } else if (value.startsWith('-')) {
    const abs = value.substring(1);
    const s = SPACING_SCALE[abs];
    classes.push(s !== undefined ? `-${prefix}-${s}` : `-${prefix}-[${abs}]`);
  } else {
    classes.push(`${prefix}-[${value}]`);
  }
}

function handleShorthandSpacing(prefix, value) {
  const parts = value.split(' ').map(v => v.trim()).filter(Boolean);
  const classes = [];

  if (parts.length === 1) {
    addSpacingClass(classes, prefix, parts[0]);
  } else if (parts.length === 2) {
    addSpacingClass(classes, `${prefix}y`, parts[0]);
    addSpacingClass(classes, `${prefix}x`, parts[1]);
  } else if (parts.length === 4) {
    addSpacingClass(classes, `${prefix}t`, parts[0]);
    addSpacingClass(classes, `${prefix}r`, parts[1]);
    addSpacingClass(classes, `${prefix}b`, parts[2]);
    addSpacingClass(classes, `${prefix}l`, parts[3]);
  }

  return classes;
}

function optimizeSpacing(classes) {
  // Check if pt/pr/pb/pl can be combined into py/px or p
  const prefixes = ['p', 'm'];
  for (const pre of prefixes) {
    const t = classes.findIndex(c => c.startsWith(`${pre}t-`));
    const r = classes.findIndex(c => c.startsWith(`${pre}r-`));
    const b = classes.findIndex(c => c.startsWith(`${pre}b-`));
    const l = classes.findIndex(c => c.startsWith(`${pre}l-`));

    if (t >= 0 && r >= 0 && b >= 0 && l >= 0) {
      const tv = classes[t].substring(3);
      const rv = classes[r].substring(3);
      const bv = classes[b].substring(3);
      const lv = classes[l].substring(3);

      if (tv === rv && rv === bv && bv === lv) {
        // All same: use p-X or m-X
        classes.splice(Math.max(t, r, b, l), 1);
        classes.splice(Math.min(t, r, b, l), 0);
        // Remove old ones (in reverse order to preserve indices)
        const indices = [t, r, b, l].sort((a, b) => b - a);
        for (const i of indices) classes.splice(i, 1);
        classes.push(`${pre}-${tv}`);
      } else if (tv === bv && rv === lv) {
        // py/px pattern
        const indices = [t, r, b, l].sort((a, b) => b - a);
        for (const i of indices) classes.splice(i, 1);
        classes.push(`${pre}y-${tv}`);
        classes.push(`${pre}x-${rv}`);
      }
    }
  }
}

function mapDisplay(value) {
  const map = {
    'block': 'block',
    'inline-block': 'inline-block',
    'inline': 'inline',
    'flex': 'flex',
    'inline-flex': 'inline-flex',
    'grid': 'grid',
    'inline-grid': 'inline-grid',
    'none': 'hidden',
    'table': 'table',
    'table-row': 'table-row',
    'table-cell': 'table-cell',
    'contents': 'contents',
    'list-item': 'list-item',
  };
  return map[value] || null;
}

function mapJustifyContent(value) {
  const map = {
    'flex-start': 'justify-start',
    'flex-end': 'justify-end',
    'center': 'justify-center',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
    'start': 'justify-start',
    'end': 'justify-end',
  };
  return map[value] || null;
}

function mapAlignItems(value) {
  const map = {
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    'center': 'items-center',
    'baseline': 'items-baseline',
    'stretch': 'items-stretch',
    'start': 'items-start',
    'end': 'items-end',
  };
  return map[value] || null;
}

function mapAlignSelf(value) {
  const map = {
    'auto': 'self-auto',
    'flex-start': 'self-start',
    'flex-end': 'self-end',
    'center': 'self-center',
    'stretch': 'self-stretch',
    'baseline': 'self-baseline',
  };
  return map[value] || null;
}

function mapColor(prefix, value) {
  if (!value) return null;

  // Check exact match in palette
  const normalized = normalizeColor(value);
  const twColor = COLOR_PALETTE[normalized];
  if (twColor) return `${prefix}-${twColor}`;

  // Convert to hex for arbitrary value
  const hex = rgbToHex(value);
  if (hex) return `${prefix}-[${hex}]`;

  return `${prefix}-[${value}]`;
}

function normalizeColor(value) {
  // Remove extra spaces in rgb/rgba
  return value.replace(/\s+/g, ' ').trim();
}

function rgbToHex(rgb) {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function mapFontFamily(value) {
  const lower = value.toLowerCase();
  if (lower.includes('mono') || lower.includes('courier') || lower.includes('consolas')) {
    return 'font-mono';
  }
  if (lower.includes('serif') && !lower.includes('sans-serif')) {
    return 'font-serif';
  }
  if (lower.includes('sans-serif') || lower.includes('arial') || lower.includes('helvetica') || lower.includes('system-ui')) {
    return 'font-sans';
  }
  return null;
}

function mapCornerRadius(classes, prefix, value) {
  if (!value || value === '0px') return;
  const br = BORDER_RADIUS_MAP[value];
  if (br === 'DEFAULT') classes.push(prefix);
  else if (br) classes.push(`${prefix}-${br}`);
  else classes.push(`${prefix}-[${value}]`);
}
