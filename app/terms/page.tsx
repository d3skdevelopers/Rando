import Link from 'next/link'

export const metadata = { title: 'Terms of Service – Rando' }

function S({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e0e0f0', marginBottom: '10px', fontFamily: "'Georgia', serif" }}>{t}</h2>
      <div style={{ fontSize: '14px', color: '#8080a0', lineHeight: '1.9' }}>{children}</div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'Georgia', serif", padding: '60px 24px', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 'min(600px,80vw)', height: 'min(600px,80vw)', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <Link href="/" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none', display: 'inline-block', marginBottom: '40px' }}>← Back</Link>
        <div style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '20px', fontSize: '12px', color: '#c4b5fd', marginBottom: '20px', letterSpacing: '0.5px' }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(32px,6vw,48px)', fontWeight: 700, letterSpacing: '-1.5px', marginBottom: '8px', background: 'linear-gradient(135deg,#ffffff 0%,#a0a0c0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: '#40404a', marginBottom: '48px' }}>Last updated: February 24, 2026</p>

        <S t="1. Acceptance of Terms">By accessing or using Rando, you agree to these Terms and our Privacy Policy. Continued use after updates constitutes acceptance.</S>
        <S t="2. Eligibility">You must be at least 18. Users aged 13–17 require verifiable parental consent. We may terminate accounts that misrepresent age.</S>
        <S t="3. Anonymous Use and Guest Sessions">Guest sessions are temporary and not tied to a real identity in any user-facing store. IP addresses may be logged for safety. Messages are deleted 24 hours after session end unless saved to an account.</S>
        <S t="4. Account Registration">Registered accounts require a valid email and display name. You are responsible for your credentials and for providing accurate information.</S>
        <S t="5. Student Verification">Users who verify a qualifying academic email (.edu, .ac.uk, etc.) may receive premium features at no cost. Access may be revoked if verification is fraudulent. We may change or end the Student Plan with reasonable notice.</S>
        <S t="6. Prohibited Conduct">
          You agree not to:
          <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              'Share, solicit, or distribute CSAM. We will report such content to NCMEC and law enforcement.',
              'Harass, threaten, bully, or stalk other users.',
              "Share another person's private information without consent (doxxing).",
              'Impersonate any person or entity.',
              'Use bots or automated tools to interact with the Service.',
              'Circumvent our anti-abuse, CAPTCHA, or moderation systems.',
              'Use Rando for commercial solicitation without prior written approval.',
            ].map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </S>
        <S t="7. Content and Moderation">You are solely responsible for content you share. We reserve the right to remove content and suspend accounts at our sole discretion. Reports grant us permission to act on them.</S>
        <S t="8. Intellectual Property">All Rando content, trademarks, and technology are owned by or licensed to us. You retain ownership of content you create but grant us a non-exclusive, royalty-free licence to store and display it for the purpose of operating the Service.</S>
        <S t="9. Privacy">Your use is governed by our{' '}<Link href="/privacy" style={{ color: '#a78bfa' }}>Privacy Policy</Link>, incorporated by reference.</S>
        <S t="10. Payments">Paid plans are billed in advance via Stripe. Fees are non-refundable except as required by law. We will give 30 days' notice before changing subscription prices.</S>
        <S t="11. Disclaimer of Warranties">The Service is provided "as is" without warranties of any kind. Use is at your own risk.</S>
        <S t="12. Limitation of Liability">To the maximum extent permitted by law, Rando shall not be liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the greater of the amount you paid us in the prior 12 months or £50 / $50 USD.</S>
        <S t="13. Indemnification">You agree to indemnify Rando and its affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.</S>
        <S t="14. Termination">We may suspend or terminate access at any time. You may delete your account via Settings → Account → Delete Account. Sections 6, 8, 11, 12, and 13 survive termination.</S>
        <S t="15. Governing Law">These Terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of English courts, unless local consumer protection law provides additional rights.</S>
        <S t="16. Contact">Questions? Email <a href="mailto:legal@rando.app" style={{ color: '#a78bfa' }}>legal@rando.app</a>.</S>

        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '24px' }}>
          <Link href="/privacy" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none' }}>Privacy Policy →</Link>
          <Link href="/safety" style={{ fontSize: '13px', color: '#60607a', textDecoration: 'none' }}>Safety →</Link>
        </div>
      </div>
    </div>
  )
}
