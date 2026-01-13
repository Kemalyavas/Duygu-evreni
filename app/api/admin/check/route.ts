import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Admin emails stored server-side only (not exposed to client)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }

    // Check database is_admin field first
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      return NextResponse.json({ isAdmin: true })
    }

    // Fallback to email check
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ isAdmin: true })
    }

    return NextResponse.json({ isAdmin: false })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
