import * as React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import whiteLogo from '@/assets/logo_golf_wit.png.asset.json'

export interface FormEmailProps {
  subject?: string
  label?: string
  heading?: string
  body?: string
  fields?: { label: string; value: string }[]
}

const GREEN = '#275C38'
const LOGO = new URL(whiteLogo.url, 'https://createe.nl').href

export const FormEmail = (p: FormEmailProps) => (
  <Html lang="nl" dir="ltr">
    <Head />
    <Preview>{p.heading ?? 'Bedankt voor je bericht'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO} width="240" height="36" alt="CREATEE" style={{ margin: '0 auto', maxWidth: '100%', height: 'auto' }} />
        </Section>
        <Section style={content}>
          {p.label && <Text style={label}>{p.label}</Text>}
          <Heading style={h1}>{p.heading ?? 'Bedankt voor je bericht'}</Heading>
          {(p.body ?? '').split(/\n{2,}/).filter(Boolean).map((para, i) => <Text key={i} style={text}>{para}</Text>)}
          {p.fields && p.fields.length > 0 && <>
            <Hr style={hr} />
            {p.fields.filter((f) => f.value).map((f, i) => (
              <Section key={i} style={{ marginBottom: 12 }}>
                <Text style={label}>{f.label}</Text>
                <Text style={{ ...item, whiteSpace: 'pre-wrap' }}>{f.value}</Text>
              </Section>
            ))}
          </>}
        </Section>
        <Section style={footer}>
          <Text style={footerText}>Heb je vragen, neem contact op via contact@createe.nl.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FormEmail,
  subject: (d: Record<string, any>) => d['subject'] || 'Bedankt voor je bericht aan CREATEE',
  displayName: 'Formulier (bevestiging / melding)',
  previewData: {
    label: 'Contactformulier', heading: 'Bedankt voor je bericht, Sam!',
    body: 'We hebben je bericht goed ontvangen en reageren zo snel mogelijk, meestal binnen 1–2 werkdagen.',
    fields: [{ label: 'Bericht', value: 'Hoe vallen jullie polo’s qua maat?' }],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Georgia, "Times New Roman", serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', border: '1px solid #e5e5e5' }
const header = { backgroundColor: GREEN, padding: '24px 16px', textAlign: 'center' as const }
const content = { padding: '32px 32px 16px' }
const label = { fontFamily: 'Arial, sans-serif', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, color: GREEN, fontWeight: 700, margin: '0 0 6px' }
const h1 = { fontFamily: 'Arial, sans-serif', fontSize: '26px', lineHeight: '1.25', fontWeight: 800, color: '#1A1A1A', margin: '0 0 20px' }
const text = { fontSize: '16px', lineHeight: '1.6', color: '#1A1A1A', margin: '0 0 14px' }
const item = { fontSize: '14px', lineHeight: '1.5', color: '#1A1A1A', margin: 0 }
const hr = { borderColor: '#e5e5e5', margin: '20px 0' }
const footer = { backgroundColor: '#F5F5F5', padding: '20px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '13px', color: '#555555', margin: 0 }
