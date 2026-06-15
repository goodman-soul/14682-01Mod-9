import { TrackEvent, EventFilter } from './types';

const STORAGE_KEY = 'analytics_events';
const MAX_EVENTS = 500;

const getStorage = (): TrackEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setStorage = (events: TrackEvent[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
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
  localStorage.removeItem(STORAGE_KEY);
};

export const getTenants = (): string[] => {
  const events = getStorage();
  const tenantSet = new Set<string>();
  events.forEach(e => tenantSet.add(e.tenantId));
  return Array.from(tenantSet);
};
