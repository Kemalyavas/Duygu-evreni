/**
 * Gemini AI Content Moderation
 * Server-side only - uses API key from environment
 *
 * This module provides context-aware content moderation using Google's Gemini API.
 * It analyzes content for:
 * - Suicide/self-harm intent vs. emotional expression
 * - Political figure insults vs. neutral mentions
 * - Violence threats vs. figurative language
 * - Explicit sexual content vs. romantic feelings
 */

import type { FilterCategory } from './localFilter'

// ============================================
// TYPES
// ============================================

export interface GeminiModerationResult {
  allowed: boolean
  reason?: string
  category?: FilterCategory
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  showHelpResources?: boolean
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
  }>
  error?: {
    message: string
    code: number
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

const MODERATION_SYSTEM_PROMPT = `Sen bir içerik moderatörüsün. Türkiye'de faaliyet gösteren bir duygu paylaşım platformu için içerik kontrolü yapıyorsun.

PLATFORM HAKKINDA:
- Kullanıcılar anonim olarak duygularını paylaşıyor
- "Aşk", "Öfke", "Hüzün", "Mutluluk" gibi duygu gezegenlerine yıldız (mesaj) bırakıyorlar
- İçerikler herkese açık

KONTROL KRİTERLERİ:

1. İNTİHAR/KENDİNE ZARAR:
   - YASAK: Aktif intihar niyeti, kendine zarar verme planı, intiharı teşvik
   - SERBEST: Geçmiş deneyimleri paylaşma, zor zamanlardan bahsetme, üzüntü ifadesi
   - Örnek YASAK: "Bu gece kendimi öldüreceğim", "Damarlarımı kesmek istiyorum"
   - Örnek SERBEST: "Bir dönem çok kötüydüm", "Yaşamak zor geliyor bazen"

2. TÜRK SİYASİ FİGÜRLER (Atatürk, Cumhurbaşkanı, parti liderleri, "rte", "reis" vb.):
   - YASAK: Hakaret, küfür, aşağılama, nefret söylemi, ÖLÜM DİLEĞİ/TEHDİDİ
   - YASAK: Kısaltılmış küfürler de dahil (amk, aq, aw, mk, oç, sg, skt vb.)
   - SERBEST: Nötr bahsetme, olumlu ifadeler, tarihsel referanslar
   - Örnek YASAK: "Erdoğan bir diktatör", "rte'nin aw", "Cumhurbaşkanı ölsün", "Atatürk'e lanet olsun", "reis amk"
   - Örnek SERBEST: "Atatürk'ü çok seviyorum", "Cumhurbaşkanı bugün konuşma yaptı"

3. ŞİDDET TEHDİTLERİ:
   - YASAK: Gerçek şiddet tehditleri, birini öldürme/yaralama niyeti
   - SERBEST: Mecazi ifadeler, deyimler, genel öfke
   - Örnek YASAK: "Onu bulup öldüreceğim", "Evini yakacağım"
   - Örnek SERBEST: "İçim yanıyor", "Patlayacak gibi hissediyorum", "Kafayı yiyeceğim"

4. CİNSEL İÇERİK:
   - YASAK: Grafik/detaylı cinsel tasvirler, pornografik içerik, tecavüz/taciz övme, CİNSEL SALDIRI İTİRAFI
   - SERBEST: Romantik duygular, özlem, sevgi ifadeleri
   - Örnek YASAK: "Onu zorla becerdim", "Tecavüz ettim", "Zorla ilişkiye girdim", detaylı cinsel eylem tasvirleri
   - Örnek SERBEST: "Dokunuşlarını özledim", "O geceyi unutamıyorum", "Bedenini özlüyorum"

5. KÜFÜR:
   - SERBEST: Genel küfürler duygu ifadesi olarak kabul edilir
   - Platform anonim olduğu için küfürlü duygu paylaşımına izin verilir

YANIT FORMATI (sadece JSON, başka bir şey yazma):
{
  "allowed": true/false,
  "reason": "Engelleme sebebi veya null",
  "category": "SUICIDE_SELF_HARM" | "POLITICAL_FIGURES" | "VIOLENCE_THREATS" | "SEXUAL_EXPLICIT" | "PROFANITY_SLANG" | null,
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "showHelpResources": true/false (sadece intihar içeriği için true)
}
`

// ============================================
// API CALL
// ============================================

/**
 * Call Gemini API for content moderation
 * Should only be called from server-side (API routes)
 */
export async function moderateWithGemini(
  content: string,
  triggeredCategories: FilterCategory[]
): Promise<GeminiModerationResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.warn('[Gemini Moderation] API key not configured')
    // Fail-safe: Block high-risk categories when AI is unavailable
    const highRiskCategories: FilterCategory[] = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'SEXUAL_EXPLICIT']
    const hasHighRisk = triggeredCategories.some(cat => highRiskCategories.includes(cat))

    if (hasHighRisk) {
      return {
        allowed: false,
        confidence: 'LOW',
        reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
        showHelpResources: triggeredCategories.includes('SUICIDE_SELF_HARM'),
      }
    }

    // Allow low-risk categories (like political mentions without context)
    return {
      allowed: true,
      confidence: 'LOW',
    }
  }

  const contextHint = triggeredCategories.length > 0
    ? `\n\nTetiklenen kategoriler: ${triggeredCategories.join(', ')}`
    : ''

  const userPrompt = `Aşağıdaki içeriği analiz et:

"${content}"${contextHint}

JSON formatında yanıt ver.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: MODERATION_SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
            responseMimeType: 'application/json',
          },
          // Disable safety settings for moderation (we're the moderator)
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Gemini Moderation] API error:', response.status, errorText)
      // Fail-safe: Block high-risk categories when API fails
      const highRiskCategories: FilterCategory[] = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'SEXUAL_EXPLICIT']
      const hasHighRisk = triggeredCategories.some(cat => highRiskCategories.includes(cat))

      if (hasHighRisk) {
        return {
          allowed: false,
          confidence: 'LOW',
          reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          showHelpResources: triggeredCategories.includes('SUICIDE_SELF_HARM'),
        }
      }

      return {
        allowed: true,
        confidence: 'LOW',
      }
    }

    const data: GeminiResponse = await response.json()

    // Extract text from response
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      console.error('[Gemini Moderation] Empty response from API')
      // Fail-safe: Block high-risk categories when response is empty
      const highRiskCategories: FilterCategory[] = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'SEXUAL_EXPLICIT']
      const hasHighRisk = triggeredCategories.some(cat => highRiskCategories.includes(cat))

      if (hasHighRisk) {
        return {
          allowed: false,
          confidence: 'LOW',
          reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          showHelpResources: triggeredCategories.includes('SUICIDE_SELF_HARM'),
        }
      }

      return {
        allowed: true,
        confidence: 'LOW',
      }
    }

    // Parse JSON response
    try {
      const result = JSON.parse(responseText) as GeminiModerationResult
      return {
        allowed: result.allowed ?? true,
        reason: result.reason ?? undefined,
        category: result.category ?? undefined,
        confidence: result.confidence ?? 'MEDIUM',
        showHelpResources: result.showHelpResources ?? false,
      }
    } catch {
      console.error('[Gemini Moderation] Failed to parse response:', responseText)
      // Fail-safe: Block high-risk categories when parsing fails
      const highRiskCategories: FilterCategory[] = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'SEXUAL_EXPLICIT']
      const hasHighRisk = triggeredCategories.some(cat => highRiskCategories.includes(cat))

      if (hasHighRisk) {
        return {
          allowed: false,
          confidence: 'LOW',
          reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
          showHelpResources: triggeredCategories.includes('SUICIDE_SELF_HARM'),
        }
      }

      return {
        allowed: true,
        confidence: 'LOW',
      }
    }
  } catch (error) {
    console.error('[Gemini Moderation] Request failed:', error)
    // Fail-safe: Block high-risk categories on network errors
    const highRiskCategories: FilterCategory[] = ['SUICIDE_SELF_HARM', 'VIOLENCE_THREATS', 'SEXUAL_EXPLICIT']
    const hasHighRisk = triggeredCategories.some(cat => highRiskCategories.includes(cat))

    if (hasHighRisk) {
      return {
        allowed: false,
        confidence: 'LOW',
        reason: 'İçerik şu anda kontrol edilemiyor. Lütfen daha sonra tekrar deneyin.',
        showHelpResources: triggeredCategories.includes('SUICIDE_SELF_HARM'),
      }
    }

    return {
      allowed: true,
      confidence: 'LOW',
    }
  }
}
