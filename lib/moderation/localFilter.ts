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
  // ==========================================
  // ATATÜRK (protected by law - 5816 sayılı kanun)
  // ==========================================
  'atatürk',
  'ataturk',
  'ata türk',
  'mustafa kemal',
  'm kemal',
  'mkemal',
  'mk atatürk',
  'gazi mustafa',
  'gazi paşa',
  'gazi pasa',
  'atam',

  // ==========================================
  // CUMHURBAŞKANI - ERDOĞAN
  // ==========================================
  'cumhurbaşkan',
  'cumhurbaskani',
  'erdoğan',
  'erdogan',
  'tayyip',
  'tayip',
  'tayib',
  'tayyib',
  'rte',
  // 'reis' bırakıldı - siyasi bağlamda çok kullanılıyor, matchWordStart ile "reisçi" vb. yakalanır
  'reis',
  'recep tayyip',
  'r t e',
  'reisicumhur',
  'cb erdogan',
  'uzun adam',

  // ==========================================
  // ANA MUHALEFET - CHP
  // ==========================================
  'kılıçdaroğlu',
  'kilicdaroglu',
  'kılıçdar',
  'kilicdar',
  'kemal kılıçdaroğlu',
  // 'kk' çıkarıldı - çok kısa, false positive ("ok" gibi eşleşiyor)
  'özgür özel',
  'ozgur ozel',
  // 'özel' çıkarıldı - "özel gün", "özel biri" gibi günlük kullanımda çok yaygın

  // ==========================================
  // MHP
  // ==========================================
  'bahçeli',
  'bahceli',
  'devlet bahçeli',
  'devlet bahceli',
  // 'db' çıkarıldı - "database" kısaltması, çok kısa

  // ==========================================
  // İYİ PARTİ
  // ==========================================
  'akşener',
  'aksener',
  'meral akşener',
  'meral aksener',

  // ==========================================
  // İSTANBUL - ANKARA BELEDİYE
  // ==========================================
  'imamoğlu',
  'imamoglu',
  'imamson',
  'imam son',
  'ekrem imamoğlu',
  'ekrem imamoglu',
  // 'ekrem' bırakıldı - isim olarak yaygın ama siyasi bağlamda da çok kullanılıyor
  'ekrem',
  'ibb başkan',
  'ibb baskani',
  'mansur yavaş',
  'mansur yavas',
  'mansur',
  'abb başkan',

  // ==========================================
  // DİĞER SİYASİLER
  // ==========================================
  'süleyman soylu',
  'suleyman soylu',
  // 'soylu' çıkarıldı - "soylu bir insan" (noble) gibi günlük kullanım
  'binali yıldırım',
  'binali yildirim',
  'ali babacan',
  'babacan',
  'ahmet davutoğlu',
  'davutoglu',
  'davutoğlu',
  'temel karamollaoğlu',
  'karamollaoğlu',
  'fatih erbakan',
  'erbakan',
  'necmettin erbakan',
  'ümit özdağ',
  'umit ozdag',
  'özdağ',
  'ozdag',
  'sinan oğan',
  'sinan ogan',
  'muharrem ince',
  'muharrem ınce',
  // 'ince' çıkarıldı - "ince düşünceli", "ince belli" gibi günlük kullanımda çok yaygın
  'selahattin demirtaş',
  'demirtas',
  'demirtaş',
  'selo',
  'pervin buldan',
  'buldan',
  'meral danış beştaş',
  'tansu çiller',
  'tansu ciller',
  'çiller',
  'mesut yılmaz',
  'bülent ecevit',
  'ecevit',
  'demirel',
  'süleyman demirel',
  'turgut özal',
  'özal',

  // ==========================================
  // PARTİLER
  // ==========================================
  'akp',
  'ak parti',
  'akparti',
  'a k p',
  'chp',
  'c h p',
  'mhp',
  'm h p',
  'iyi parti',
  'iyip',
  'iyi p',
  'hdp',
  'h d p',
  'dem parti',
  'demparti',
  'saadet partisi',
  'saadet',
  // 'sp' çıkarıldı - "spor", "sponsor" gibi kelimeleri yakalar (matchWordStart ile)
  'yeniden refah',
  'refah partisi',
  'zafer partisi',
  // 'zp' çıkarıldı - çok kısa
  'deva partisi',
  // 'deva' çıkarıldı - "deva bulmak", "deva olmak" gibi günlük kullanım
  'gelecek partisi',
  'memleket partisi',
  'tdp',
  // 'tip' çıkarıldı - "tip" (tür/görünüş), "tipik" gibi günlük kullanım
  'türkiye işçi partisi',
  'vatan partisi',
  'doğu perinçek',
  'perincek',

  // ==========================================
  // KURUMLAR
  // ==========================================
  'tbmm',
  't b m m',
  'meclis',
  'anayasa mahkemesi',
  'aym',
  'yargıtay',
  'yargitay',
  'danıştay',
  'danistay',
  'sayıştay',
  'hsyk',
  'hakimler savcılar',

  // ==========================================
  // GENEL TERİMLER
  // ==========================================
  'cumhurbaşkanlığı',
  'başbakan',
  'basbakan',
  'milletvekil',
  // 'mv' çıkarıldı - çok kısa
  // 'bakan' çıkarıldı - "bakarak", "bakanım" (sevgi), "bakan" (looking) çok yaygın
  'bakanlık',
  'vali',
  'kaymakam',
]

