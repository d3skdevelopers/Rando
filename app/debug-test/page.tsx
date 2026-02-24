import { notFound } from 'next/navigation'

// Debug tooling only runs locally via `next dev`.
// This stub returns 404 in all other environments.
export default function DebugPage() {
  notFound()
}
