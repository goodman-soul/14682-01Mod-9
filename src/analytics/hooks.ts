import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackButtonClick, trackError } from './tracker';

const DEBUG_PATH_PREFIX = '/debug';
const NO_TRACK_ATTR = 'data-no-track';

const isDebugPage = (pathname: string): boolean => {
  return pathname === DEBUG_PATH_PREFIX || pathname.startsWith(`${DEBUG_PATH_PREFIX}/`);
};

const hasNoTrackFlag = (element: HTMLElement): boolean => {
  let el: HTMLElement | null = element;
  while (el) {
    if (el.getAttribute && el.getAttribute(NO_TRACK_ATTR) === 'true') {
      return true;
    }
    el = el.parentElement;
  }
  return false;
};

export const usePageViewTracking = (): void => {
  const location = useLocation();
  useEffect(() => {
    if (!isDebugPage(location.pathname)) {
      trackPageView(location.pathname);
    }
  }, [location.pathname]);
};

export const useButtonClickTracking = (): void => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button, [role="button"], [data-track]');
      if (button instanceof HTMLElement) {
        if (hasNoTrackFlag(button)) return;
        if (isDebugPage(window.location.pathname)) return;
        const action = button.getAttribute('data-track-action') || undefined;
        trackButtonClick(button, action);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
};

export const useErrorTracking = (): void => {
  useEffect(() => {
    const handleError = (e: ErrorEvent) => {
      trackError(e.error || e.message);
    };
    const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
      trackError(e.reason instanceof Error ? e.reason : String(e.reason));
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};
