/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sora Vault'
const SITE_URL = 'https://soravault.app'

interface Props {
  recipientFirstName?: string
  senderName?: string
  message?: string
}

const FriendRequestEmail = ({ recipientFirstName, senderName, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{senderName ? `${senderName} sent you a friend request` : 'You have a new friend request'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SORA VAULT</Text>
        <Hr style={divider} />
        <Heading style={h1}>
          {recipientFirstName ? `Hi ${recipientFirstName},` : 'Hi there,'}
        </Heading>
        <Text style={text}>
          <strong>{senderName || 'Someone'}</strong> would like to connect with you on {SITE_NAME}.
        </Text>
        {message ? (
          <Section style={quote}>
            <Text style={quoteText}>"{message}"</Text>
          </Section>
        ) : null}
        <Section style={buttonContainer}>
          <Button style={button} href={`${SITE_URL}/social`}>Review request</Button>
        </Section>
        <Hr style={divider} />
        <Text style={signature}>— The Sora Vault team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FriendRequestEmail,
  subject: ((data: Record<string, any>) =>
    data.senderName ? `${data.senderName} sent you a friend request` : 'New friend request on Sora Vault') as (data: Record<string, any>) => string,
  displayName: 'Friend request received',
  previewData: { recipientFirstName: 'Alex', senderName: 'Jordan', message: 'Loved your collection!' },
} satisfies TemplateEntry

const primary = 'hsl(219, 98%, 61%)'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '40px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '2px', color: primary, margin: '0' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: 'hsl(220, 19%, 13%)', margin: '0 0 16px', lineHeight: '1.25' }
const text = { fontSize: '15px', color: 'hsl(220, 9%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { borderLeft: `3px solid ${primary}`, padding: '8px 14px', margin: '8px 0 20px', backgroundColor: '#f8fafc' }
const quoteText = { fontSize: '14px', color: 'hsl(220, 19%, 13%)', fontStyle: 'italic' as const, margin: '0' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0 8px' }
const button = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: 600 as const, borderRadius: '12px', padding: '13px 32px', textDecoration: 'none', display: 'inline-block' }
const signature = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '0' }