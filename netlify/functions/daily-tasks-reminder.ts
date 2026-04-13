import type { Handler } from '@netlify/functions'
import { readCrm } from './_crm'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const TO_EMAIL = 'clement.pougetosmont@gmail.com'

const handler: Handler = async () => {
  try {
    const data = await readCrm()
    const today = new Date().toISOString().slice(0, 10)

    type TaskWithCompany = {
      companyId: string
      companyName: string
      taskId: string
      title: string
      dueDate: string
      done: boolean
      overdue: boolean
    }

    const todayTasks: TaskWithCompany[] = []
    const overdueTasks: TaskWithCompany[] = []

    for (const co of data.companies) {
      if (!co.tasks?.length) continue
      for (const t of co.tasks) {
        if (t.done) continue
        if (t.dueDate === today) {
          todayTasks.push({ companyId: co.id, companyName: co.name, taskId: t.id, title: t.title, dueDate: t.dueDate, done: t.done, overdue: false })
        } else if (t.dueDate < today) {
          overdueTasks.push({ companyId: co.id, companyName: co.name, taskId: t.id, title: t.title, dueDate: t.dueDate, done: t.done, overdue: true })
        }
      }
    }

    const total = todayTasks.length + overdueTasks.length
    if (total === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, sent: false, reason: 'No tasks today' }) }
    }

    const todayFr = new Date(today + 'T12:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const taskRow = (t: TaskWithCompany) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#111;font-size:14px;">${escHtml(t.title)}</strong>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px;">
          ${escHtml(t.companyName)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;white-space:nowrap;${t.overdue ? 'color:#dc2626;font-weight:600;' : 'color:#555;'}">
          ${t.overdue ? `En retard (${new Date(t.dueDate + 'T12:00:00Z').toLocaleDateString('fr-FR')})` : "Aujourd'hui"}
        </td>
      </tr>`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1A1A6B;padding:28px 32px;">
            <p style="margin:0;color:#fff;font-size:13px;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;">CRM clempo.fr</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700;">
              ${total} action${total > 1 ? 's' : ''} à réaliser
            </h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">${todayFr}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px;">

          ${todayTasks.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1A6B;text-transform:uppercase;letter-spacing:0.06em;">
            Aujourd'hui (${todayTasks.length})
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#fafafa;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Tâche</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Entreprise</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Échéance</th>
              </tr>
            </thead>
            <tbody>
              ${todayTasks.map(taskRow).join('')}
            </tbody>
          </table>` : ''}

          ${overdueTasks.length > 0 ? `
          <h2 style="margin:0 0 12px;font-size:14px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em;">
            En retard (${overdueTasks.length})
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <thead>
              <tr style="background:#fff5f5;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Tâche</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Entreprise</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Échéance</th>
              </tr>
            </thead>
            <tbody>
              ${overdueTasks.map(taskRow).join('')}
            </tbody>
          </table>` : ''}

          <p style="margin:24px 0 0;text-align:center;">
            <a href="https://www.clempo.fr/admin" style="display:inline-block;padding:12px 24px;background:#1A1A6B;color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
              Ouvrir le CRM →
            </a>
          </p>

        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">
              clempo.fr · CRM automatique · <a href="https://www.clempo.fr/admin" style="color:#bbb;">Gérer les tâches</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    if (!RESEND_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CRM clempo.fr <noreply@clempo.fr>',
        to: [TO_EMAIL],
        subject: `CRM · ${total} action${total > 1 ? 's' : ''} ce jour${overdueTasks.length > 0 ? ` (dont ${overdueTasks.length} en retard)` : ''}`,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('Resend error:', res.status, body)
      return { statusCode: 500, body: JSON.stringify({ error: `Resend: ${res.status} ${body}` }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, sent: true, todayCount: todayTasks.length, overdueCount: overdueTasks.length }),
    }
  } catch (err) {
    console.error('daily-tasks-reminder error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) }
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export { handler }
