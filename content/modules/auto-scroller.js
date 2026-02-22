// Auto-Scroller Module
// Scrolls the page from top to bottom, extracting elements incrementally
// Supports lazy-loaded and virtualized list elements

export function autoScroll(onProgress, options = {}) {
  const {
    scrollDelay = 300,
    maxScrolls = 500,
    scrollPercent = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const initialScrollY = window.scrollY;
    let scrollCount = 0;
    let stableCount = 0;
    let cancelled = false;

    // Scroll to top first
    window.scrollTo(0, 0);

    function scrollStep() {
      if (cancelled) {
        window.scrollTo(0, initialScrollY);
        reject(new Error('Scroll cancelled'));
        return;
      }

      const currentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const currentScroll = window.scrollY;

      // Calculate progress
      const progress = currentHeight > viewportHeight
        ? Math.min((currentScroll / (currentHeight - viewportHeight)) * 100, 100)
        : 100;

      onProgress(progress, 'scrolling', `Scrolling page... ${Math.round(progress)}%`);

      // Check if we reached the bottom
      if (currentScroll + viewportHeight >= currentHeight - 10) {
        stableCount++;
        if (stableCount >= 3) {
          // Page height hasn't changed in 3 checks - we're done
          window.scrollTo(0, initialScrollY);
          onProgress(100, 'scrolling', 'Scroll complete');
          resolve();
          return;
        }
        // Wait and check again (page might be loading more content)
        setTimeout(scrollStep, scrollDelay * 2);
        return;
      }

      stableCount = 0;
      scrollCount++;

      if (scrollCount >= maxScrolls) {
        window.scrollTo(0, initialScrollY);
        onProgress(100, 'scrolling', 'Scroll complete (max reached)');
        resolve();
        return;
      }

      // Scroll by 80% of viewport
      window.scrollBy(0, viewportHeight * scrollPercent);

      // Wait for lazy content to render
      setTimeout(scrollStep, scrollDelay);
    }

    // Start scrolling after a brief delay
    setTimeout(scrollStep, 200);

    // Return cancel function
    return {
      cancel: () => { cancelled = true; }
    };
  });
}

// Wait for DOM mutations to settle (for lazy-loaded content)
export function waitForDOMSettle(timeout = 500) {
  return new Promise((resolve) => {
    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 200);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Fallback timeout
    timer = setTimeout(() => {
      observer.disconnect();
      resolve();
    }, timeout);
  });
}
