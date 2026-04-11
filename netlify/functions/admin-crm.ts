import type { Handler } from '@netlify/functions'
import { checkAuth } from './_analytics'
import { readCrm, writeCrm, CRM_STATUSES, type CrmStatus, type CrmContact } from './_crm'

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
        body: JSON.stringify({ contacts: data.contacts, statuses: CRM_STATUSES }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const { action } = body
      const data = await readCrm()

      if (action === 'update') {
        const { id, fields } = body as { id: string; fields: Partial<CrmContact> }
        const contact = data.contacts.find(c => c.id === id)
        if (!contact) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
        }
        if (fields.status && !CRM_STATUSES.includes(fields.status as CrmStatus)) {
          return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) }
        }
        Object.assign(contact, fields, { updatedAt: new Date().toISOString() })
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, contact }) }
      }

      if (action === 'create') {
        const { fields } = body as { fields: Partial<CrmContact> }
        if (!fields.email) {
          return { statusCode: 400, body: JSON.stringify({ error: 'email required' }) }
        }
        const email = fields.email.trim().toLowerCase()
        if (data.contacts.some(c => c.email.toLowerCase() === email)) {
          return { statusCode: 409, body: JSON.stringify({ error: 'Email already exists' }) }
        }
        const now = new Date().toISOString()
        const id = email.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `c-${Date.now()}`
        const contact: CrmContact = {
          id,
          email,
          firstName: fields.firstName || '',
          lastName: fields.lastName || '',
          company: fields.company || '',
          status: (fields.status as CrmStatus) || 'Non qualifié',
          source: fields.source || 'Manual',
          notes: fields.notes || '',
          createdAt: now,
          updatedAt: now,
        }
        data.contacts.push(contact)
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true, contact }) }
      }

      if (action === 'delete') {
        const { id } = body as { id: string }
        const before = data.contacts.length
        data.contacts = data.contacts.filter(c => c.id !== id)
        if (data.contacts.length === before) {
          return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
        }
        await writeCrm(data)
        return { statusCode: 200, body: JSON.stringify({ ok: true }) }
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
