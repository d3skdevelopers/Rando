import Link from 'next/link'

export const metadata = { title: 'Privacy Policy – Rando' }

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e0e0f0', marginBottom: '10px', fontFamily: "'Georgia', serif" }}>{t}</h2>
      <div style={{ fontSize: '14px', color: '#8080a0', lineHeight: '1.9' }}>{children}</div>
    </div>
  )
}

function Table({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows
  return (
    <div style={{ overflowX: 'auto', marginTop: '12px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>{header.map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#e0e0f0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#8080a0', verticalAlign: 'top' }}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Georgia', serif", padding: '60px 24px', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 'min(600px,80vw)', height: 'min(600px,80vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Back</Link>
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', fontSize: '12px', color: '#c4b5fd', marginBottom: '20px', letterSpacing: '0.5px' }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,6vw,48px)', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: '8px', background: 'linear-gradient(135deg,#ffffff 0%,#a0a0c0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: '#40404a', marginBottom: '24px' }}>Last updated: February 24, 2026</p>

        {/* TL;DR */}
        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '20px 24px', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', color: '#a78bfa', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>TL;DR</p>
          <ul style={{ padding: '0 0 0 16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: '#a0a0b0' }}>
            {[
              "Anonymous chats aren't linked to your identity.",
              "We collect as little as possible and never sell your data.",
              "Your email is only used for account access and verification.",
              "You can export or delete all your data at any time.",
              "We use Supabase (EU), Resend, hCaptcha, and Vercel — all detailed below.",
              "We comply with GDPR, UK GDPR, and applicable US privacy law.",
            ].map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>

        <S t="1. Who We Are">Rando operates the anonymous chat platform at rando.app. For registered accounts we act as Data Controller. For anonymous guest sessions we act as a data processor with no persistent identity stored. DPO: <a href="mailto:dpo@rando.app" style={{ color: '#a78bfa' }}>dpo@rando.app</a>.</S>

        <S t="2. Data We Collect">
          <Table rows={[
            ['Category', 'What', 'Why', 'Retention'],
            ['Account', 'Email, display name, hashed password', 'Account access', 'Until deletion'],
            ['Profile', 'Bio, interests, avatar, tier', 'Personalisation', 'Until deletion'],
            ['Messages', 'Content, timestamps', 'Deliver the chat', '90 days after session end'],
            ['Guest session', 'Random session ID', 'Match anonymous users', '24 hours'],
            ['Usage', 'Pages visited, features used', 'Product improvement', '12 months, anonymised'],
            ['Technical', 'IP address, user-agent', 'Security & fraud', '30 days'],
            ['Payment', 'Billing email, plan type (via Stripe)', 'Subscriptions', 'Duration + 7 years'],
            ['Verification', 'Student email, code', 'Student plan', 'Deleted after verification'],
          ]} />
          <p style={{ marginTop: '12px' }}>We never see your full card number. Stripe handles all raw payment data.</p>
        </S>

        <S t="3. How We Use Your Data">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {['To operate and improve the Service','To match users for anonymous chat','To send transactional emails (verification, password reset)','To process payments and manage subscriptions','To detect and prevent abuse and illegal content','To comply with legal obligations','To send optional product updates (opt-out anytime)'].map((item, i) => <li key={i}>{item}</li>)}
          </ul>
          <p style={{ marginTop: '10px' }}>We do not use your data for advertising. We do not sell or rent your data.</p>
        </S>

        <S t="4. Anonymous Chats">Guest session IDs are not tied to your IP in any user-facing data store. Chat messages in anonymous sessions are deleted 24 hours after the session ends. Even in saved sessions, your chat partner's identity is never revealed.</S>

        <S t="5. Cookies and Local Storage">
          <Table rows={[
            ['Name', 'Type', 'Purpose', 'Expiry'],
            ['sb-auth-token', 'Cookie (HttpOnly)', 'Supabase auth session', 'Session'],
            ['rando-guest-session', 'localStorage', 'Anonymous session persistence', '24 hours'],
            ['hcaptcha', 'Cookie (3rd party)', 'Bot prevention', 'Session'],
          ]} />
          <p style={{ marginTop: '10px' }}>We do not use tracking or advertising cookies.</p>
        </S>

        <S t="6. Third-Party Services">
          <Table rows={[
            ['Service', 'Purpose', 'Privacy policy'],
            ['Supabase (EU)', 'Database & auth', 'supabase.com/privacy'],
            ['Stripe', 'Payments', 'stripe.com/privacy'],
            ['Resend', 'Transactional email', 'resend.com/privacy'],
            ['hCaptcha', 'Bot prevention', 'hcaptcha.com/privacy'],
            ['Vercel', 'Hosting & CDN', 'vercel.com/legal/privacy-policy'],
          ]} />
        </S>

        <S t="7. Data Sharing">We only share data with: (a) service providers in Section 6 under data processing agreements, (b) law enforcement when legally required, (c) parties in a merger/acquisition after notifying you. We always attempt to notify you of legal requests where permitted.</S>

        <S t="8. Your Rights">
          <Table rows={[
            ['Right', 'What it means'],
            ['Access', 'Request a copy of all data we hold about you'],
            ['Rectification', 'Correct inaccurate or incomplete data'],
            ['Erasure', 'Request deletion ("right to be forgotten")'],
            ['Portability', 'Receive your data in machine-readable format'],
            ['Objection', 'Object to processing based on legitimate interests'],
            ['Withdraw consent', 'Withdraw consent for any consent-based processing'],
          ]} />
          <p style={{ marginTop: '12px' }}>Exercise rights via Settings → Account → Privacy, or email <a href="mailto:privacy@rando.app" style={{ color: '#a78bfa' }}>privacy@rando.app</a>. We respond within 30 days. UK users can complain to the ICO at ico.org.uk.</p>
        </S>

        <S t="9. Data Retention">Registered account data is retained until you delete your account. Chat history is retained for 90 days after session end. Logs are retained for 30 days. Deletion requests are fulfilled within 30 days, except where legally required to retain longer.</S>

        <S t="10. Security">We use TLS in transit, AES-256 at rest (via Supabase), bcrypt password hashing, and row-level security on all database tables. No system is completely secure.</S>

        <S t="11. Children's Privacy">The Service is not directed to children under 13. Contact <a href="mailto:privacy@rando.app" style={{ color: '#a78bfa' }}>privacy@rando.app</a> if you believe a child under 13 has provided us data.</S>

        <S t="12. International Transfers">Primary infrastructure is in the EU (Supabase Frankfurt). Transfers outside the EU/UK are protected by Standard Contractual Clauses.</S>

        <S t="13. Changes">Material changes will be emailed to registered users and reflected in the "Last updated" date above.</S>

        <S t="14. Contact">
          <p>Privacy questions: <a href="mailto:privacy@rando.app" style={{ color: '#a78bfa' }}>privacy@rando.app</a></p>
          <p>Data protection officer: <a href="mailto:dpo@rando.app" style={{ color: '#a78bfa' }}>dpo@rando.app</a></p>
        </S>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '24px' }}>
          <Link href="/terms" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none' }}>Terms of Service →</Link>
          <Link href="/safety" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none' }}>Safety →</Link>
        </div>
      </div>
    </div>
  )
}
