import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cached supabase admin client
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseAdmin = createClient(url, key)
  return supabaseAdmin
}

function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim()
    return normalizeIP(ip)
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return normalizeIP(realIP)
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return normalizeIP(cfConnectingIP)
  }

  // Fallback
  return '0.0.0.0'
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

export async function POST(request: NextRequest) {
  try {
    // Get supabase admin client (will throw if env vars missing)
    let admin: SupabaseClient
    try {
      admin = getSupabaseAdmin()
    } catch {
      console.error('[IP Track] Missing environment variables')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await admin.auth.getUser(token)

    if (authError || !user) {
      console.error('[IP Track] Auth error:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = getClientIP(request)
    const now = new Date().toISOString()

    // Update last_ip in profiles
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        last_ip: ip,
        last_ip_updated_at: now
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('[IP Track] Profile update error:', profileError.message)
      // Don't fail the request, just log
    }

    // Add to IP history (upsert)
    const { error: historyError } = await admin
      .from('user_ip_history')
      .upsert({
        user_id: user.id,
        ip_address: ip,
        last_seen_at: now,
      }, {
        onConflict: 'user_id,ip_address',
      })

    if (historyError) {
      console.error('[IP Track] History upsert error:', historyError.message)
      // Don't fail the request, just log
    }

    return NextResponse.json({ success: true, ip })
  } catch (error) {
    console.error('[IP Track] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
