#!/usr/bin/env -S node --experimental-strip-types
/**
 * Reads /tmp/clempo-crm.json (dump of admin-crm) and the current state of the
 * "Leads - Clempo" Google Sheet, then emits a merged CSV to /tmp/leads-merged.csv
 * with columns:
 *   Prénom | Nom | Email | Entreprise | Téléchargements | Date 1er DL | Date dernier DL
 *
 * Merge rule (per user):
 *   - keep every row already in the sheet
 *   - for rows whose email matches a downloader, fill the 3 last columns
 *   - append rows for downloaders not yet in the sheet
 *
 * A "downloader" = a CRM contact whose source includes one of the known lead
 * magnets OR who has at least one entry in npsResponses[]. npsResponses is
 * authoritative for timestamps; sources are the fallback for legacy contacts
 * created before NPS tracking existed.
 */
import fs from 'node:fs'

type NpsResponse = {
  resource: string
  resourceLabel: string
  downloadedAt: string
}

type Contact = {
  email: string
  firstName?: string
  lastName?: string
  source?: string
  company?: string
  npsResponses?: NpsResponse[]
  createdAt?: string
}

type Company = {
  name: string
  contacts: Contact[]
}

type Crm = { companies: Company[] }

const DOWNLOAD_SOURCE_HINTS = [
  'brochure',
  'journalistes',
  'décideurs hospitaliers',
  'decideurs hospitaliers',
  'data ',
  'data—',
  'data-download',
]

function isDownloader(c: Contact): boolean {
  if (c.npsResponses && c.npsResponses.length > 0) return true
  const src = (c.source || '').toLowerCase()
  return DOWNLOAD_SOURCE_HINTS.some(h => src.includes(h))
}

function labelFromSource(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('brochure')) return 'Brochure CPO Services'
  if (s.includes('journalistes')) return 'Liste journalistes santé'
  if (s.includes('décideurs') || s.includes('decideurs')) return 'Base décideurs hospitaliers'
  if (s.startsWith('data ') || s.includes('data-')) return source.replace(/^Data\s*/i, 'Data — ')
  return source
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function csvEscape(v: string): string {
  if (v == null) return ''
  if (/[",\n;]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

function main() {
  const crmPath = '/tmp/clempo-crm.json'
  if (!fs.existsSync(crmPath)) {
    console.error(`Missing ${crmPath} — run:`)
    console.error(`  curl -s -H "Authorization: Bearer Ch4!pitron" https://www.clempo.fr/.netlify/functions/admin-crm > ${crmPath}`)
    process.exit(1)
  }
  const crm: Crm = JSON.parse(fs.readFileSync(crmPath, 'utf8'))

  // Build a map email → download summary
  type Summary = {
    firstName: string
    lastName: string
    email: string
    company: string
    labels: string[]
    firstDl: string
    lastDl: string
  }

  const byEmail = new Map<string, Summary>()

  for (const co of crm.companies) {
    for (const c of co.contacts) {
      if (!isDownloader(c)) continue
      const email = c.email.toLowerCase().trim()
      if (!email) continue

      // Build the list of resource labels & timestamps. Prefer npsResponses
      // (one entry per download) but fall back on source for legacy contacts.
      const labels: string[] = []
      const dates: string[] = []
      if (c.npsResponses && c.npsResponses.length > 0) {
        for (const r of c.npsResponses) {
          labels.push(r.resourceLabel || r.resource)
          if (r.downloadedAt) dates.push(r.downloadedAt)
        }
      }
      if (labels.length === 0 && c.source) {
        // No NPS entry → derive a single label from source, use createdAt
        for (const s of c.source.split(',').map(x => x.trim()).filter(Boolean)) {
          if (DOWNLOAD_SOURCE_HINTS.some(h => s.toLowerCase().includes(h))) {
            labels.push(labelFromSource(s))
          }
        }
        if (c.createdAt) dates.push(c.createdAt)
      }
      if (labels.length === 0) continue // shouldn't happen but be safe

      const company = co.name && !co.name.startsWith('co-') ? co.name : ''
      const cleanCompany = company.includes('@') ? '' : company // skip the solo "name=email" fallbacks

      const existing = byEmail.get(email)
      if (existing) {
        existing.labels.push(...labels)
        if (dates.length) {
          existing.firstDl = [existing.firstDl, ...dates].filter(Boolean).sort()[0]
          existing.lastDl = [existing.lastDl, ...dates].filter(Boolean).sort().slice(-1)[0]
        }
        existing.firstName = existing.firstName || c.firstName || ''
        existing.lastName = existing.lastName || c.lastName || ''
        existing.company = existing.company || cleanCompany
      } else {
        const sortedDates = dates.filter(Boolean).sort()
        byEmail.set(email, {
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email,
          company: cleanCompany,
          labels,
          firstDl: sortedDates[0] || '',
          lastDl: sortedDates[sortedDates.length - 1] || '',
        })
      }
    }
  }

  // Read existing sheet snapshot (committed below) to drive the merge
  const sheetPath = '/tmp/leads-sheet-current.tsv'
  let existingRows: { firstName: string; lastName: string; email: string; company: string }[] = []
  if (fs.existsSync(sheetPath)) {
    const lines = fs.readFileSync(sheetPath, 'utf8').split('\n').filter(Boolean)
    for (const line of lines.slice(1)) { // skip header
      const cells = line.split('\t')
      const [firstName = '', lastName = '', email = '', company = ''] = cells
      if (!email) continue
      existingRows.push({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        company: company.trim(),
      })
    }
  }

  const sheetEmails = new Set(existingRows.map(r => r.email))

  // Build merged output
  const header = ['Prénom', 'Nom', 'Email', 'Entreprise', 'Téléchargements', 'Date 1er DL', 'Date dernier DL']
  const out: string[][] = [header]

  for (const row of existingRows) {
    const s = byEmail.get(row.email)
    if (s) {
      out.push([
        row.firstName || s.firstName,
        row.lastName || s.lastName,
        row.email,
        row.company || s.company,
        uniq(s.labels).join(', '),
        fmtDate(s.firstDl),
        fmtDate(s.lastDl),
      ])
    } else {
      out.push([row.firstName, row.lastName, row.email, row.company, '', '', ''])
    }
  }

  // Append new downloaders absent from the sheet
  let appended = 0
  for (const [email, s] of byEmail) {
    if (sheetEmails.has(email)) continue
    out.push([
      s.firstName,
      s.lastName,
      s.email,
      s.company,
      uniq(s.labels).join(', '),
      fmtDate(s.firstDl),
      fmtDate(s.lastDl),
    ])
    appended++
  }

  const csv = out.map(r => r.map(csvEscape).join(',')).join('\n') + '\n'
  fs.writeFileSync('/tmp/leads-merged.csv', csv)

  // Stats
  const totalDl = byEmail.size
  const matched = existingRows.filter(r => byEmail.has(r.email)).length
  console.log(`Downloaders in CRM:          ${totalDl}`)
  console.log(`Existing sheet rows:         ${existingRows.length}`)
  console.log(`Matched in existing sheet:   ${matched}`)
  console.log(`Appended (new in sheet):     ${appended}`)
  console.log(`Output:                      /tmp/leads-merged.csv (${out.length - 1} rows)`)
}

main()
