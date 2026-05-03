/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as customMessage } from './custom-message.tsx'
import { template as welcome } from './welcome.tsx'
import { template as friendRequestReceived } from './friend-request-received.tsx'
import { template as tradeMatchFound } from './trade-match-found.tsx'
import { template as warrantyExpiring } from './warranty-expiring.tsx'
import { template as feedbackReceived } from './feedback-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'custom-message': customMessage,
  'welcome': welcome,
  'friend-request-received': friendRequestReceived,
  'trade-match-found': tradeMatchFound,
  'warranty-expiring': warrantyExpiring,
  'feedback-received': feedbackReceived,
}