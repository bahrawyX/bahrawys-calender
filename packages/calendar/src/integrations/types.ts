/**
 * Integration types — config for Google Calendar and Outlook.
 */

export interface GoogleConfig {
  /** OAuth 2.0 Client ID from Google Cloud Console */
  clientId: string;
  /** API Key from Google Cloud Console (optional — OAuth alone is sufficient) */
  apiKey?: string;
  /** OAuth scopes. Default: calendar.readonly */
  scopes?: string[];
}

export interface OutlookConfig {
  /** Application (client) ID from Azure Portal */
  clientId: string;
  /** Directory (tenant) ID. Default: 'common' (any account) */
  tenantId?: string;
  /** OAuth scopes. Default: ['Calendars.Read'] */
  scopes?: string[];
}

export interface IntegrationsConfig {
  google?: GoogleConfig;
  outlook?: OutlookConfig;
}

export interface IntegrationState {
  accessToken: string;
  expiresAt: number; // timestamp ms
  refreshToken?: string;
}

export interface IntegrationsContextValue {
  /** Connect Google Calendar (triggers OAuth popup) */
  connectGoogle?: () => Promise<void>;
  /** Disconnect Google Calendar */
  disconnectGoogle?: () => void;
  /** Whether Google Calendar is connected */
  isGoogleConnected: boolean;
  /** Whether Google is currently loading events */
  isGoogleLoading: boolean;

  /** Connect Outlook Calendar (triggers OAuth popup) */
  connectOutlook?: () => Promise<void>;
  /** Disconnect Outlook Calendar */
  disconnectOutlook?: () => void;
  /** Whether Outlook Calendar is connected */
  isOutlookConnected: boolean;
  /** Whether Outlook is currently loading events */
  isOutlookLoading: boolean;
}
