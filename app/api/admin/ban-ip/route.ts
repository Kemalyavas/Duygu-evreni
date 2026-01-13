import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy-load supabase admin client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST: Ban an IP
export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { ip_address, reason, user_id } = body

    // If user_id provided, get all their IPs and ban them
    if (user_id) {
      const { data: ipHistory } = await getSupabaseAdmin()
        .from('user_ip_history')
        .select('ip_address')
        .eq('user_id', user_id)

      if (ipHistory && ipHistory.length > 0) {
        const bans = ipHistory.map(h => ({
          ip_address: h.ip_address,
          reason: reason || `Kullanıcı banı: ${user_id}`,
          banned_by: user.id,
        }))

        await getSupabaseAdmin()
          .from('banned_ips')
          .upsert(bans, { onConflict: 'ip_address' })

        // Also ban the user
        await getSupabaseAdmin().auth.admin.updateUserById(user_id, {
          ban_duration: 'none', // Permanent
          user_metadata: { banned: true }
        })

        // Set banned_until to infinity
        try {
          await getSupabaseAdmin().rpc('ban_user_permanently', { target_user_id: user_id })
        } catch {
          // RPC might not exist, ignore
        }

        return NextResponse.json({
          success: true,
          banned_ips: ipHistory.map(h => h.ip_address)
        })
      }
    }

    // Single IP ban
    if (ip_address) {
      await getSupabaseAdmin()
        .from('banned_ips')
        .upsert({
          ip_address,
          reason,
          banned_by: user.id,
        }, { onConflict: 'ip_address' })

      return NextResponse.json({ success: true, banned_ip: ip_address })
    }

    return NextResponse.json({ error: 'ip_address or user_id required' }, { status: 400 })
  } catch (error) {
    console.error('[Ban IP] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE: Unban an IP
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const ip_address = searchParams.get('ip')

    if (!ip_address) {
      return NextResponse.json({ error: 'ip required' }, { status: 400 })
    }

    await getSupabaseAdmin()
      .from('banned_ips')
      .delete()
      .eq('ip_address', ip_address)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Unban IP] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET: List banned IPs
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: bannedIPs } = await getSupabaseAdmin()
      .from('banned_ips')
      .select('*')
      .order('created_at', { ascending: false })

    return NextResponse.json({ banned_ips: bannedIPs || [] })
  } catch (error) {
    console.error('[List Banned IPs] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
