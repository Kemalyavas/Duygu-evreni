import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { runLocalFilter, getSuicidePreventionResources } from '@/lib/moderation/localFilter'
import { moderateWithGemini } from '@/lib/moderation/geminiModeration'

// ============================================
// TYPES
// ============================================

interface AnonymousStarRequest {
  content: string
  planet_id: string
  position_x: number
  position_y: number
  position_z: number
}

// ============================================
// SUPABASE ADMIN
// ============================================

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) return supabaseAdmin
  supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return supabaseAdmin
}

// ============================================
// IP RATE LIMIT (1 anonymous star per day per IP)
// ============================================

const ANON_DAILY_LIMIT = 1
const DAY_MS = 86_400_000

// ip -> { count, dayStart }
const anonRateLimitMap = new Map<string, { count: number; dayStart: number }>()

let lastCleanup = Date.now()
function cleanupRateLimits() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return
  lastCleanup = now
  for (const [key, value] of anonRateLimitMap) {
    if (now - value.dayStart > DAY_MS * 2) {
      anonRateLimitMap.delete(key)
    }
  }
}

function checkAnonRateLimit(ip: string): boolean {
  cleanupRateLimits()
  const now = Date.now()
  const entry = anonRateLimitMap.get(ip)

  if (!entry || now - entry.dayStart > DAY_MS) {
    anonRateLimitMap.set(ip, { count: 1, dayStart: now })
    return true
  }

  if (entry.count >= ANON_DAILY_LIMIT) {
    return false
  }

  entry.count++
  return true
}

// ============================================
// ANONYMOUS USER (lazy creation)
// ============================================

const ANON_EMAIL = 'system-anonymous@duygu-evreni.internal'
let cachedAnonUserId: string | null = null

async function getOrCreateAnonymousUser(admin: SupabaseClient): Promise<string> {
  if (cachedAnonUserId) return cachedAnonUserId

  // Try to find existing anonymous user by looking up profiles
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('username', '__anonymous__')
    .single()

  if (existingProfile) {
    cachedAnonUserId = existingProfile.id as string
    return cachedAnonUserId
  }

  // Create anonymous user in auth
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: ANON_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { is_system_anonymous: true },
  })

  if (authError || !authData.user) {
    // Maybe already exists in auth but not in profiles? Try to fetch by email
    const { data: { users } } = await admin.auth.admin.listUsers()
    const anonUser = users.find(u => u.email === ANON_EMAIL)
    if (anonUser) {
      // Ensure profile exists
      await admin.from('profiles').upsert({
        id: anonUser.id,
        username: '__anonymous__',
        daily_stars_added: 0,
        daily_views_used: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
      }, { onConflict: 'id' })

      cachedAnonUserId = anonUser.id
      return cachedAnonUserId
    }
    throw new Error('Anonymous user oluşturulamadı')
  }

  // Create profile for anonymous user
  await admin.from('profiles').upsert({
    id: authData.user.id,
    username: '__anonymous__',
    daily_stars_added: 0,
    daily_views_used: 0,
    last_reset_date: new Date().toISOString().split('T')[0],
  }, { onConflict: 'id' })

  cachedAnonUserId = authData.user.id
  return cachedAnonUserId
}

// ============================================
// HELPERS
// ============================================

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim()
    return normalizeIP(ip)
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) return normalizeIP(realIP)
  const cfIP = request.headers.get('cf-connecting-ip')
  if (cfIP) return normalizeIP(cfIP)
  return '0.0.0.0'
}

function normalizeIP(ip: string): string {
  if (ip.startsWith('::ffff:')) return ip.substring(7)
  if (ip === '::1') return '127.0.0.1'
  return ip
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin()

    // IP check
    const ip = getClientIP(request)
    if (!checkAnonRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Giriş yapmadan günde sadece 1 yıldız paylaşabilirsin. Daha fazlası için kayıt ol!' },
        { status: 429 }
      )
    }

    // Parse body
    const body = await request.json() as AnonymousStarRequest
    const { content, planet_id, position_x, position_y, position_z } = body

    // Validate
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'İçerik boş olamaz' }, { status: 400 })
    }
    if (content.length > 280) {
      return NextResponse.json({ error: 'İçerik 280 karakterden fazla olamaz' }, { status: 400 })
    }
    if (!planet_id) {
      return NextResponse.json({ error: 'Gezegen seçilmeli' }, { status: 400 })
    }

    // Verify planet exists
    const { data: planet } = await admin
      .from('planets')
      .select('id')
      .eq('id', planet_id)
      .single()

    if (!planet) {
      return NextResponse.json({ error: 'Geçersiz gezegen' }, { status: 400 })
    }

    // Server-side moderation (no auth needed - we run it directly)
    const localResult = runLocalFilter(content)

    if (localResult.blockImmediately) {
      return NextResponse.json({
        error: 'Bu içerik platformumuzda paylaşılamaz',
      }, { status: 403 })
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

        // Show help resources even if allowed
        if (geminiResult.showHelpResources && localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')) {
          // Will add helpResources to success response below
        }
      } catch {
        // Gemini failed - block high-risk, allow others
        const highRisk = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'CHILD_ABUSE']
        if (localResult.triggeredCategories.some(cat => highRisk.includes(cat))) {
          return NextResponse.json({
            error: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          }, { status: 503 })
        }
      }
    }

    // Get or create anonymous user
    const anonymousUserId = await getOrCreateAnonymousUser(admin)

    // Insert star with service role (bypasses RLS)
    const { data: star, error: insertError } = await admin
      .from('stars')
      .insert({
        user_id: anonymousUserId,
        planet_id,
        content: content.trim(),
        position_x: position_x ?? 0,
        position_y: position_y ?? 0,
        position_z: position_z ?? 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Anonymous Star] Insert error:', insertError)
      return NextResponse.json({ error: 'Yıldız oluşturulamadı' }, { status: 500 })
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://duygu-evreni.com'
    const shareUrl = `${baseUrl}/?planet=${planet_id}&star=${star.id}`

    return NextResponse.json({
      star,
      shareUrl,
      helpResources: localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')
        ? getSuicidePreventionResources()
        : undefined,
    })
  } catch (error) {
    console.error('[Anonymous Star] Error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
