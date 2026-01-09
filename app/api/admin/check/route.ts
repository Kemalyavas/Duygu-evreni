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

    if (!user?.email) {
      return NextResponse.json({ isAdmin: false })
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email.toLowerCase())

    return NextResponse.json({ isAdmin })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
