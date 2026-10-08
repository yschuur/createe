import * as React from 'react'
import { Body, Button, Column, Container, Head, Heading, Hr, Html, Img, Preview, Row, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import whiteLogo from '@/assets/logo_golf_wit.png.asset.json'

export interface OrderLine { name: string; label?: string; quantity: number; total: number }
export interface OrderEmailProps {
  subject?: string
  heading?: string
  body?: string
  button?: string
  buttonUrl?: string
  orderNumber?: string
  customerName?: string
  lines?: OrderLine[]
  shipping?: number
  total?: number
  address?: string
  email?: string
  phone?: string
  owner?: boolean
}

const eur = (n?: number) => `€${(n ?? 0).toFixed(2).replace('.', ',')}`
const GREEN = '#275C38'
const LOGO = new URL(whiteLogo.url, 'https://createe.nl').href

export const OrderEmail = (p: OrderEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{p.heading ?? 'Je bestelling bij CREATEE'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO} width="240" height="36" alt="CREATEE" style={{ margin: '0 auto', maxWidth: '100%', height: 'auto' }} />
        </Section>
        <Section style={content}>
          {p.orderNumber && <Text style={label}>Bestelling {p.orderNumber}</Text>}
          <Heading style={h1}>{p.heading ?? 'Bedankt voor je bestelling'}</Heading>
          {p.customerName && !p.owner && <Text style={text}>Hoi {p.customerName},</Text>}
          {(p.body ?? '').split(/\n{2,}/).filter(Boolean).map((para, i) => <Text key={i} style={text}>{para}</Text>)}
          {p.buttonUrl && p.button && <Section style={{ textAlign: 'center', margin: '28px 0' }}><Button href={p.buttonUrl} style={btn}>{p.button}</Button></Section>}
          {p.lines && p.lines.length > 0 && <>
            <Hr style={hr} />
            <Text style={label}>Jouw items</Text>
            {p.lines.map((l, i) => (
              <Row key={i} style={{ marginBottom: 8 }}>
                <Column><Text style={item}>{l.quantity}× {l.name}{l.label ? ` — ${l.label}` : ''}</Text></Column>
                <Column align="right"><Text style={item}>{eur(l.total)}</Text></Column>
              </Row>
            ))}
            <Hr style={hr} />
            <Row><Column><Text style={item}>Verzending</Text></Column><Column align="right"><Text style={item}>{p.shipping ? eur(p.shipping) : 'Gratis'}</Text></Column></Row>
            <Row><Column><Text style={totalS}>Totaal</Text></Column><Column align="right"><Text style={totalS}>{eur(p.total)}</Text></Column></Row>
          </>}
          {p.owner && <>
            <Hr style={hr} />
            <Text style={label}>Klant</Text>
            <Text style={item}>{p.customerName}<br />{p.email}{p.phone ? <><br />{p.phone}</> : null}</Text>
            {p.address && <Text style={item}>{p.address}</Text>}
          </>}
        </Section>
        <Section style={footer}>
          <Text style={footerText}>Heb je vragen over je bestelling, neem contact op via contact@createe.nl.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderEmail,
  subject: (d: Record<string, any>) => d['subject'] || 'Je bestelling bij CREATEE',
  displayName: 'Bestelling (bevestiging / productie / verzonden)',
  previewData: {
    subject: 'Goede swing!', orderNumber: 'CR-ABC123', customerName: 'Sam',
    heading: 'Goede swing! We hebben je bestelling in goede orde ontvangen!',
    body: 'Gefeliciteerd! Je bent zojuist de best geklede persoon op de baan geworden. We hebben je order ontvangen en gaan direct aan de slag om je items in te pakken.',
    lines: [{ name: 'Red Hot Chili Putters', label: 'Wit / M', quantity: 1, total: 39.95 }],
    shipping: 4.95, total: 44.9,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', border: '1px solid #e5e5e5' }
const header = { backgroundColor: GREEN, padding: '24px 16px', textAlign: 'center' as const }
const content = { padding: '32px 32px 16px' }
const label = { fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, color: GREEN, fontWeight: 700, margin: '0 0 8px' }
const h1 = { fontFamily: 'Arial, sans-serif', fontSize: '26px', lineHeight: '1.25', fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px' }
const text = { fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', margin: '0 0 14px' }
const item = { fontSize: '14px', lineHeight: '1.5', color: '#1A1A1A', margin: 0 }
const totalS = { ...item, fontWeight: 700, fontSize: '16px' }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const btn = { backgroundColor: GREEN, color: '#ffffff', fontFamily: 'Arial, sans-serif', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' as const, fontSize: '13px', padding: '14px 28px', borderRadius: '2px' }
const footer = { backgroundColor: '#F5F5F5', padding: '16px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '12px', color: '#555555', margin: 0 }
