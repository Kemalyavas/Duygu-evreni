import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runLocalFilter, getSuicidePreventionResources } from '@/lib/moderation/localFilter'
import { moderateWithGemini } from '@/lib/moderation/geminiModeration'

// ============================================
// TYPES
// ============================================

interface ModerationRequest {
  content: string
}

interface ModerationResponse {
  allowed: boolean
  reason?: string
  helpResources?: string
}

// ============================================
// AUTH HELPER
// ============================================

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================
// RATE LIMITER (per-user, in-memory)
// ============================================

const RATE_LIMIT_WINDOW_MS = 60_000 // 1 dakika
const RATE_LIMIT_MAX_REQUESTS = 10  // Dakikada max 10 istek

// userId -> { count, windowStart }
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

// Her 5 dakikada eski kayıtları temizle
let lastCleanup = Date.now()
function cleanupRateLimits() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return // 5 dk'dan sık temizleme
  lastCleanup = now
  for (const [key, value] of rateLimitMap) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(userId: string): boolean {
  cleanupRateLimits()
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // Yeni pencere
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false // Rate limit aşıldı
  }

  entry.count++
  return true
}

// ============================================
// CONTENT CACHE (aynı içerik tekrar Gemini'ye gitmesin)
// ============================================

const CACHE_TTL_MS = 300_000 // 5 dakika

interface CachedResult {
  response: ModerationResponse
  timestamp: number
}

const contentCache = new Map<string, CachedResult>()

let lastCacheCleanup = Date.now()
function cleanupCache() {
  const now = Date.now()
  if (now - lastCacheCleanup < 60_000) return
  lastCacheCleanup = now
  for (const [key, value] of contentCache) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      contentCache.delete(key)
    }
  }
}

// Basit hash fonksiyonu (content -> cache key)
function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // 32-bit integer
  }
  return hash.toString(36)
}

function getCachedResult(content: string): ModerationResponse | null {
  cleanupCache()
  const key = hashContent(content.trim().toLowerCase())
  const cached = contentCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.response
  }
  return null
}

function setCachedResult(content: string, response: ModerationResponse) {
  const key = hashContent(content.trim().toLowerCase())
  contentCache.set(key, { response, timestamp: Date.now() })
  // Cache boyutunu sınırla
  if (contentCache.size > 500) {
    const firstKey = contentCache.keys().next().value
    if (firstKey !== undefined) contentCache.delete(firstKey)
  }
}

// ============================================
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<ModerationResponse>> {
  try {
    // Auth check - only authenticated users can use moderation
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { allowed: false, reason: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { allowed: false, reason: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { allowed: false, reason: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' },
        { status: 429 }
      )
    }

    const body = await request.json() as ModerationRequest
    const { content } = body

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { allowed: false, reason: 'İçerik boş olamaz' },
        { status: 400 }
      )
    }

    if (content.length > 280) {
      return NextResponse.json(
        { allowed: false, reason: 'İçerik 280 karakterden fazla olamaz' },
        { status: 400 }
      )
    }

    // Check cache first (aynı içerik için tekrar Gemini'ye gitmemek)
    const cached = getCachedResult(content)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Step 1: Run local filter (fast, synchronous)
    const localResult = runLocalFilter(content)

    // If content should be blocked immediately (e.g., child abuse)
    if (localResult.blockImmediately) {
      const response: ModerationResponse = {
        allowed: false,
        reason: 'Bu içerik platformumuzda paylaşılamaz',
      }
      setCachedResult(content, response)
      return NextResponse.json(response)
    }

    // Step 2: If local filter triggered, run AI moderation
    if (localResult.requiresAIReview) {
      const geminiResult = await moderateWithGemini(
        content,
        localResult.triggeredCategories
      )

      if (!geminiResult.allowed) {
        const response: ModerationResponse = {
          allowed: false,
          reason: geminiResult.reason || 'Bu içerik platformumuzda paylaşılamaz',
        }

        // Add help resources for suicide-related blocks
        if (geminiResult.showHelpResources) {
          response.helpResources = getSuicidePreventionResources()
        }

        setCachedResult(content, response)
        return NextResponse.json(response)
      }

      // Check if we should show help resources even if allowed
      // (e.g., emotional content about difficult times)
      if (
        geminiResult.showHelpResources &&
        localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')
      ) {
        const response: ModerationResponse = {
          allowed: true,
          helpResources: getSuicidePreventionResources(),
        }
        setCachedResult(content, response)
        return NextResponse.json(response)
      }
    }

    // Content passed all checks
    const response: ModerationResponse = { allowed: true }
    setCachedResult(content, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Moderation API] Error:', error)

    // Fail-safe: On server errors, run local filter and use its result
    try {
      const body = await request.clone().json() as ModerationRequest
      const localResult = runLocalFilter(body.content || '')

      // If local filter says block, block it
      if (localResult.blockImmediately) {
        return NextResponse.json({
          allowed: false,
          reason: 'Bu içerik platformumuzda paylaşılamaz',
        })
      }

      // If local filter triggered categories that need review, be cautious
      if (localResult.requiresAIReview && localResult.triggeredCategories.length > 0) {
        // Block high-risk categories when AI is unavailable
        const highRiskCategories = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'CHILD_ABUSE']
        const hasHighRisk = localResult.triggeredCategories.some(cat => highRiskCategories.includes(cat))

        if (hasHighRisk) {
          const response: ModerationResponse = {
            allowed: false,
            reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          }

          // Show help resources for suicide-related content
          if (localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')) {
            response.helpResources = getSuicidePreventionResources()
          }

          return NextResponse.json(response)
        }
      }

      // Allow content that passed local filter
      return NextResponse.json({ allowed: true })
    } catch {
      // If even local filter fails, block for safety
      return NextResponse.json({
        allowed: false,
        reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
      })
    }
  }
}

// ============================================
// METADATA
// ============================================

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
