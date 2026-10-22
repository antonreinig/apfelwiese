// Liest den Anmeldecode für delivered@resend.dev über die Resend-API (nur für Tests).

export async function codeAusResend(anfrage: string, versuche = 20): Promise<string> {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY fehlt')
  const kopf = { authorization: `Bearer ${key}` }
  for (let i = 0; i < versuche; i++) {
    const liste = await (await fetch('https://api.resend.com/emails?limit=5', { headers: kopf })).json() as { data: { id: string }[] }
    for (const e of liste.data ?? []) {
      const m = await (await fetch(`https://api.resend.com/emails/${e.id}`, { headers: kopf })).json() as { text?: string }
      if (m.text?.includes(`a=${anfrage}`)) {
        const code = /Apfelwiese: (\d{6})/.exec(m.text)?.[1]
        if (code) return code
      }
    }
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('Anmeldemail nicht gefunden')
}
