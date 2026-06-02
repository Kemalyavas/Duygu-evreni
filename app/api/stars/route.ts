import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { runLocalFilter, getSuicidePreventionResources } from '@/lib/moderation/localFilter'
import { moderateWithGemini } from '@/lib/moderation/geminiModeration'

// ============================================
// Authenticated star creation with SERVER-SIDE moderation.
//
// This route exists so that content moderation for logged-in users runs on the
// server (it cannot be skipped by the client), mirroring the anonymous route.
// The DB trigger `check_daily_star_limit` still enforces the 3/day cap.
//
// NOTE: To fully close the bypass, RLS on `stars` must forbid direct client
// INSERTs so every star is forced through this route (see the accompanying
// migration `002_lock_down_star_inserts.sql`). Deploy the two together.
// ============================================

interface StarRequest {
  content: string
  planet_id: string
  position_x: number
  position_y: number
  position_z: number
}

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()

    // Auth: verify the bearer token server-side
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
    }
    const { data: { user }, error: userError } = await admin.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Oturum geçersiz. Lütfen tekrar giriş yapın.' }, { status: 401 })
    }

    // Parse + validate body
    const body = await request.json() as StarRequest
    const { content, planet_id, position_x, position_y, position_z } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'İçerik boş olamaz' }, { status: 400 })
    }
    if (content.length > 280) {
      return NextResponse.json({ error: 'İçerik 280 karakterden fazla olamaz' }, { status: 400 })
    }
    if (!planet_id) {
      return NextResponse.json({ error: 'Gezegen seçilmeli' }, { status: 400 })
    }

    // Verify the planet exists
    const { data: planet } = await admin
      .from('planets')
      .select('id')
      .eq('id', planet_id)
      .single()

    if (!planet) {
      return NextResponse.json({ error: 'Geçersiz gezegen' }, { status: 400 })
    }

    // Server-side moderation (identical policy to the anonymous route)
    const localResult = runLocalFilter(content)

    if (localResult.blockImmediately) {
      return NextResponse.json({ error: 'Bu içerik platformumuzda paylaşılamaz' }, { status: 403 })
    }

    if (localResult.requiresAIReview) {
      try {
        const geminiResult = await moderateWithGemini(content, localResult.triggeredCategories)

        if (!geminiResult.allowed) {
          const response: { error: string; helpResources?: string } = {
            error: geminiResult.reason || 'Bu içerik platformumuzda paylaşılamaz',
          }
          if (geminiResult.showHelpResources) {
            response.helpResources = getSuicidePreventionResources()
          }
          return NextResponse.json(response, { status: 403 })
        }
      } catch {
        // Gemini unavailable — block high-risk categories, allow the rest.
        const highRisk = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'CHILD_ABUSE']
        if (localResult.triggeredCategories.some(cat => highRisk.includes(cat))) {
          return NextResponse.json({
            error: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          }, { status: 503 })
        }
      }
    }

    // Insert attributed to the verified user. The check_daily_star_limit trigger
    // enforces the daily cap and raises an exception when it is exceeded.
    const { data: star, error: insertError } = await admin
      .from('stars')
      .insert({
        user_id: user.id,
        planet_id,
        content: content.trim(),
        position_x: position_x ?? 0,
        position_y: position_y ?? 0,
        position_z: position_z ?? 0,
      })
      .select()
      .single()

    if (insertError) {
      const msg = (insertError.message || '').toLowerCase()
      if (msg.includes('limit') || msg.includes('günlük')) {
        return NextResponse.json(
          { error: 'Günlük yıldız limitine ulaştınız (3/gün)' },
          { status: 429 }
        )
      }
      console.error('[Star] Insert error:', insertError)
      return NextResponse.json({ error: 'Yıldız oluşturulamadı' }, { status: 500 })
    }

    return NextResponse.json({
      star,
      // Surface the help line even when the post is allowed, if it mentioned self-harm.
      helpResources: localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')
        ? getSuicidePreventionResources()
        : undefined,
    })
  } catch (error) {
    console.error('[Star] Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
