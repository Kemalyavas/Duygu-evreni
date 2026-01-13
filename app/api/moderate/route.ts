import { NextRequest, NextResponse } from 'next/server'
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
// API ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<ModerationResponse>> {
  try {
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

    // Step 1: Run local filter (fast, synchronous)
    const localResult = runLocalFilter(content)

    // If content should be blocked immediately (e.g., child abuse)
    if (localResult.blockImmediately) {
      return NextResponse.json({
        allowed: false,
        reason: 'Bu içerik platformumuzda paylaşılamaz',
      })
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

        return NextResponse.json(response)
      }

      // Check if we should show help resources even if allowed
      // (e.g., emotional content about difficult times)
      if (
        geminiResult.showHelpResources &&
        localResult.triggeredCategories.includes('SUICIDE_SELF_HARM')
      ) {
        return NextResponse.json({
          allowed: true,
          helpResources: getSuicidePreventionResources(),
        })
      }
    }

    // Content passed all checks
    return NextResponse.json({ allowed: true })
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
