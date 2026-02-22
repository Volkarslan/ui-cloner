// Duplicate Element Detector
// Groups consecutive identical sibling structures to reduce output size
// Uses structural hashing (djb2) excluding text content

export function deduplicateTree(tree) {
  if (!tree) return tree;

  // Process recursively
  return deduplicateNode(tree);
}

function deduplicateNode(node) {
  if (!node || !node.children || node.children.length === 0) {
    return node;
  }

  // First, recursively deduplicate children's children
  node.children = node.children.map(child => deduplicateNode(child));

  // Then group consecutive children by structural hash
  const newChildren = [];
  let i = 0;

  while (i < node.children.length) {
    const current = node.children[i];
    const currentHash = structuralHash(current);

    // Count consecutive siblings with the same hash
    let count = 1;
    let j = i + 1;
    while (j < node.children.length && structuralHash(node.children[j]) === currentHash) {
      count++;
      j++;
    }

    if (count > 1) {
      // Replace group with single example + count
      newChildren.push({
        ...current,
        repeated: {
          count: count,
          note: `${count} identical elements with this structure`,
        },
      });
    } else {
      newChildren.push(current);
    }

    i = j;
  }

  node.children = newChildren;
  return node;
}

// DJB2 hash function
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

function structuralHash(node) {
  if (!node) return 0;

  // Build a string representing the structure (excluding textContent)
  let str = node.tag || '';

  // Include CSS keys and values
  if (node.css) {
    const keys = Object.keys(node.css).sort();
    str += '|css:' + keys.map(k => `${k}=${node.css[k]}`).join(',');
  }

  // Include child count and recursive child hashes
  if (node.children && node.children.length > 0) {
    str += '|ch:' + node.children.length;
    str += '|' + node.children.map(c => structuralHash(c)).join(',');
  }

  // Include tag-specific attributes (but not text)
  if (node.tag === 'img') str += '|img';
  if (node.tag === 'svg') str += '|svg';
  if (node.inputType) str += '|input:' + node.inputType;

  return djb2(str);
}
