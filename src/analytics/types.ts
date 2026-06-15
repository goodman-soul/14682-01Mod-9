export type EventType = 'page_view' | 'button_click' | 'error';

export interface TrackEvent {
  id: string;
  type: EventType;
  timestamp: number;
  tenantId: string;
  tenantName: string;
  appVersion: string;
  isTest: boolean;
  url?: string;
  pageTitle?: string;
  referrer?: string;
  elementId?: string;
  elementText?: string;
  elementClass?: string;
  buttonAction?: string;
  errorMessage?: string;
  errorStack?: string;
  errorType?: string;
  pageName?: string;
  extra?: Record<string, any>;
}

export interface EventFilter {
  tenantId?: string;
  type?: EventType;
  isTest?: boolean;
  limit?: number;
}
