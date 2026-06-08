import type { Config } from '@netlify/functions'
import { syncLeadsToGsheet } from './_leads-gsheet'

/**
 * Weekly Leads → Google Sheet sync. Runs every Monday morning and rebuilds the
 * "Leads - Clempo" sheet from the CRM, preserving any non-downloader rows that
 * were already in the sheet (LinkedIn-only connections, manual entries).
 *
 * Required env vars:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON   service-account JSON (Sheets editor access)
 *   - LEADS_SHEET_ID                spreadsheet id (optional, defaults to the known one)
 */
export default async () => {
  try {
    const result = await syncLeadsToGsheet(process.env.LEADS_SHEET_ID || undefined)
    console.log('[scheduled-leads-gsheet-sync]', result)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[scheduled-leads-gsheet-sync] fatal:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const config: Config = {
  schedule: '0 7 * * 1', // Mondays at 07:00 UTC (≈09:00 Paris in summer)
}