/**
 * Violence and Threat Keywords
 * Trigger AI review for context
 */
/**
 * Violence/Death Keywords
 * Any word containing öl/ol patterns - sent to Gemini for context
 * "babam öldü" → allowed, "seni öldüreyim" → blocked
 */
const VIOLENCE_KEYWORDS = [
  // Will be supplemented by pattern matching for öl/ol
  'geber',
  'gebertir',
  'gebersin',
  'gebermeli',
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
  // Rape/assault slang
  'zorla becer',
  'zorla sik',
  'zorla yat',
  'zorla soy',
  'ırzına geç',
  'irzina gec',
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
    // Normalize Unicode (decomposed → composed)
    .normalize('NFC')
    // Handle ALL variations of Turkish İ/I before toLowerCase
    .replace(/\u0130/g, 'i')  // İ (Turkish capital I with dot)
    .replace(/\u0049/g, 'i')  // I (regular capital I)
    .replace(/İ/g, 'i')       // Belt and suspenders
    .replace(/I/g, 'i')
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
    // Remove obfuscation characters (*, -, _, ., etc.)
    .replace(/[*\-_.,!?#$%^&()+=~`'"]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if text contains any of the keywords
 * Uses fuzzy matching for Turkish text
 */
function containsKeywords(text: string, keywords: string[], matchWordStart = false): string[] {
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
    } else if (matchWordStart) {
      // Match words that START with the keyword (for verb stems like gebertir → gebertiririm)
      const regex = new RegExp(`(^|\\s)${normalizedKeyword}`, 'i')
      if (regex.test(normalizedText)) {
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
/**
 * Check if text contains death-related patterns (öl/ol variations)
 * Catches: öldür, öldü, ölecek, oldur, oldu, etc.
 */
function containsDeathPattern(text: string): boolean {
  const normalizedText = normalizeText(text)
  // Pattern: öl or ol followed by common Turkish suffixes
  // This catches: öl, öldür, öldü, ölecek, ölmek, ölsün, ölüm, etc.
  const deathPattern = /[oö]l[düumsncekry]|[oö]l($|\s)|[oö]lur|[oö]lec|[oö]ley/i
  return deathPattern.test(normalizedText)
}

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
  // matchWordStart = true: Türkçe ekleri yakalamak için (rteyi, erdogana, tayyibe vb.)
  const politicalMatches = containsKeywords(content, POLITICAL_FIGURES_KEYWORDS, true)
  if (politicalMatches.length > 0) {
    result.requiresAIReview = true
    result.triggeredCategories.push('POLITICAL_FIGURES')
    result.matchedTerms.push(...politicalMatches)
  }

  // Check for death-related patterns (öl/ol) - requires AI review for context
  // "babam öldü" → allowed, "seni öldüreyim" → blocked
  if (containsDeathPattern(content)) {
    result.requiresAIReview = true
    result.triggeredCategories.push('VIOLENCE_THREATS')
    result.matchedTerms.push('öl/ol pattern')
  }

  // Also check explicit violence keywords (geber, etc.)
  const violenceMatches = containsKeywords(content, VIOLENCE_KEYWORDS, true) // matchWordStart for verb conjugations
  if (violenceMatches.length > 0) {
    result.requiresAIReview = true
    if (!result.triggeredCategories.includes('VIOLENCE_THREATS')) {
      result.triggeredCategories.push('VIOLENCE_THREATS')
    }
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
