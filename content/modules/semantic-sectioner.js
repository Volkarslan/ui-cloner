// Semantic Sectioner Module
// Splits the extracted tree by semantic HTML landmark elements

const LANDMARK_TAGS = new Set([
  'header', 'nav', 'main', 'section', 'aside', 'footer', 'article',
]);

const ARIA_ROLE_TO_SECTION = {
  'banner': 'header',
  'navigation': 'nav',
  'main': 'main',
  'contentinfo': 'footer',
  'complementary': 'aside',
  'article': 'article',
  'region': 'section',
};

export function sectionTree(tree) {
  if (!tree) return [];

  // If the root itself is a landmark, return as single section
  if (LANDMARK_TAGS.has(tree.tag)) {
    return [{
      section: tree.tag,
      ...tree,
    }];
  }

  // If root has no children, wrap in a single section
  if (!tree.children || tree.children.length === 0) {
    return [{
      section: inferSection(tree),
      ...tree,
    }];
  }

  // Process top-level children
  const sections = [];
  let currentGroup = [];
  let currentSection = null;

  for (const child of tree.children) {
    const sectionName = getChildSection(child);

    if (sectionName) {
      // Flush any ungrouped content before this landmark
      if (currentGroup.length > 0) {
        sections.push({
          section: currentSection || 'content',
          tag: 'div',
          children: currentGroup,
        });
        currentGroup = [];
      }

      // Add the landmark section
      sections.push({
        section: sectionName,
        ...child,
      });
      currentSection = null;
    } else {
      // Non-landmark element - accumulate
      currentGroup.push(child);
    }
  }

  // Flush remaining ungrouped content
  if (currentGroup.length > 0) {
    sections.push({
      section: currentSection || 'content',
      tag: 'div',
      children: currentGroup,
    });
  }

  // If no landmarks were found, return the whole tree as a single section
  if (sections.length === 0) {
    return [{
      section: 'content',
      ...tree,
    }];
  }

  return sections;
}

function getChildSection(node) {
  // Check tag name
  if (LANDMARK_TAGS.has(node.tag)) {
    return node.tag;
  }

  // Check ARIA role (would need to be extracted during DOM traversal)
  if (node.role) {
    return ARIA_ROLE_TO_SECTION[node.role] || null;
  }

  return null;
}

function inferSection(node) {
  if (LANDMARK_TAGS.has(node.tag)) return node.tag;
  return 'content';
}

export function countSections(sections) {
  return sections.length;
}
