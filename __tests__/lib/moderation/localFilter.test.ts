import { describe, it, expect } from 'vitest'
import { runLocalFilter, getSuicidePreventionResources } from '@/lib/moderation/localFilter'

/**
 * Regression tests for the local content filter — the security-critical first
 * layer of moderation. These lock in the current behaviour AND document two
 * known weaknesses (the over-broad öl/ol death pattern and the spaced-letter
 * bypass) so any future change to them is intentional and visible.
 */

describe('runLocalFilter — clean content', () => {
  it('allows an ordinary love message with no flags', () => {
    const r = runLocalFilter('Seni çok seviyorum')
    expect(r.blockImmediately).toBe(false)
    expect(r.requiresAIReview).toBe(false)
    expect(r.triggeredCategories).toEqual([])
    expect(r.matchedTerms).toEqual([])
  })

  it('allows a neutral positive sentence', () => {
    const r = runLocalFilter('Bugün harika hissediyorum')
    expect(r.requiresAIReview).toBe(false)
    expect(r.blockImmediately).toBe(false)
    expect(r.triggeredCategories).toEqual([])
  })

  it('treats empty and whitespace-only input as clean', () => {
    for (const input of ['', '   ', '\n\t']) {
      const r = runLocalFilter(input)
      expect(r.blockImmediately).toBe(false)
      expect(r.requiresAIReview).toBe(false)
      expect(r.triggeredCategories).toEqual([])
    }
  })
})

describe('runLocalFilter — child abuse (immediate block)', () => {
  it('blocks immediately on a CSAM keyword', () => {
    const r = runLocalFilter('pedofil')
    expect(r.blockImmediately).toBe(true)
    expect(r.triggeredCategories).toContain('CHILD_ABUSE')
    expect(r.matchedTerms).toContain('pedofil')
  })

  it('blocks a multi-word CSAM phrase', () => {
    const r = runLocalFilter('çocuk pornosu paylaşıyorum')
    expect(r.blockImmediately).toBe(true)
    expect(r.triggeredCategories).toContain('CHILD_ABUSE')
  })

  it('short-circuits: CSAM block does not evaluate other categories', () => {
    // "intihar" would normally trigger SUICIDE_SELF_HARM, but CSAM returns early.
    const r = runLocalFilter('pedofil intihar')
    expect(r.blockImmediately).toBe(true)
    expect(r.triggeredCategories).toEqual(['CHILD_ABUSE'])
    expect(r.triggeredCategories).not.toContain('SUICIDE_SELF_HARM')
  })
})

describe('runLocalFilter — suicide / self-harm (AI review)', () => {
  it('flags a direct suicide keyword for AI review (not an immediate block)', () => {
    const r = runLocalFilter('intihar etmeyi düşünüyorum')
    expect(r.requiresAIReview).toBe(true)
    expect(r.blockImmediately).toBe(false)
    expect(r.triggeredCategories).toContain('SUICIDE_SELF_HARM')
  })

  it('flags a self-harm phrase', () => {
    const r = runLocalFilter('kendime zarar vermek istiyorum')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('SUICIDE_SELF_HARM')
  })

  it('getSuicidePreventionResources exposes the 182 hotline', () => {
    expect(getSuicidePreventionResources()).toContain('182')
  })
})

describe('runLocalFilter — political figures (AI review)', () => {
  it('flags a protected name (law 5816)', () => {
    const r = runLocalFilter('Atatürk')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('POLITICAL_FIGURES')
  })

  it('catches Turkish suffixes via word-start matching', () => {
    const r = runLocalFilter('erdoğanı eleştiriyorum')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('POLITICAL_FIGURES')
  })

  it('catches party abbreviations', () => {
    const r = runLocalFilter('AKP hükümeti')
    expect(r.triggeredCategories).toContain('POLITICAL_FIGURES')
  })
})

describe('runLocalFilter — violence / threats (AI review)', () => {
  it('flags a real death threat via the öl/ol pattern', () => {
    const r = runLocalFilter('seni öldüreceğim')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('VIOLENCE_THREATS')
  })

  it('flags an explicit violence verb', () => {
    const r = runLocalFilter('geber')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('VIOLENCE_THREATS')
  })
})

describe('runLocalFilter — sexual content (AI review)', () => {
  it('flags assault-oriented terms', () => {
    const r = runLocalFilter('tecavüz')
    expect(r.requiresAIReview).toBe(true)
    expect(r.triggeredCategories).toContain('SEXUAL_EXPLICIT')
  })
})

describe('runLocalFilter — obfuscation handling', () => {
  it('normalizes leetspeak (1->i, 4->a) back to a keyword', () => {
    const r = runLocalFilter('1nt1h4r')
    expect(r.triggeredCategories).toContain('SUICIDE_SELF_HARM')
  })

  it('strips punctuation obfuscation (i.n.t.i.h.a.r)', () => {
    const r = runLocalFilter('i.n.t.i.h.a.r')
    expect(r.triggeredCategories).toContain('SUICIDE_SELF_HARM')
  })

  it('handles Turkish uppercase İ', () => {
    const r = runLocalFilter('İNTİHAR')
    expect(r.triggeredCategories).toContain('SUICIDE_SELF_HARM')
  })
})

/**
 * KNOWN WEAKNESS #1 — over-broad death pattern.
 * The regex /[oö]l[düumsncekry]|[oö]l($|\s)|.../ matches a huge number of benign
 * Turkish words (oldu, olmak, gol, rol, ...). These posts are forced to Gemini and,
 * if Gemini is unavailable, get treated as high-risk VIOLENCE_THREATS and BLOCKED.
 * These tests document the false positives — tighten the pattern to fix them.
 */
describe('runLocalFilter — KNOWN over-broad death-pattern false positives', () => {
  it('benign "oldu" is flagged as violence', () => {
    const r = runLocalFilter('Sınavım kötü oldu')
    expect(r.triggeredCategories).toContain('VIOLENCE_THREATS') // false positive
  })

  it('benign "olmak" is flagged as violence', () => {
    const r = runLocalFilter('İyi biri olmak istiyorum')
    expect(r.triggeredCategories).toContain('VIOLENCE_THREATS') // false positive
  })

  it('benign "gol" is flagged as violence', () => {
    const r = runLocalFilter('Harika bir gol attı')
    expect(r.triggeredCategories).toContain('VIOLENCE_THREATS') // false positive
  })
})

/**
 * KNOWN WEAKNESS #2 — spaced-letter bypass.
 * normalizeText collapses multiple spaces to one but does NOT remove single
 * spaces between letters, so "i n t i h a r" is not detected. This test documents
 * the gap; if normalization is hardened, update this expectation.
 */
describe('runLocalFilter — KNOWN spaced-letter bypass', () => {
  it('does NOT catch a spaced-out keyword (documents the bypass)', () => {
    const r = runLocalFilter('i n t i h a r')
    expect(r.requiresAIReview).toBe(false)
    expect(r.triggeredCategories).toEqual([])
  })
})
