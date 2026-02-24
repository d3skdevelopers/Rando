export function verifyStudentEmail(email: string): boolean {
  return /\.edu$|\.ac\.uk$|\.ac\.[a-z]{2}$|\.edu\.[a-z]{2}$/i.test(email.toLowerCase())
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Verification code for ${email}: ${code}`)
      return
    }
    throw new Error('RESEND_API_KEY is not configured')
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Rando <verify@rando.app>',
      to: [email],
      subject: `Your Rando verification code: ${code}`,
      html: `<div style="font-family:Georgia,serif;max-width:400px;margin:0 auto;padding:32px;background:#0a0a0f;color:#f0f0f0;border-radius:12px;border:1px solid rgba(124,58,237,0.3)"><h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Verify your student email</h2><p style="color:#8080a0;margin-bottom:24px">Enter this code in Rando. It expires in 10 minutes.</p><div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#a78bfa;background:rgba(124,58,237,0.15);padding:16px 24px;border-radius:8px;text-align:center;margin-bottom:24px">${code}</div><p style="font-size:12px;color:#60607a">If you didn't request this, ignore this email.</p></div>`,
    }),
  })
  if (!res.ok) throw new Error(`Failed to send verification email: ${await res.text()}`)
}
