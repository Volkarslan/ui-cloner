// CSS Defaults Cache
// Uses a hidden iframe to compute browser default styles per tag name
// This avoids inheriting any page stylesheets

import { DESIGN_PROPERTIES } from './design-properties.js';

let iframe = null;
let defaultsCache = new Map();

export function initDefaultsCache() {
  return new Promise((resolve) => {
    // Create a hidden iframe with no stylesheets
    iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;visibility:hidden;';
    iframe.srcdoc = '<!DOCTYPE html><html><head></head><body></body></html>';

    iframe.addEventListener('load', () => {
      resolve();
    });

    document.body.appendChild(iframe);
  });
}

export function getDefaultsForTag(tagName) {
  const tag = tagName.toUpperCase();

  if (defaultsCache.has(tag)) {
    return defaultsCache.get(tag);
  }

  if (!iframe || !iframe.contentDocument) {
    return new Map();
  }

  const doc = iframe.contentDocument;
  const el = doc.createElement(tagName.toLowerCase());
  doc.body.appendChild(el);

  const computed = iframe.contentWindow.getComputedStyle(el);
  const defaults = new Map();

  for (const prop of DESIGN_PROPERTIES) {
    defaults.set(prop, computed.getPropertyValue(prop));
  }

  doc.body.removeChild(el);
  defaultsCache.set(tag, defaults);

  return defaults;
}

export function destroyDefaultsCache() {
  if (iframe && iframe.parentNode) {
    iframe.parentNode.removeChild(iframe);
  }
  iframe = null;
  defaultsCache.clear();
}
