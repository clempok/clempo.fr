import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm, CRM_STATUSES, type CrmStatus, type CrmContact, type CrmCompany } from './_crm'

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
        body: JSON.stringify({ companies: data.companies, statuses: CRM_STATUSES }),
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
        if (fields.name !== undefined) company.name = fields.name
        if (fields.status !== undefined) company.status = fields.status as CrmStatus
        if (fields.notes !== undefined) company.notes = fields.notes
        company.updatedAt = new Date().toISOString()
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
        const { fields } = body as { fields: { name: string; status?: CrmStatus; notes?: string } }
        if (!fields.name?.trim()) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Company name required' }) }
        }
        const name = fields.name.trim()
        if (data.companies.some(c => c.name.toLowerCase() === name.toLowerCase())) {
          return { statusCode: 409, body: JSON.stringify({ error: 'Company already exists' }) }
        }
        const now = new Date().toISOString()
        const company: CrmCompany = {
          id: 'co-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          name,
          status: (fields.status as CrmStatus) || 'Non qualifié',
          contacts: [],
          notes: fields.notes || '',
          createdAt: now,
          updatedAt: now,
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
        if (fields.email !== undefined) contact.email = fields.email
        if (fields.firstName !== undefined) contact.firstName = fields.firstName
        if (fields.lastName !== undefined) contact.lastName = fields.lastName
        if (fields.source !== undefined) contact.source = fields.source
        if (fields.notes !== undefined) contact.notes = fields.notes
        contact.updatedAt = new Date().toISOString()
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, contact }) }
      }

      if (action === 'create-contact') {
        const { companyId, fields } = body as { companyId: string; fields: Partial<CrmContact> }
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
        const contact: CrmContact = {
          id: email.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`,
          email,
          firstName: fields.firstName || '',
          lastName: fields.lastName || '',
          source: fields.source || 'Manual',
          notes: fields.notes || '',
          createdAt: now,
          updatedAt: now,
        }
        company.contacts.push(contact)
        company.updatedAt = now
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, contact }) }
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
