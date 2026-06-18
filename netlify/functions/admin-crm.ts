import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import {
  readCrm, writeCrm,
  CRM_STATUSES, CONTACT_LANGUAGES, COMPANY_SIZES, COMPANY_LOCATIONS, COMPANY_SECTORS, COMPANY_ORIGINS,
  detectLanguage,
  type CrmStatus, type CrmContact, type CrmCompany, type CrmTask,
  type ContactLanguage, type CompanySize, type CompanyLocation, type CompanySector, type CompanyOrigin,
} from './_crm'
import { buildInputFromContact, submitDropcontactSearch } from './_dropcontact'

const handler: Handler = async (event) => {
  if (!checkAuth(event.headers as Record<string, string | undefined>)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    if (event.httpMethod === 'GET') {
      const data = await readCrm()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: data.companies, statuses: CRM_STATUSES, origins: COMPANY_ORIGINS }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { action } = body
      const data = await readCrm()

      // --- Company-level actions ---

      if (action === 'update-company') {
        const { id, fields } = body as { id: string; fields: Partial<CrmCompany> }
        const company = data.companies.find(c => c.id === id)
        if (!company) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        }
        if (fields.status && !CRM_STATUSES.includes(fields.status as CrmStatus)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) }
        }
        if (fields.size !== undefined && fields.size !== null && !COMPANY_SIZES.includes(fields.size as CompanySize)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid size' }) }
        }
        if (fields.location !== undefined && fields.location !== null && !COMPANY_LOCATIONS.includes(fields.location as CompanyLocation)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid location' }) }
        }
        if (fields.sector !== undefined && fields.sector !== null && !COMPANY_SECTORS.includes(fields.sector as CompanySector)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid sector' }) }
        }
        if (fields.origin !== undefined && fields.origin !== null && !COMPANY_ORIGINS.includes(fields.origin as CompanyOrigin)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid origin' }) }
        }
        const now = new Date().toISOString()
        if (fields.name !== undefined) company.name = fields.name
        if (fields.status !== undefined) {
          const newStatus = fields.status as CrmStatus
          if (newStatus !== company.status) {
            // Log the transition for the Analytics funnel.
            if (!company.statusHistory || company.statusHistory.length === 0) {
              company.statusHistory = [{ status: company.status, at: company.createdAt || now }]
            }
            company.statusHistory.push({ status: newStatus, at: now })
            company.status = newStatus
          }
        }
        if (fields.notes !== undefined) company.notes = fields.notes
        if (fields.size !== undefined) company.size = fields.size || undefined
        if (fields.location !== undefined) company.location = fields.location || undefined
        if (fields.sector !== undefined) company.sector = fields.sector || undefined
        if (fields.origin !== undefined) company.origin = fields.origin || undefined
        company.updatedAt = now
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, company }) }
      }

      if (action === 'delete-company') {
        const { id } = body as { id: string }
        const before = data.companies.length
        data.companies = data.companies.filter(c => c.id !== id)
        if (data.companies.length === before) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        }
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true }) }
      }

      if (action === 'create-company') {
        const { fields } = body as { fields: { name: string; status?: CrmStatus; notes?: string; origin?: CompanyOrigin } }
        if (!fields.name?.trim()) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Company name required' }) }
        }
        if (fields.origin !== undefined && fields.origin !== null && !COMPANY_ORIGINS.includes(fields.origin as CompanyOrigin)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid origin' }) }
        }
        const name = fields.name.trim()
        const companyId = 'co-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        // Compare on the normalized id (not just the raw name) so whitespace /
        // punctuation variants can't create a duplicate that collides on id.
        if (data.companies.some(c => c.id === companyId || c.name.toLowerCase() === name.toLowerCase())) {
          return { statusCode: 409, body: JSON.stringify({ error: 'Company already exists' }) }
        }
        const now = new Date().toISOString()
        const initialStatus = (fields.status as CrmStatus) || 'Non qualifié'
        const company: CrmCompany = {
          id: companyId,
          name,
          status: initialStatus,
          contacts: [],
          notes: fields.notes || '',
          createdAt: now,
          updatedAt: now,
          statusHistory: [{ status: initialStatus, at: now }],
          ...(fields.origin ? { origin: fields.origin } : {}),
        }
        data.companies.push(company)
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, company }) }
      }

      // --- Contact-level actions ---

      if (action === 'update-contact') {
        const { companyId, contactId, fields } = body as {
          companyId: string; contactId: string; fields: Partial<CrmContact>
        }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        const contact = company.contacts.find(c => c.id === contactId)
        if (!contact) return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }
        if (fields.language !== undefined && fields.language !== null && !CONTACT_LANGUAGES.includes(fields.language as ContactLanguage)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid language' }) }
        }
        if (fields.email !== undefined) contact.email = fields.email
        if (fields.firstName !== undefined) contact.firstName = fields.firstName
        if (fields.lastName !== undefined) contact.lastName = fields.lastName
        if (fields.source !== undefined) contact.source = fields.source
        if (fields.notes !== undefined) contact.notes = fields.notes
        if (fields.linkedIn !== undefined) contact.linkedIn = fields.linkedIn
        if (fields.phone !== undefined) contact.phone = fields.phone
        if (fields.jobTitle !== undefined) contact.jobTitle = fields.jobTitle
        if (fields.company !== undefined) contact.company = fields.company
        if (fields.language !== undefined) contact.language = fields.language || undefined
        contact.updatedAt = new Date().toISOString()
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, contact }) }
      }

      if (action === 'create-contact') {
        const { companyId, fields, autoEnrich } = body as {
          companyId: string
          fields: Partial<CrmContact>
          autoEnrich?: boolean
        }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        if (!fields.email?.trim()) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) }
        }
        const email = fields.email.trim().toLowerCase()
        // Check email uniqueness across all companies
        for (const co of data.companies) {
          if (co.contacts.some(c => c.email.toLowerCase() === email)) {
            return { statusCode: 409, body: JSON.stringify({ error: 'Email already exists' }) }
          }
        }
        const now = new Date().toISOString()
        const language = fields.language && CONTACT_LANGUAGES.includes(fields.language as ContactLanguage)
          ? fields.language as ContactLanguage
          : detectLanguage({ email, firstName: fields.firstName })
        const contact: CrmContact = {
          id: email.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`,
          email,
          firstName: fields.firstName || '',
          lastName: fields.lastName || '',
          source: fields.source || 'Manual',
          notes: fields.notes || '',
          linkedIn: fields.linkedIn || undefined,
          language,
          createdAt: now,
          updatedAt: now,
        }
        company.contacts.push(contact)
        company.updatedAt = now

        // Optionally fire a Dropcontact search and stash the request_id.
        // Used by the linkedin-sync skill so freshly-imported leads get
        // their email/phone resolved on the next call to
        // resolve-pending-enrichments.
        let enrichmentSubmitted = false
        let enrichmentError: string | undefined
        if (autoEnrich) {
          const apiKey = process.env.DROPCONTACT_API_KEY
          if (!apiKey) {
            enrichmentError = 'DROPCONTACT_API_KEY not configured'
          } else {
            const input = buildInputFromContact(contact, company.name)
            if (!input) {
              enrichmentError = 'Insufficient signal for Dropcontact'
            } else {
              const submit = await submitDropcontactSearch(apiKey, input)
              if ('error' in submit) {
                enrichmentError = submit.error
              } else {
                contact.enrichRequestId = submit.requestId
                contact.enrichSubmittedAt = now
                enrichmentSubmitted = true
              }
            }
          }
        }

        await writeCrm(data)
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, contact, enrichmentSubmitted, enrichmentError }),
        }
      }

      if (action === 'delete-contact') {
        const { companyId, contactId } = body as { companyId: string; contactId: string }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        const before = company.contacts.length
        company.contacts = company.contacts.filter(c => c.id !== contactId)
        if (company.contacts.length === before) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Contact not found' }) }
        }
        company.updatedAt = new Date().toISOString()
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true }) }
      }

      // --- Task-level actions ---

      if (action === 'create-task') {
        const { companyId, fields } = body as { companyId: string; fields: { title: string; dueDate: string; description?: string } }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        if (!fields.title?.trim()) return { statusCode: 400, body: JSON.stringify({ error: 'Title required' }) }
        if (!fields.dueDate?.match(/^\d{4}-\d{2}-\d{2}$/)) return { statusCode: 400, body: JSON.stringify({ error: 'dueDate must be YYYY-MM-DD' }) }
        if (!company.tasks) company.tasks = []
        const now = new Date().toISOString()
        const task: CrmTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: fields.title.trim(),
          dueDate: fields.dueDate,
          description: fields.description?.trim() || '',
          done: false,
          createdAt: now,
          updatedAt: now,
        }
        company.tasks.push(task)
        company.updatedAt = now
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, task }) }
      }

      if (action === 'update-task') {
        const { companyId, taskId, fields } = body as {
          companyId: string; taskId: string; fields: Partial<CrmTask>
        }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        if (!company.tasks) company.tasks = []
        const task = company.tasks.find(t => t.id === taskId)
        if (!task) return { statusCode: 404, body: JSON.stringify({ error: 'Task not found' }) }
        if (fields.title !== undefined) task.title = fields.title
        if (fields.dueDate !== undefined) task.dueDate = fields.dueDate
        if (fields.description !== undefined) task.description = fields.description
        if (fields.done !== undefined) task.done = fields.done
        task.updatedAt = new Date().toISOString()
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, task }) }
      }

      if (action === 'delete-task') {
        const { companyId, taskId } = body as { companyId: string; taskId: string }
        const company = data.companies.find(c => c.id === companyId)
        if (!company) return { statusCode: 404, body: JSON.stringify({ error: 'Company not found' }) }
        if (!company.tasks) company.tasks = []
        const before = company.tasks.length
        company.tasks = company.tasks.filter(t => t.id !== taskId)
        if (company.tasks.length === before) return { statusCode: 404, body: JSON.stringify({ error: 'Task not found' }) }
        company.updatedAt = new Date().toISOString()
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true }) }
      }

      // --- One-shot data ops ---

      if (action === 'backfill-locations') {
        // Heuristic: for companies without `location`, set FR if at least half
        // of contact emails end with .fr. Conservative — never overwrites a
        // value already set, never assigns Europe_US/Autre (too ambiguous).
        let updated = 0
        const updatedIds: string[] = []
        const now = new Date().toISOString()
        for (const co of data.companies) {
          if (co.location) continue
          if (co.contacts.length === 0) continue
          const frCount = co.contacts.filter(c => (c.email || '').toLowerCase().endsWith('.fr')).length
          if (frCount >= Math.ceil(co.contacts.length / 2)) {
            co.location = 'FR'
            co.updatedAt = now
            updated++
            updatedIds.push(co.id)
          }
        }
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, updated, updatedIds }) }
      }

      if (action === 'backdate-status-transitions') {
        // Backdate statusHistory entries for a target status (e.g. 'Client') that
        // fall in [windowStartISO, windowEndISO) — except for company IDs in
        // `keepIds`. Used to clean up legacy imports that predate the funnel
        // tracking. Idempotent: re-running has no effect once entries are moved.
        const { targetStatus, windowStartISO, windowEndISO, backdatedToISO, keepIds } = body as {
          targetStatus: CrmStatus
          windowStartISO: string
          windowEndISO: string
          backdatedToISO: string
          keepIds: string[]
        }
        if (!CRM_STATUSES.includes(targetStatus)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid targetStatus' }) }
        }
        const keepSet = new Set(keepIds || [])
        let modifiedCount = 0
        const modifiedIds: string[] = []
        for (const co of data.companies) {
          if (keepSet.has(co.id)) continue
          if (!co.statusHistory) continue
          for (const entry of co.statusHistory) {
            if (entry.status === targetStatus && entry.at >= windowStartISO && entry.at < windowEndISO) {
              entry.at = backdatedToISO
              modifiedCount++
              if (!modifiedIds.includes(co.id)) modifiedIds.push(co.id)
            }
          }
        }
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, modifiedCount, modifiedIds }) }
      }

      // Legacy compat
      if (action === 'update' || action === 'create' || action === 'delete') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Legacy action. Use update-company, update-contact, etc.' }) }
      }

      return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }
    }

    return { statusCode: 405, body: 'Method not allowed' }
  } catch (err) {
    console.error('admin-crm error:', err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err), stack: (err as Error)?.stack }),
    }
  }
}

export { handler }
