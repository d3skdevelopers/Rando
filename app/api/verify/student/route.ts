import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { verifyStudentEmail, generateVerificationCode, sendVerificationEmail } from '@/lib/payments/student'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !verifyStudentEmail(email)) {
    return NextResponse.json({ error: 'Invalid student email' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: dbError } = await supabase
    .from('student_verification_codes')
    .upsert({ user_id: user.id, email: email.toLowerCase(), code, expires_at: expiresAt }, { onConflict: 'user_id' })

  if (dbError) return NextResponse.json({ error: 'Failed to initiate verification' }, { status: 500 })

  await sendVerificationEmail(email, code)
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  const { email, code } = await req.json()
  if (!email || !code) return NextResponse.json({ error: 'Missing email or code' }, { status: 400 })

  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: record } = await supabase
    .from('student_verification_codes')
    .select('code, expires_at')
    .eq('user_id', user.id)
    .eq('email', email.toLowerCase())
    .single()

  if (!record) return NextResponse.json({ error: 'No pending verification for this email' }, { status: 400 })
  if (new Date(record.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired — request a new one' }, { status: 400 })
  if (record.code !== code) return NextResponse.json({ error: 'Invalid code' }, { status: 400 })

  await Promise.all([
    supabase.from('users').update({ student_email: email.toLowerCase(), student_email_verified: true, tier: 'student' }).eq('id', user.id),
    supabase.from('student_verification_codes').delete().eq('user_id', user.id),
  ])
  return NextResponse.json({ success: true })
}
