import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm } from './_crm'
import {
  applyResultToContact,
  buildInputFromContact,
  pollDropcontactOnce,
  submitDropcontactSearch,
} from './_dropcontact'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.DROPCONTACT_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'DROPCONTACT_API_KEY not configured' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const action = body.action as string | undefined

    // -------- resolve-pending-enrichments --------
    // Loops over every contact in the CRM that has a stored enrichRequestId
    // and tries to fetch its Dropcontact result. Designed to be called once
    // at the end of the linkedin-sync skill (or manually by a cron/admin).
    // Cap wall time at ~8s to stay under Netlify's 10s function timeout.
    if (action === 'resolve-pending-enrichments') {
      const data = await readCrm()
      const startedAt = Date.now()
      const MAX_MS = 8000

      const pending: Array<{ companyId: string; contactId: string; requestId: string }> = []
      for (const co of data.companies) {
        for (const c of co.contacts) {
          if (c.enrichRequestId && !c.enrichedAt) {
            pending.push({ companyId: co.id, contactId: c.id, requestId: c.enrichRequestId })
          }
        }
      }

      const results = { resolved: 0, stillPending: 0, failed: 0, total: pending.length }
      let dirty = false

      for (const p of pending) {
        if (Date.now() - startedAt > MAX_MS) {
          results.stillPending = pending.length - results.resolved - results.failed
          break
        }
        try {
          const result = await pollDropcontactOnce(apiKey, p.requestId)
          if (!result) {
            results.stillPending++
            continue
          }
          const co = data.companies.find(c => c.id === p.companyId)
          const contact = co?.contacts.find(c => c.id === p.contactId)
          if (!co || !contact) {
            results.failed++
            continue
          }
          applyResultToContact(contact, co, result)
          results.resolved++
          dirty = true
        } catch (err) {
          console.error('resolve poll failed for', p, err)
          results.failed++
        }
      }

      if (dirty) await writeCrm(data)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...results }),
      }
    }

    // -------- enrich a single contact (manual button) --------
    const { companyId, contactId } = body as { companyId: string; contactId: string }
    let { requestId } = body as { requestId?: string }

    if (!companyId || !contactId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'companyId + contactId required' }) }
    }

    const data = await readCrm()
    const company = data.companies.find(c => c.id === companyId)
    if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
    const contact = company.contacts.find(c => c.id === contactId)
    if (!contact) return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }

    // Resume a previously-submitted search if the contact has one stored.
    if (!requestId && contact.enrichRequestId) {
      requestId = contact.enrichRequestId
    }

    // Submit a new search if no requestId
    if (!requestId) {
      const input = buildInputFromContact(contact, company.name)
      if (!input) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Données insuffisantes : il faut au moins un LinkedIn, un email, ou (nom + entreprise).',
          }),
        }
      }
      const submit = await submitDropcontactSearch(apiKey, input)
      if ('error' in submit) {
        return {
          statusCode: 502,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Dropcontact submit failed', details: submit.error }),
        }
      }
      requestId = submit.requestId
      contact.enrichRequestId = requestId
      contact.enrichSubmittedAt = new Date().toISOString()
      await writeCrm(data)
    }

    // Poll up to ~7s
    const startedAt = Date.now()
    const MAX_POLL_MS = 7500
    const POLL_INTERVAL_MS = 1500
    let result = null

    while (Date.now() - startedAt < MAX_POLL_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      result = await pollDropcontactOnce(apiKey, requestId)
      if (result) break
    }

    if (!result) {
      return {
        statusCode: 202,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, requestId }),
      }
    }

    const filled = applyResultToContact(contact, company, result)
    await writeCrm(data)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, contact, filled, hasChanges: filled.length > 0 }),
    }
  } catch (err) {
    console.error('admin-enrich-lead error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
