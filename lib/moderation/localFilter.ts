/**
 * Local Content Filter
 * Fast, offline filtering for sensitive content detection
 *
 * Strategy:
 * - BLOCK_IMMEDIATELY: Content that should be blocked without AI review
 * - REQUIRES_AI_REVIEW: Content that needs context analysis via Gemini
 */

// ============================================
// FILTER CATEGORIES
// ============================================

export type FilterCategory =
  | 'SUICIDE_SELF_HARM'
  | 'POLITICAL_FIGURES'
  | 'VIOLENCE_THREATS'
  | 'CHILD_ABUSE'
  | 'SEXUAL_EXPLICIT'

export interface LocalFilterResult {
  requiresAIReview: boolean
  blockImmediately: boolean
  triggeredCategories: FilterCategory[]
  matchedTerms: string[]
}

// ============================================
// KEYWORD LISTS
// ============================================

/**
 * Suicide and Self-Harm Keywords (Turkish)
 * These trigger AI review for context analysis
 */
const SUICIDE_SELF_HARM_KEYWORDS = [
  // Direct terms
  'intihar',
  'intihara',
  'intiharı',

  // Self-harm phrases
  'kendimi öldür',
  'kendini öldür',
  'kendimi öldürme',
  'kendini öldürme',
  'kendimi öldürmek',
  'kendini öldürmek',
  'kendime zarar',
  'kendine zarar',

  // Death wishes
  'ölmek istiyorum',
  'ölmek istiyor',
  'yaşamak istemiyorum',
  'yaşamak istemiyor',
  'hayatıma son',
  'hayatına son',

  // Specific methods (for detection, not instruction)
  'canıma kıy',
  'canına kıy',
  'kendimi as',
  'kendini as',
  'damarlarımı kes',
  'damarlarını kes',
  'köprüden atla',
  'intihar et',

  // Related terms
  'öldürmek istiyorum kendimi',
  'artık yaşamak',
  'hayatımı sonlandır',
  'son vermek istiyorum',
]

/**
 * Turkish Political Figures and Institutions
 * These trigger AI review to distinguish criticism from hate speech
 */
const POLITICAL_FIGURES_KEYWORDS = [
  // Ataturk (protected by law)
  'atatürk',
  'ataturk',
  'mustafa kemal',
  'm. kemal',
  'gazi mustafa',
  'gazi paşa',

  // Current President
  'cumhurbaşkan',
  'erdoğan',
  'erdogan',
  'tayyip',
  'rte',
  'reis',
  'recep tayyip',

  // Major Political Leaders
  'kılıçdaroğlu',
  'kilicdaroglu',
  'kemal kılıçdaroğlu',
  'bahçeli',
  'bahceli',
  'devlet bahçeli',
  'akşener',
  'aksener',
  'meral akşener',
  'imamoğlu',
  'imamoglu',
  'ekrem imamoğlu',
  'mansur yavaş',
  'mansur yavas',

  // Political Parties
  'akp',
  'ak parti',
  'chp',
  'mhp',
  'iyi parti',
  'iyip',
  'hdp',
  'dem parti',
  'saadet',
  'yeniden refah',
  'zafer partisi',

  // State Institutions (when combined with negative content)
  'tbmm',
  'meclis',
  'anayasa mahkemesi',
  'yargıtay',
  'danıştay',

  // Government terms
  'bakan',
  'bakanlık',
  'başbakan',
  'milletvekil',
]

/**
 * Violence and Threat Keywords
 * Trigger AI review for context
 */
const VIOLENCE_KEYWORDS = [
  // Death threats
  'öldüreceğim',
  'öldürürüm',
  'öldürmek',
  'öldürücü',
  'geberteceğim',
  'gebertir',

  // Physical violence
  'döveceğim',
  'döverim',
  'kafasını kır',
  'kafasını ez',
  'kafasını kes',
  'boğazını kes',
  'bıçaklayacağım',
  'vuracağım',
  'vurucu',

  // Arson/bombing
  'yakacağım',
  'yakarım',
  'ateşe ver',
  'bomba',
  'bombalayacağım',
  'patlat',
  'patlatacağım',

  // Terror-related
  'saldıracağım',
  'saldırı',
  'terör',
  'terörist',
  'eylem yapacağım',

  // General threats
  'canına oku',
  'hesabını sor',
  'intikam',
  'öcünü al',
]

