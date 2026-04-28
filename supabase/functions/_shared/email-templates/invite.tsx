/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to Sora Vault</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SORA VAULT</Text>
        <Heading style={h1}>You're invited</Heading>
        <Text style={text}>
          You've been invited to join <Link href={siteUrl} style={link}><strong>Sora Vault</strong></Link> — the home for your luxury collection.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif",
}
const container = { padding: '40px 28px', maxWidth: '520px', margin: '0 auto' }
const brand = {
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '2px',
  color: 'hsl(219, 98%, 61%)',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 700 as const,
  color: 'hsl(220, 19%, 13%)',
  margin: '0 0 18px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(220, 9%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const link = { color: 'hsl(219, 98%, 61%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(219, 98%, 61%)',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600 as const,
  borderRadius: '12px',
  padding: '12px 28px',
  textDecoration: 'none',
  margin: '8px 0 28px',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '24px 0 0' }
