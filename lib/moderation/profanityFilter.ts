// Turkish profanity word list (partial list for demonstration)
const TURKISH_PROFANITY = [
  'amk',
  'aq',
  'orospu',
  'piç',
  'siktir',
  'siktiğim',
  'gerizekalı',
  'aptal',
  'salak',
  'mal',
  'dangalak',
  'götveren',
  'ibne',
  'yavşak',
  'pezevenk',
  'kahpe',
]

// English profanity word list (partial list for demonstration)
const ENGLISH_PROFANITY = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'bastard',
  'damn',
  'crap',
  'dick',
  'cock',
  'pussy',
  'whore',
  'slut',
  'nigger',
  'faggot',
]

// Combine all profanity words
const ALL_PROFANITY = [...TURKISH_PROFANITY, ...ENGLISH_PROFANITY]

// Normalize text for better matching (remove special characters, normalize Turkish chars)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ı]/g, 'i')
    .replace(/[ğ]/g, 'g')
    .replace(/[ü]/g, 'u')
    .replace(/[ş]/g, 's')
    .replace(/[ö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[0-9]/g, (match) => {
      const map: Record<string, string> = {
        '0': 'o',
        '1': 'i',
        '3': 'e',
        '4': 'a',
        '5': 's',
        '7': 't',
        '8': 'b',
      }
      return map[match] || match
    })
    .replace(/[^a-z\s]/g, '')
}

export interface ProfanityCheckResult {
  hasProfanity: boolean
  matchedWords: string[]
}

export function checkProfanity(text: string): ProfanityCheckResult {
  const normalizedText = normalizeText(text)
  const words = normalizedText.split(/\s+/)
  const matchedWords: string[] = []

  for (const word of words) {
    for (const profanity of ALL_PROFANITY) {
      const normalizedProfanity = normalizeText(profanity)
      // Exact word match only (not substring)
      if (word === normalizedProfanity) {
        matchedWords.push(word)
      }
    }
  }

  // Check for profanity hidden with spaces (e.g., "f u c k" -> "fuck")
  // Only match if the spaced-out version is clearly intentional
  const textWithoutSpaces = normalizedText.replace(/\s/g, '')
  for (const profanity of ALL_PROFANITY) {
    const normalizedProfanity = normalizeText(profanity)
    // Check if the profanity appears as a standalone pattern
    // Must be at least 4 chars to avoid false positives
    if (normalizedProfanity.length >= 4 && textWithoutSpaces.includes(normalizedProfanity)) {
      // Verify it's not part of a legitimate word by checking original text
      const regex = new RegExp(`\\b${normalizedProfanity}\\b`, 'i')
      if (regex.test(normalizedText)) {
        if (!matchedWords.includes(profanity)) {
          matchedWords.push(profanity)
        }
      }
    }
  }

  return {
    hasProfanity: matchedWords.length > 0,
    matchedWords: [...new Set(matchedWords)],
  }
}
