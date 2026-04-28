/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sora Vault'
const SITE_URL = 'https://soravault.app'

interface WelcomeEmailProps {
  firstName?: string
}

const WelcomeEmail = ({ firstName }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your luxury collection, beautifully organized</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SORA VAULT</Text>
        <Hr style={divider} />
        <Heading style={h1}>
          {firstName ? `Welcome, ${firstName}.` : 'Welcome to Sora Vault.'}
        </Heading>
        <Text style={text}>
          Your account is ready. Sora Vault is the elegant home for everything you collect — watches, sneakers, purses and more — beautifully organized in one place.
        </Text>
        <Text style={text}>Here's how to get the most out of it:</Text>
        <Section style={listSection}>
          <Text style={listItem}>• <strong>Build your collection</strong> — add your first piece with photos, specs and provenance.</Text>
          <Text style={listItem}>• <strong>Log what you wore</strong> — capture daily wears and discover your most-loved pieces.</Text>
          <Text style={listItem}>• <strong>Track value & warranty</strong> — keep purchase, depreciation and warranty info at hand.</Text>
          <Text style={listItem}>• <strong>Ask the Vault Assistant</strong> — get insights, suggestions and stats on demand.</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={SITE_URL}>
            Open {SITE_NAME}
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Questions? Just reply to this email — we read every one.
        </Text>
        <Text style={signature}>— The Sora Vault team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: ((data: Record<string, any>) =>
    data.firstName ? `Welcome to Sora Vault, ${data.firstName}` : 'Welcome to Sora Vault') as (data: Record<string, any>) => string,
  displayName: 'Welcome email',
  previewData: { firstName: 'Alex' },
} satisfies TemplateEntry

const primary = 'hsl(219, 98%, 61%)'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif",
}
const container = { padding: '40px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '2px',
  color: primary,
  margin: '0',
}
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = {
  fontSize: '26px',
  fontWeight: 700 as const,
  color: 'hsl(220, 19%, 13%)',
  margin: '0 0 18px',
  lineHeight: '1.25',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 9%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 16px',
}
const listSection = { margin: '4px 0 24px' }
const listItem = {
  fontSize: '15px',
  color: 'hsl(220, 9%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 8px',
}
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0 8px' }
const button = {
  backgroundColor: primary,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '13px 32px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '20px 0 6px' }
const signature = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '0' }
