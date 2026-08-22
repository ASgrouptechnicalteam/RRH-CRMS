export interface TourRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function getElementRect(targetSelector: string): TourRect | null {
  const el = document.querySelector(targetSelector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  
  // Return the rect relative to the viewport
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function scrollToTarget(targetSelector: string) {
  const el = document.querySelector(targetSelector);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }
}

export function waitForElement(selector: string, timeoutMs = 2000): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      return resolve(el);
    }

    const observer = new MutationObserver(() => {
      const foundEl = document.querySelector(selector);
      if (foundEl) {
        resolve(foundEl);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null); // Timeout reached, return null
    }, timeoutMs);
  });
}
