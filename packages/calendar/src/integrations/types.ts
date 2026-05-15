/**
 * Integration types — config for Google Calendar, Outlook, and Apple Calendar.
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

export interface AppleConfig {
  /**
   * Your API proxy endpoint URL. Apple CalDAV can't be called from the browser
   * (CORS), so you need a server route that proxies requests.
   *
   * The package provides server utilities via `bahrawy-calendar/apple` to
   * build this endpoint in ~10 lines of code.
   *
   * Example: '/api/apple-calendar'
   */
  proxyUrl: string;
}

export interface IntegrationsConfig {
  google?: GoogleConfig;
  outlook?: OutlookConfig;
  apple?: AppleConfig;
}

export interface IntegrationState {
  accessToken: string;
  expiresAt: number; // timestamp ms
  refreshToken?: string;
}

export interface AppleCredentialState {
  email: string;
  appPassword: string;
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

  /** Connect Apple Calendar (email + app-specific password) */
  connectApple?: (email: string, appPassword: string) => Promise<void>;
  /** Disconnect Apple Calendar */
  disconnectApple?: () => void;
  /** Whether Apple Calendar is connected */
  isAppleConnected: boolean;
  /** Whether Apple is currently loading events */
  isAppleLoading: boolean;
}
