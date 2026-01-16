import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_STATUSES = new Set(['pending', 'reviewed', 'action_taken', 'dismissed'])

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]
  const supabaseAdmin = getSupabaseAdmin()
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { supabaseAdmin, user }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const { supabaseAdmin } = auth
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (reportsError) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    const ids = Array.from(new Set((reports || [])
      .flatMap(report => [report.reporter_id, report.reported_user_id])
      .filter(Boolean)))

    let profilesMap = new Map<string, { id: string; username: string | null; email: string | null }>()

    if (ids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username, email')
        .in('id', ids)

      profilesMap = new Map((profiles || []).map(profile => [profile.id, profile]))
    }

    const enriched = (reports || []).map(report => ({
      ...report,
      reporter: profilesMap.get(report.reporter_id) || null,
      reported: profilesMap.get(report.reported_user_id) || null,
    }))

    return NextResponse.json({ reports: enriched })
  } catch (error) {
    console.error('[Admin Reports] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if ('error' in auth) return auth.error

    const { supabaseAdmin } = auth
    const body = await request.json()
    const { id, status } = body || {}

    if (!id || !status || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ report: data })
  } catch (error) {
    console.error('[Admin Reports] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
