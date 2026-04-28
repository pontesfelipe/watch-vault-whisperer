/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sora Vault'
const SITE_URL = 'https://soravault.app'

interface CustomMessageProps {
  userName?: string
  subject?: string
  messageBody?: string
}

const CustomMessageEmail = ({ userName, subject, messageBody }: CustomMessageProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject || `A message from ${SITE_NAME}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>{SITE_NAME}</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>
          {userName ? `Hi ${userName},` : 'Hello,'}
        </Heading>
        {messageBody ? (
          messageBody.split('\n').filter(Boolean).map((paragraph, i) => (
            <Text key={i} style={text}>{paragraph}</Text>
          ))
        ) : (
          <Text style={text}>You have a new message from the {SITE_NAME} team.</Text>
        )}
        <Section style={buttonContainer}>
          <Button style={button} href={SITE_URL}>
            Open {SITE_NAME}
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          {SITE_NAME} — Your luxury collection, beautifully organized
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CustomMessageEmail,
  subject: ((data: Record<string, any>) => data.subject || `A message from ${SITE_NAME}`) as (data: Record<string, any>) => string,
  displayName: 'Custom message',
  previewData: {
    userName: 'Alex',
    subject: 'A note from the Sora Vault team',
    messageBody: 'Thanks for being part of Sora Vault.\nWe have an update we wanted to share with you directly.',
  },
} satisfies TemplateEntry

const primary = '#5A85C7'
const primaryForeground = '#ffffff'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif",
}
const container = {
  padding: '40px 28px',
  maxWidth: '520px',
  margin: '0 auto',
}
const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '8px',
}
const logoText = {
  fontSize: '24px',
  fontWeight: '800' as const,
  color: primary,
  letterSpacing: '1px',
  margin: '0',
}
const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#0d0d0d',
  margin: '0 0 16px',
}
const text = {
  fontSize: '15px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const buttonContainer = {
  textAlign: 'center' as const,
  margin: '28px 0',
}
const button = {
  backgroundColor: primary,
  color: primaryForeground,
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600' as const,
  padding: '12px 32px',
  textDecoration: 'none',
}
const footer = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '0',
}