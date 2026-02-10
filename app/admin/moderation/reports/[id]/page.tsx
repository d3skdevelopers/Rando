'use client'
import { use, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DashboardLayout } from '@/components/admin/DashboardLayout'
import { ReportReview } from '@/components/admin/moderation/ReportReview'
import { ActionPanel } from '@/components/admin/moderation/ActionPanel'

// Exact types from your database
type ModerationAction = 'warn' | 'mute' | 'ban_temporary' | 'ban_permanent' | 'escalate'
type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

interface Report {
  id: string
  reporter_id: string
  reporter_is_guest: boolean
  reported_user_id: string
  reported_user_is_guest: boolean
  session_id: string | null
  reason: string
  category: string
  evidence: string | null
  status: ReportStatus
  priority: number
  reviewed_by: string | null
  review_notes: string | null
  action_taken: ModerationAction | null  // ← CAN BE NULL
  action_details: any | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<Report | null>(null)
  
  useEffect(() => { 
    supabase.from('reports').select('*').eq('id', id).single().then(({ data }) => data && setReport(data)) 
  }, [id])
  
  const handleAction = async (action: ModerationAction) => {  // ← action CANNOT be null here
    // Type assertion for the update
    const updateData = {
      status: 'resolved' as ReportStatus,
      action_taken: action as ModerationAction,  // ← This is NOT null
      resolved_at: new Date().toISOString()
    }
    
    // @ts-ignore - Bypass broken Supabase types
    const { error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('Failed to update report:', error)
      return
    }
    
    if (report) {
      setReport({ 
        ...report, 
        status: 'resolved',
        action_taken: action,
        resolved_at: new Date().toISOString()
      })
    }
  }
  
  if (!report) return (
    <DashboardLayout>
      <div>Loading...</div>
    </DashboardLayout>
  )
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Report Review</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <ReportReview report={report} />
          <ActionPanel onAction={handleAction} />
        </div>
      </div>
    </DashboardLayout>
  )
}
