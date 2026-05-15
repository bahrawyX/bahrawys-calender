/**
 * Integrations barrel — Google Calendar, Outlook, and Apple Calendar.
 */

export type {
  GoogleConfig,
  OutlookConfig,
  AppleConfig,
  IntegrationsConfig,
  IntegrationState,
  AppleCredentialState,
  IntegrationsContextValue,
} from './types';

export { useIntegrations } from './use-integrations';
