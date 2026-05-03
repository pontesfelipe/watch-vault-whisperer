/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sora Vault'

interface Props {
  recipientFirstName?: string
  feedbackTitle?: string
  feedbackType?: string
}

const FeedbackReceivedEmail = ({ recipientFirstName, feedbackTitle, feedbackType }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your feedback — thank you</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SORA VAULT</Text>
        <Hr style={divider} />
        <Heading style={h1}>
          {recipientFirstName ? `Thank you, ${recipientFirstName}.` : 'Thank you for your feedback.'}
        </Heading>
        <Text style={text}>
          We've received your {feedbackType || 'feedback'}{feedbackTitle ? ` about "${feedbackTitle}"` : ''} and the team will review it shortly.
        </Text>
        <Text style={text}>
          Every note from collectors like you helps shape {SITE_NAME}. We may follow up if we need more detail.
        </Text>
        <Hr style={divider} />
        <Text style={signature}>— The Sora Vault team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FeedbackReceivedEmail,
  subject: 'We received your feedback',
  displayName: 'Feedback received',
  previewData: { recipientFirstName: 'Alex', feedbackTitle: 'Add a Patek complication filter', feedbackType: 'feature request' },
} satisfies TemplateEntry

const primary = 'hsl(219, 98%, 61%)'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '40px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '2px', color: primary, margin: '0' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: 'hsl(220, 19%, 13%)', margin: '0 0 16px', lineHeight: '1.25' }
const text = { fontSize: '15px', color: 'hsl(220, 9%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const signature = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '0' }