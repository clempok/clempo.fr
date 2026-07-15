import { readCrm, type CrmContact, type CrmCompany } from './_crm'
import { getSheetValues, setSheetValues } from './_gsheet'

/**
 * Core sync logic shared between the weekly cron (scheduled-leads-gsheet-sync)
 * and the on-demand admin trigger (admin-leads-gsheet-sync).
 *
 * Strategy:
 *   1. Pull downloaders from the CRM (npsResponses[] non-empty OR source matches a lead magnet).
 *   2. Read current sheet rows to preserve manual / LinkedIn entries.
 *   3. Merge — existing rows keep their name/company, downloaders fill the 3 last cols.
 *   4. Overwrite the sheet with the merged result.
 *
 * Output columns: Prénom | Nom | Email | Entreprise | Téléchargements | Date 1er DL | Date dernier DL
 */

export const DEFAULT_SHEET_ID = '1WJB5Ts-Couv3bW9pYzYBoxXq7G7PX9qAfsk9wYwfKrA'
export const SHEET_RANGE = 'A1:G10000'

const DOWNLOAD_SOURCE_HINTS = [
  'brochure',
  'journalistes',
  'décideurs hospitaliers',
  'decideurs hospitaliers',
  'influenceurs santé',
  'influenceurs sante',
  'data ',
  'data-download',
]

function isDownloader(c: CrmContact): boolean {
  if (c.npsResponses && c.npsResponses.length > 0) return true
  const src = (c.source || '').toLowerCase()
  return DOWNLOAD_SOURCE_HINTS.some(h => src.includes(h))
}

function labelFromSource(source: string): string {
  const s = source.toLowerCase()
  if (s.includes('brochure')) return 'Brochure CPO Services'
  if (s.includes('journalistes')) return 'Liste journalistes santé'
  if (s.includes('décideurs') || s.includes('decideurs')) return 'Base décideurs hospitaliers'
  if (s.includes('influenceurs')) return 'Base influenceurs santé'
  if (s.startsWith('data ') || s.includes('data-')) return source.replace(/^Data\s*/i, 'Data — ')
  return source
}

function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}

type Summary = {
  firstName: string
  lastName: string
  email: string
  company: string
  labels: string[]
  firstDl: string
  lastDl: string
}

export function buildDownloadSummaries(companies: CrmCompany[]): Map<string, Summary> {
  const byEmail = new Map<string, Summary>()

  for (const co of companies) {
    for (const c of co.contacts) {
      if (!isDownloader(c)) continue
      const email = c.email.toLowerCase().trim()
      if (!email) continue

      const labels: string[] = []
      const dates: string[] = []
      if (c.npsResponses && c.npsResponses.length > 0) {
        for (const r of c.npsResponses) {
          labels.push(r.resourceLabel || r.resource)
          if (r.downloadedAt) dates.push(r.downloadedAt)
        }
      }
      if (labels.length === 0 && c.source) {
        for (const s of c.source.split(',').map(x => x.trim()).filter(Boolean)) {
          if (DOWNLOAD_SOURCE_HINTS.some(h => s.toLowerCase().includes(h))) {
            labels.push(labelFromSource(s))
          }
        }
        if (c.createdAt) dates.push(c.createdAt)
      }
      if (labels.length === 0) continue

      const companyName = co.name && !co.name.includes('@') ? co.name : ''

      const existing = byEmail.get(email)
      if (existing) {
        existing.labels.push(...labels)
        const allDates = [existing.firstDl, existing.lastDl, ...dates].filter(Boolean).sort()
        existing.firstDl = allDates[0] || ''
        existing.lastDl = allDates[allDates.length - 1] || ''
        existing.firstName = existing.firstName || c.firstName || ''
        existing.lastName = existing.lastName || c.lastName || ''
        existing.company = existing.company || companyName
      } else {
        const sorted = dates.filter(Boolean).sort()
        byEmail.set(email, {
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email,
          company: companyName,
          labels,
          firstDl: sorted[0] || '',
          lastDl: sorted[sorted.length - 1] || '',
        })
      }
    }
  }

  return byEmail
}

export type SyncResult = {
  ok: true
  downloaders: number
  existingRows: number
  matched: number
  appended: number
  totalRowsWritten: number
  durationMs: number
}

export async function syncLeadsToGsheet(spreadsheetId = DEFAULT_SHEET_ID): Promise<SyncResult> {
  const start = Date.now()

  const crm = await readCrm()
  const downloaders = buildDownloadSummaries(crm.companies)

  const current = await getSheetValues(spreadsheetId, SHEET_RANGE)
  const existingRows = current.slice(1).filter(r => (r[2] || '').trim()) // need an email

  const header = ['Prénom', 'Nom', 'Email', 'Entreprise', 'Téléchargements', 'Date 1er DL', 'Date dernier DL']
  const out: string[][] = [header]
  const seen = new Set<string>()

  for (const row of existingRows) {
    const firstName = (row[0] || '').trim()
    const lastName = (row[1] || '').trim()
    const email = (row[2] || '').trim().toLowerCase()
    const company = (row[3] || '').trim()
    if (!email || seen.has(email)) continue
    seen.add(email)

    const s = downloaders.get(email)
    if (s) {
      out.push([
        firstName || s.firstName,
        lastName || s.lastName,
        email,
        company || s.company,
        uniq(s.labels).join(', '),
        fmtDate(s.firstDl),
        fmtDate(s.lastDl),
      ])
    } else {
      out.push([firstName, lastName, email, company, '', '', ''])
    }
  }

  let appended = 0
  for (const [email, s] of downloaders) {
    if (seen.has(email)) continue
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

  await setSheetValues(spreadsheetId, SHEET_RANGE, out)

  const matched = existingRows.filter(r => downloaders.has((r[2] || '').trim().toLowerCase())).length
  return {
    ok: true,
    downloaders: downloaders.size,
    existingRows: existingRows.length,
    matched,
    appended,
    totalRowsWritten: out.length - 1,
    durationMs: Date.now() - start,
  }
}
