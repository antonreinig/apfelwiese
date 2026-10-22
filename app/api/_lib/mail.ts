import { Resend } from 'resend'

const ABSENDER = 'Apfelwiese <anmeldung@apfelwiese.app>'
export const BETREIBER_MAIL = 'anton.reinig@gmail.com'

export async function sendeMail(an: string, betreff: string, text: string, html: string, antwortAn?: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY fehlt')
  const r = await new Resend(key).emails.send({ from: ABSENDER, to: an, subject: betreff, text, html, replyTo: antwortAn })
  if (r.error) throw new Error(r.error.message)
}

export function escape(t: string) {
  return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
