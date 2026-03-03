import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy-load supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Normalize IP address (handle IPv4-mapped IPv6 addresses)
function normalizeIP(ip: string): string {
  // Handle IPv4-mapped IPv6 (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }
  // Handle localhost IPv6
  if (ip === '::1') {
    return '127.0.0.1'
  }
  return ip
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return normalizeIP(forwardedFor.split(',')[0].trim())
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return normalizeIP(realIP)
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return normalizeIP(cfConnectingIP)
  }

  return '0.0.0.0'
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request)

    // Check if IP is banned
    const { data: bannedIP } = await getSupabaseAdmin()
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
