import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return '0.0.0.0'
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)

    // Check if IP is banned
    const { data: bannedIP } = await supabaseAdmin
      .from('banned_ips')
      .select('id, reason')
      .eq('ip_address', ip)
      .single()

    if (bannedIP) {
      return NextResponse.json({
        banned: true,
        reason: bannedIP.reason || 'Bu IP adresi engellenmiş'
      })
    }

    return NextResponse.json({ banned: false })
  } catch (error) {
    console.error('[IP Check] Error:', error)
    return NextResponse.json({ banned: false })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
