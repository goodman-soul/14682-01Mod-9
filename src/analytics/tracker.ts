import { TrackEvent, EventType } from './types';
import { saveEvent } from './storage';
import { currentConfig } from '@/configs';

declare const __APP_VERSION__: string;

const TEST_FLAG_KEY = 'analytics_test_mode';

export const isTestMode = (): boolean => {
  return localStorage.getItem(TEST_FLAG_KEY) === 'true';
};

export const setTestMode = (enabled: boolean): void => {
  localStorage.setItem(TEST_FLAG_KEY, String(enabled));
};

const generateEventId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

const getAppVersion = (): string => {
  try {
    return __APP_VERSION__;
  } catch {
    return '0.0.0';
  }
};

const createBaseEvent = (type: EventType): TrackEvent => {
  return {
    id: generateEventId(),
    type,
    timestamp: Date.now(),
    tenantId: currentConfig.id,
    tenantName: currentConfig.name,
    appVersion: getAppVersion(),
    isTest: isTestMode(),
    url: window.location.href,
    pageTitle: document.title,
    referrer: document.referrer || undefined,
  };
};

const sendToServer = (event: TrackEvent): void => {
  try {
    const payload = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', payload);
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (e) {
    console.debug('Analytics send failed (expected in dev)', e);
  }
};

const track = (event: TrackEvent): void => {
  saveEvent(event);
  if (!event.isTest) {
    sendToServer(event);
  } else {
    console.debug('[Analytics] Test mode - event not sent to server:', event);
  }
};

export const trackPageView = (pageName?: string, extra?: Record<string, any>): void => {
  const event = createBaseEvent('page_view');
  event.pageName = pageName;
  event.extra = extra;
  track(event);
};

export const trackButtonClick = (
  element: HTMLElement | EventTarget | null,
  action?: string,
  extra?: Record<string, any>
): void => {
  const event = createBaseEvent('button_click');
  if (element instanceof HTMLElement) {
    event.elementId = element.id || undefined;
    event.elementText = element.innerText?.trim().substring(0, 100) || undefined;
    event.elementClass = element.className || undefined;
  }
  event.buttonAction = action;
  event.extra = extra;
  track(event);
};

export const trackError = (
  error: Error | string,
  extra?: Record<string, any>
): void => {
  const event = createBaseEvent('error');
  if (typeof error === 'string') {
    event.errorMessage = error;
    event.errorType = 'StringError';
  } else {
    event.errorMessage = error.message;
    event.errorStack = error.stack?.substring(0, 500);
    event.errorType = error.name || 'Error';
  }
  event.extra = extra;
  track(event);
};
