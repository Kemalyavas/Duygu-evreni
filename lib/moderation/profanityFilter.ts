/**
 * Legacy Profanity Filter
 *
 * NOTE: This filter is now DISABLED by default.
 * The platform allows profanity as a form of emotional expression.
 *
 * Kept for backward compatibility and potential future use.
 */

export interface ProfanityCheckResult {
  hasProfanity: boolean
  matchedWords: string[]
}

/**
 * Check for profanity in text
 *
 * @deprecated Platform now allows profanity for emotional expression
 * @param _text - The text to check
 * @returns Always returns no profanity (filter disabled)
 */
export function checkProfanity(_text: string): ProfanityCheckResult {
  // Profanity filter disabled - platform allows emotional expression including profanity
  return {
    hasProfanity: false,
    matchedWords: [],
  }
}
