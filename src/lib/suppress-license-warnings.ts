'use client';

/**
 * Suppress AG Studio / AG Grid trial license watermark notices from triggering
 * Next.js Turbopack development error overlay modal popups.
 * 
 * AG Studio / AG Grid is licensed for evaluation and trial use, but outputs its trial
 * notices via `console.error`. Next.js 15+ dev overlay captures any `console.error` and
 * displays an error modal (< 1/7 >) even though the application is functioning normally.
 * 
 * This filter safely demotes license notices to `console.info` while leaving all actual
 * runtime application errors untouched.
 */
if (typeof window !== 'undefined') {
  const isLicenseNotice = (arg: unknown): boolean => {
    if (typeof arg !== 'string') return false;
    const str = arg.trim();
    if (/^\*{6,}$/.test(str)) return true;
    return (
      str.includes('AG Studio') ||
      str.includes('License Key Not Found') ||
      str.includes('ag-grid.com') ||
      str.includes('unlocked for trial') ||
      str.includes('hide the watermark') ||
      str.includes('trial license key') ||
      str.includes('AG Studio Core License') ||
      str.includes('Trial Period Expired') ||
      str.includes('For Trial Use Only') ||
      str.includes('AG Grid Enterprise') ||
      str.includes('AG Charts Enterprise') ||
      str.includes('License Manager')
    );
  };

  const createFilter = (originalFn: (...args: unknown[]) => void) => {
    return function (this: unknown, ...args: unknown[]) {
      if (args.some(isLicenseNotice)) {
        // Demote to console.info so it does not trigger the Next.js Dev Error Overlay
        console.info('[AG License Trial Notice]', ...args);
        return;
      }
      return originalFn.apply(this, args);
    };
  };

  let currentError = window.console.error;
  currentError = createFilter(currentError);

  try {
    Object.defineProperty(window.console, 'error', {
      configurable: true,
      enumerable: true,
      get() {
        return currentError;
      },
      set(newFn) {
        currentError = createFilter(newFn);
      },
    });
  } catch {
    window.console.error = currentError;
  }
}