/**
 * Child Abuse Keywords
 * IMMEDIATE BLOCK - No AI review needed
 */
const CHILD_ABUSE_KEYWORDS = [
  'pedofil',
  'pedofili',
  'çocuk pornosu',
  'çocuk istismar',
  'küçük çocuk',
  'reşit olmayan',
]

/**
 * Sexually Explicit Keywords
 * Trigger AI review for context (romantic vs explicit)
 */
const SEXUAL_EXPLICIT_KEYWORDS = [
  'tecavüz',
  'taciz',
  'zorla ilişki',
  'zorla seks',
  'cinsel saldırı',
  'cinsel istismar',
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normalize Turkish text for matching
 * Handles Turkish characters and common obfuscation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    // Normalize Turkish characters
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    // Common number substitutions
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/@/g, 'a')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if text contains any of the keywords
 * Uses fuzzy matching for Turkish text
 */
function containsKeywords(text: string, keywords: string[]): string[] {
  const normalizedText = normalizeText(text)
  const matched: string[] = []

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword)

    // Check for keyword presence (as substring for phrases, word boundary for single words)
    if (normalizedKeyword.includes(' ')) {
      // Multi-word phrase - check as substring
      if (normalizedText.includes(normalizedKeyword)) {
        matched.push(keyword)
      }
    } else {
      // Single word - check with word boundaries
      const regex = new RegExp(`(^|\\s|[^a-z])${normalizedKeyword}($|\\s|[^a-z])`, 'i')
      if (regex.test(normalizedText)) {
        matched.push(keyword)
      }
    }
  }

  return matched
}

// ============================================
// MAIN FILTER FUNCTION
// ============================================

/**
 * Run local content filter
 * Fast, synchronous check that determines if AI review is needed
 *
 * @param content - The user-submitted content to check
 * @returns LocalFilterResult with filter decisions
 */
export function runLocalFilter(content: string): LocalFilterResult {
  const result: LocalFilterResult = {
    requiresAIReview: false,
    blockImmediately: false,
    triggeredCategories: [],
    matchedTerms: [],
  }

  // Check for child abuse content - IMMEDIATE BLOCK
  const childAbuseMatches = containsKeywords(content, CHILD_ABUSE_KEYWORDS)
  if (childAbuseMatches.length > 0) {
    result.blockImmediately = true
    result.triggeredCategories.push('CHILD_ABUSE')
    result.matchedTerms.push(...childAbuseMatches)
    return result // No need to check further
  }

  // Check suicide/self-harm - requires AI review
  const suicideMatches = containsKeywords(content, SUICIDE_SELF_HARM_KEYWORDS)
  if (suicideMatches.length > 0) {
    result.requiresAIReview = true
    result.triggeredCategories.push('SUICIDE_SELF_HARM')
    result.matchedTerms.push(...suicideMatches)
  }

  // Check political figures - requires AI review
  const politicalMatches = containsKeywords(content, POLITICAL_FIGURES_KEYWORDS)
  if (politicalMatches.length > 0) {
    result.requiresAIReview = true
    result.triggeredCategories.push('POLITICAL_FIGURES')
    result.matchedTerms.push(...politicalMatches)
  }

  // Check violence threats - requires AI review
  const violenceMatches = containsKeywords(content, VIOLENCE_KEYWORDS)
  if (violenceMatches.length > 0) {
    result.requiresAIReview = true
    result.triggeredCategories.push('VIOLENCE_THREATS')
    result.matchedTerms.push(...violenceMatches)
  }

  // Check sexual explicit content - requires AI review
  const sexualMatches = containsKeywords(content, SEXUAL_EXPLICIT_KEYWORDS)
  if (sexualMatches.length > 0) {
    result.requiresAIReview = true
    result.triggeredCategories.push('SEXUAL_EXPLICIT')
    result.matchedTerms.push(...sexualMatches)
  }

  return result
}

/**
 * Get help resources for suicide/self-harm content
 * Returns appropriate hotline information
 */
export function getSuicidePreventionResources(): string {
  return 'Yardıma ihtiyacın varsa: 182 (İntihar Önleme Hattı) veya 112\'yi arayabilirsin. Yalnız değilsin.'
}
