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
  itemName?: string
  matchCount?: number
}

const TradeMatchEmail = ({ recipientFirstName, itemName, matchCount }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>A potential trade match was found on {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>SORA VAULT</Text>
        <Hr style={divider} />
        <Heading style={h1}>
          {recipientFirstName ? `${recipientFirstName}, we found a match.` : 'We found a match for you.'}
        </Heading>
        <Text style={text}>
          {matchCount && matchCount > 1
            ? `${matchCount} collectors have a piece on your wishlist`
            : 'A collector has a piece on your wishlist'}
          {itemName ? ` — including ${itemName}.` : '.'} Want to start a conversation?
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={`${SITE_URL}/social`}>View matches</Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Personal details are kept private until both sides accept the request.
        </Text>
        <Text style={signature}>— The Sora Vault team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TradeMatchEmail,
  subject: 'A potential trade match was found',
  displayName: 'Trade match found',
  previewData: { recipientFirstName: 'Alex', itemName: 'Rolex Submariner 124060', matchCount: 2 },
} satisfies TemplateEntry

const primary = 'hsl(219, 98%, 61%)'
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', 'Inter', Arial, sans-serif" }
const container = { padding: '40px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = { fontSize: '13px', fontWeight: 700 as const, letterSpacing: '2px', color: primary, margin: '0' }
const divider = { borderColor: '#e5e7eb', margin: '20px 0' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: 'hsl(220, 19%, 13%)', margin: '0 0 16px', lineHeight: '1.25' }
const text = { fontSize: '15px', color: 'hsl(220, 9%, 46%)', lineHeight: '1.6', margin: '0 0 16px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0 8px' }
const button = { backgroundColor: primary, color: '#ffffff', fontSize: '15px', fontWeight: 600 as const, borderRadius: '12px', padding: '13px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '20px 0 6px' }
const signature = { fontSize: '13px', color: 'hsl(220, 9%, 46%)', margin: '0' }