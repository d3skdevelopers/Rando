import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const HCAPTCHA_SECRET  = process.env.HCAPTCHA_SECRET ?? ''
const HCAPTCHA_SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY ?? ''

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 })

  if (!HCAPTCHA_SECRET) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[DEV] HCAPTCHA_SECRET not set — bypassing verification')
      return NextResponse.json({ success: true, dev: true })
    }
    return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 })
  }

  try {
    const body = new URLSearchParams({ secret: HCAPTCHA_SECRET, response: token })
    if (HCAPTCHA_SITEKEY) body.append('sitekey', HCAPTCHA_SITEKEY)

    const res = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    })
    const data: { success: boolean; 'error-codes'?: string[] } = await res.json()

    if (!data.success) {
      console.warn('[hCaptcha] failed:', data['error-codes'])
      return NextResponse.json({ success: false, errorCodes: data['error-codes'] }, { status: 403 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[hCaptcha] siteverify error:', err)
    return NextResponse.json({ success: false, error: 'Verification service error' }, { status: 500 })
  }
}
