/**
 * Content Moderation Service
 *
 * This module provides the main entry point for content moderation.
 * It uses a two-tier approach:
 *
 * 1. Local Filter (fast, ~10ms):
 *    - Keyword-based detection
 *    - Immediate blocks for severe content
 *    - Triggers AI review for context-sensitive content
 *
 * 2. Gemini AI Review (when needed, ~500ms):
 *    - Context-aware analysis
 *    - Distinguishes intent (e.g., threat vs. expression)
 *    - Handles edge cases intelligently
 *
 * Flow:
 * Client → moderateContent() → API Route → Local Filter → (optional) Gemini → Result
 */

// ============================================
// TYPES
// ============================================

export interface ModerationResult {
  allowed: boolean
  reason?: string
  helpResources?: string
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Moderate user-submitted content
 *
 * @param content - The text content to moderate
 * @returns ModerationResult indicating if content is allowed
 *
 * @example
 * const result = await moderateContent("Bugün çok mutluyum!")
 * if (result.allowed) {
 *   // Proceed with submission
 * } else {
 *   // Show error: result.reason
 * }
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  // Basic validation (client-side, fast)
  if (!content || content.trim().length === 0) {
    return {
      allowed: false,
      reason: 'İçerik boş olamaz',
    }
  }

  if (content.length > 280) {
    return {
      allowed: false,
      reason: 'İçerik 280 karakterden fazla olamaz',
    }
  }

  try {
    // Call moderation API
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content.trim() }),
    })

    if (!response.ok) {
      // On API error, check if it returned a moderation result
      try {
        const errorData = await response.json()
        if (errorData.reason) {
          return {
            allowed: false,
            reason: errorData.reason,
          }
        }
      } catch {
        // If we can't parse error, fail open
        console.error('[Moderation] API returned error:', response.status)
      }

      // Fail open on server errors (allow content)
      return { allowed: true }
    }

    const result: ModerationResult = await response.json()
    return result
  } catch (error) {
    // Network error - fail open but log
    console.error('[Moderation] Network error:', error)
    return { allowed: true }
  }
}

// ============================================
// RE-EXPORTS
// ============================================

// Export local filter for direct use if needed
export { runLocalFilter, type LocalFilterResult, type FilterCategory } from './localFilter'

// Export profanity filter (legacy, kept for backward compatibility)
export { checkProfanity } from './profanityFilter'
