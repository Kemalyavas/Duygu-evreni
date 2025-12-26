import { checkProfanity } from './profanityFilter'
// import { moderateWithOpenAI } from './openaiModeration' // Uncomment when ready

export interface ModerationResult {
  allowed: boolean
  reason?: string
}

// Configuration flag - switch to true when OpenAI is integrated
const USE_OPENAI_MODERATION = false

export async function moderateContent(text: string): Promise<ModerationResult> {
  // Basic validation
  if (!text || text.trim().length === 0) {
    return {
      allowed: false,
      reason: 'İçerik boş olamaz',
    }
  }

  if (text.length > 280) {
    return {
      allowed: false,
      reason: 'İçerik 280 karakterden fazla olamaz',
    }
  }

  // If OpenAI moderation is enabled, use it
  if (USE_OPENAI_MODERATION) {
    // const openAIResult = await moderateWithOpenAI(text)
    // if (!openAIResult.allowed) {
    //   return {
    //     allowed: false,
    //     reason: openAIResult.reason || 'İçerik uygun değil',
    //   }
    // }
  }

  // Basic profanity filter (MVP)
  const profanityResult = checkProfanity(text)

  if (profanityResult.hasProfanity) {
    return {
      allowed: false,
      reason: 'Uygunsuz içerik tespit edildi',
    }
  }

  return {
    allowed: true,
  }
}

export { checkProfanity } from './profanityFilter'
