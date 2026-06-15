import { TrackEvent, EventFilter } from './types';
import { currentConfig } from '@/configs';

const STORAGE_PREFIX = 'analytics_events_';
const TENANT_MARKER_KEY = 'analytics_current_tenant';
const MAX_EVENTS = 500;

const getStorageKey = (tenantId: string): string => {
  return `${STORAGE_PREFIX}${tenantId}`;
};

const ensureTenantIsolated = (): void => {
  const currentTenant = currentConfig.id;
  const lastTenant = localStorage.getItem(TENANT_MARKER_KEY);
  if (lastTenant && lastTenant !== currentTenant) {
    localStorage.removeItem(getStorageKey(lastTenant));
    const testKey = `analytics_test_mode`;
    localStorage.removeItem(testKey);
  }
  localStorage.setItem(TENANT_MARKER_KEY, currentTenant);
};

ensureTenantIsolated();

const getStorage = (): TrackEvent[] => {
  try {
    const raw = localStorage.getItem(getStorageKey(currentConfig.id));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setStorage = (events: TrackEvent[]): void => {
  try {
    localStorage.setItem(getStorageKey(currentConfig.id), JSON.stringify(events));
  } catch (e) {
    console.warn('Failed to save analytics events to storage', e);
  }
};

export const saveEvent = (event: TrackEvent): void => {
  const events = getStorage();
  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS;
  }
  setStorage(events);
};

export const getEvents = (filter?: EventFilter): TrackEvent[] => {
  let events = getStorage();
  if (filter) {
    if (filter.tenantId) {
      events = events.filter(e => e.tenantId === filter.tenantId);
    }
    if (filter.type) {
      events = events.filter(e => e.type === filter.type);
    }
    if (filter.isTest !== undefined) {
      events = events.filter(e => e.isTest === filter.isTest);
    }
    if (filter.limit) {
      events = events.slice(0, filter.limit);
    }
  }
  return events;
};

export const clearEvents = (): void => {
  localStorage.removeItem(getStorageKey(currentConfig.id));
};

export const getTenants = (): string[] => {
  return [currentConfig.id];
};
