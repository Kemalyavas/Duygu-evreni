# CLAUDE.md

Bu dosya, Claude Code'un bu projede çalışırken ihtiyaç duyacağı tüm bilgileri içerir.

## Proje Özeti

**Duygu Evreni** (Emotion Universe), kullanıcıların duygularını 3D interaktif yıldızlara dönüştürerek paylaşabildiği modern bir sosyal platformdur. Her gezegen bir duyguyu temsil eder ve kullanıcılar anonim olarak duygularını paylaşıp, başkalarının duygularını keşfedebilir.

**Site URL:** https://www.duyguevreni.com
**Dil:** Türkçe (birincil), İngilizce (destekli)

### 10 Gezegen (Duygu Kategorileri)
1. Aşk (Love) - Pembe
2. Mutluluk (Joy) - Sarı
3. Hüzün (Sadness) - Mavi
4. Öfke (Anger) - Kırmızı
5. Umut (Hope) - Yeşil
6. Korku (Fear) - Mor
7. Huzur (Peace) - Turkuaz
8. Özlem (Longing) - Turuncu
9. Pişmanlık (Regret) - Gri
10. Depresyon (Depression) - Koyu mavi

---

## 🔧 Güncel Durum & Düzeltmeler (2 Haziran 2026)

> Bu bölüm aşağıdaki bazı eski detayları **geçersiz kılar**. Kod incelemesi + canlı RLS denetimi sonrası eklendi. Aşağıdaki dökümana güvenmeden önce burayı oku.

**Canlı 3D bileşen grafiği** (aşağıdaki "3D Rendering" tablosu eskiydi):
`app/page.tsx` → `UnifiedUniverse` → `PlanetRenderer` (Planet3D) + `OrbitingStar` (InstancedMesh) + `UniverseCamera` (CameraAnimator) + `LoadingVortex` + `StarField`.
- **Silindi (ölü koddu):** `components/3d/{Planet,Universe,PlanetScene,CameraController,PlanetModel,FresnelGlow,index}.tsx`, `lib/utils/shaders.ts`, `lib/constants/planets.ts`, `proxy.ts.bak`, `lib/moderation/{openaiModeration,profanityFilter}.ts`.
- Gezegenler **GLB model** (Fresnel shader değil); Umut = sahne ışık kaynağı, Depresyon = ışık yutan.

**Route'lar:** dinamik segment `gezegen/[slug]` (eski `[id]` DEĞİL; uuid → 301 `/?planet=`). Ek route'lar: `/hakkinda`, `/admin/reports`, `/api/stars` (YENİ), `/api/stars/anonymous`. `/evren` kaldırıldı → `next.config.ts`'de kalıcı 308 → `/`.

**Güvenlik modeli (ÖNEMLİ):**
- Giriş yapmış kullanıcı yıldızı artık **sunucu-tarafı moderasyondan** geçiyor: `POST /api/stars` (StarCreationModal oradan çağırıyor, eski client-side `moderateContent`+`createStar` değil). Anonim yol zaten `/api/stars/anonymous`.
- **Bekleyen RLS sıkılaştırması:** `supabase/migrations/002_security_hardening.sql` (henüz UYGULANMADI). `stars` doğrudan client INSERT'ini kapatır (→ /api/stars zorunlu olur), `messages`'a engelleme trigger'ı ekler, `notifications` always-true INSERT policy'sini kaldırır, trigger fonksiyonlarına `search_path` pinler + anon/authenticated RPC EXECUTE'unu revoke eder. **App değişikliğiyle BİRLİKTE deploy edilmeli** yoksa yıldız oluşturma kırılır.
- Hâlâ client-side (DB backstop yok): shadow-ban, 5/gün mesaj isteği limiti, DM içerik moderasyonu (politika kararı).

**Günlük yıldız limiti = 3** (kanonik: `useDailyLimit.MAX_DAILY_STARS` + `check_daily_star_limit` trigger). `lib/constants/ui.ts` artık 3'e hizalı (eskiden yanlışlıkla 5).

**profiles** (DB gerçeği): hem `daily_views_used` hem `daily_message_requests_sent` var; ayrıca `last_ip`, `last_ip_updated_at`, `is_banned`, `banned_reason`, `banned_at`.

**Testler:** `__tests__/lib/moderation/localFilter.test.ts` (22) + `orbit.test.ts` (22, eski stale beklentiler düzeltildi) = **44 geçiyor**. `localFilter` death-pattern aşırı geniş ("oldu/olmak/gol" yanlış-pozitif) — test olarak belgelendi.

**Supabase projesi:** `zfrhpasivazpknvwjnwl` (ap-southeast-1). DB şeması repoda değil, canlıda.

---

## Tech Stack

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| Framework | Next.js (App Router, Turbopack) | 16.1.0 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict mode) | 5.x |
| 3D | Three.js + React Three Fiber + Drei | 0.182.0 |
| Backend | Supabase (PostgreSQL, Auth, Realtime, RLS) | - |
| State | Zustand | 5.0.9 |
| Styling | Tailwind CSS | 4.x |
| Animation | Framer Motion | 12.23.26 |
| Analytics | Vercel Analytics + Speed Insights | - |

---

## Proje Yapısı

```
duygu-evreni/
├── app/                          # Next.js App Router sayfaları
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin endpoints (ban-ip, check)
│   │   ├── ip/                  # IP tracking (track, check)
│   │   └── moderate/            # İçerik moderasyonu (Gemini AI)
│   ├── auth/callback/           # OAuth2 callback handler
│   ├── profil/                  # Kullanıcı profili & istatistikler
│   ├── giris/                   # Login sayfası
│   ├── kayit/                   # Signup sayfası
│   ├── kullanici-adi/           # Username setup (onboarding)
│   ├── sifre-sifirla/           # Şifre sıfırlama
│   ├── gizlilik/                # Gizlilik politikası
│   ├── gezegen/[id]/            # Gezegen detay sayfası
│   ├── page.tsx                 # Ana sayfa (3D Universe)
│   ├── layout.tsx               # Root layout (metadata, fonts)
│   ├── sitemap.ts               # SEO sitemap
│   └── robots.ts                # robots.txt
│
├── components/
│   ├── 3d/                      # Three.js bileşenleri
│   │   ├── UnifiedUniverse.tsx  # Ana 3D sahne (evren + gezegen görünümü)
│   │   ├── PlanetScene.tsx      # Gezegen içi yıldız görünümü
│   │   ├── Planet.tsx           # Gezegen mesh (Fresnel glow shader)
│   │   ├── OrbitingStar.tsx     # Yörüngedeki yıldız particle
│   │   ├── StarField.tsx        # Arka plan yıldız alanı
│   │   ├── CameraController.tsx # Kamera animasyonları & transitions
│   │   ├── LoadingVortex.tsx    # Vortex loading animation
│   │   └── FresnelGlow.tsx      # Glow shader implementasyonu
│   │
│   ├── messaging/               # Mesajlaşma sistemi (realtime)
│   │   ├── ChatPanel.tsx        # Global sohbet paneli (desktop sidebar + mobile fullscreen)
│   │   ├── ConversationList.tsx # Aktif sohbet listesi
│   │   ├── MessageRequestModal.tsx # Mesaj isteği gönderme dialog'u
│   │   ├── PendingRequestsList.tsx # Gelen istek listesi
│   │   ├── MessageBubble.tsx    # Mesaj balonu UI
│   │   ├── MessageInput.tsx     # Mesaj input alanı
│   │   ├── NicknameModal.tsx    # Takma ad verme modal'ı
│   │   ├── ReportModal.tsx      # Şikayet modal'ı (spam/harassment)
│   │   └── MessageRequestButton.tsx # Mesaj gönder butonu
│   │
│   ├── profile/                 # Profil sayfası bileşenleri
│   │   ├── StarListItem.tsx     # Yıldız listesi item'ı
│   │   └── DonutChart.tsx       # Duygu dağılımı pasta grafiği
│   │
│   ├── ui/                      # Genel UI bileşenleri
│   │   ├── Navbar.tsx           # Top navigation (NotificationBell içerir)
│   │   ├── Button.tsx           # Styled button (primary, secondary, ghost)
│   │   ├── Input.tsx            # Form input
│   │   ├── Modal.tsx            # Modal wrapper
│   │   ├── Card.tsx             # Card wrapper
│   │   ├── LanguageSwitcher.tsx # TR/EN dil değiştirici
│   │   ├── MusicToggle.tsx      # Arka plan müziği on/off
│   │   ├── NotificationPanel.tsx # Bildirim paneli (dropdown)
│   │   ├── NotificationBell.tsx # Bildirim zili (badge counter)
│   │   └── NotificationList.tsx # Bildirim listesi
│   │
│   ├── home/                    # Ana sayfa layout bileşenleri
│   │   ├── UniverseHeader.tsx   # Header (logo, auth buttons)
│   │   ├── UniverseModeUI.tsx   # Universe mode kontrolleri
│   │   └── PlanetModeUI.tsx     # Planet mode kontrolleri
│   │
│   ├── StarCreationModal.tsx    # Yıldız oluşturma dialog'u
│   ├── StarViewPanel.tsx        # Yıldız detay görüntüleme paneli
│   ├── AuthHandler.tsx          # Auth state listener
│   ├── MusicProvider.tsx        # Background music player
│   ├── Onboarding.tsx           # First-time user experience
│   └── Providers.tsx            # Global providers (theme, language, store)
│
├── lib/
│   ├── hooks/                   # Custom React hooks (~14 hook)
│   │   ├── useAuth.ts           # Supabase auth + IP tracking
│   │   ├── useStars.ts          # Star CRUD (create, fetch, pagination)
│   │   ├── useReadStars.ts      # Read/unread star tracking (localStorage)
│   │   ├── useConversations.ts  # Conversation yönetimi + shadow ban
│   │   ├── useMessages.ts       # Mesaj gönderme + realtime subscription
│   │   ├── useNotifications.ts  # Bildirimler + realtime + ses
│   │   ├── useDailyLimit.ts     # Günlük limit yönetimi (3 yıldız/gün)
│   │   ├── useBlocking.ts       # Kullanıcı engelleme/kaldırma + şikayet
│   │   ├── useNicknames.ts      # Sohbet takma adları
│   │   ├── usePlanets.ts        # Gezegen listesi fetch
│   │   ├── useMobile.ts         # Mobil cihaz tespiti
│   │   ├── useSoundEffects.ts   # Ses efektleri
│   │   └── useBackgroundMusic.ts # Arka plan müziği
│   │
│   ├── store/
│   │   └── useStore.ts          # Zustand global state
│   │
│   ├── supabase/
│   │   ├── client.ts            # Browser client (cached singleton)
│   │   ├── server.ts            # Server-side client (cookie-based SSR)
│   │   └── fetch.ts             # REST API helpers (supabaseFetch, supabaseInsert, supabaseUpdate)
│   │
│   ├── moderation/              # İçerik moderasyonu (2 katmanlı)
│   │   ├── localFilter.ts       # Offline keyword + pattern matching (Türkçe)
│   │   ├── geminiModeration.ts  # AI-powered context analysis (Google Gemini)
│   │   └── index.ts             # Moderation orchestrator
│   │
│   ├── constants/
│   │   ├── planets.ts           # 10 gezegen tanımları (colors, positions)
│   │   ├── animation.ts         # Animasyon timing sabitleri
│   │   └── ui.ts                # UI sabitleri
│   │
│   ├── utils/
│   │   ├── shaders.ts           # GLSL shader kodu (Fresnel, glow)
│   │   └── orbit.ts             # Orbital mechanics hesaplamaları
│   │
│   └── i18n/                    # Çoklu dil desteği
│       ├── LanguageContext.tsx  # Language context provider
│       ├── useTranslation.ts    # useTranslation hook
│       └── translations/
│           ├── tr.json          # Türkçe çeviriler
│           └── en.json          # İngilizce çeviriler
│
├── types/
│   └── index.ts                 # Tüm TypeScript tipleri
│
├── public/
│   ├── models/                  # 3D modeller (GLB)
│   ├── sounds/                  # Ses dosyaları
│   │   ├── notification.mp3     # Bildirim sesi
│   │   └── background.mp3       # Arka plan müziği
│   └── images/                  # Statik görseller
│
├── middleware.ts                # Next.js middleware (auth redirect)
└── package.json                 # Bağımlılıklar
```

---

## Veritabanı Şeması (Supabase PostgreSQL)

### Ana Tablolar

#### profiles (Kullanıcı Profilleri)
```sql
id (uuid, PK)                          -- auth.users.id ile eşleşir
username (varchar, UNIQUE, nullable)   -- Görüntülenen isim
email (varchar)                        -- E-posta
daily_stars_added (int, default: 0)    -- Bugün eklenen yıldız sayısı
daily_message_requests_sent (int)      -- Bugün gönderilen mesaj isteği
last_reset_date (date)                 -- Günlük limit sıfırlama tarihi
show_username_in_chats (boolean)       -- Gizlilik: Sohbetlerde isim göster
is_admin (boolean, default: false)     -- Admin flag
created_at (timestamp)
```

#### planets (Gezegenler/Duygu Kategorileri)
```sql
id (uuid, PK)
name, name_tr, name_en (varchar)       -- Çoklu dil isimleri
color (varchar)                        -- Hex renk kodu (#FF5733)
description_tr, description_en         -- Açıklamalar
position_x, position_y, position_z     -- 3D koordinatlar
scale (float)                          -- Görsel boyut çarpanı
```

#### stars (Yıldızlar/Kullanıcı Paylaşımları)
```sql
id (uuid, PK)
user_id (uuid, FK→profiles)            -- Oluşturan kullanıcı
planet_id (uuid, FK→planets)           -- Duygu kategorisi
content (varchar, max 280)             -- Paylaşım içeriği
position_x, position_y, position_z     -- 3D yörünge pozisyonu
created_at (timestamp)
```

#### conversations (Sohbetler)
```sql
id (uuid, PK)
star_id (uuid, FK→stars)               -- İlişkili yıldız
initiator_id (uuid, FK→profiles)       -- İsteği gönderen
star_owner_id (uuid, FK→profiles)      -- Yıldız sahibi
status (enum: pending|accepted|rejected)
first_message (varchar)                -- Açılış mesajı
hidden_by_initiator, hidden_by_owner   -- Soft delete flags
created_at, accepted_at, updated_at
```

#### messages (Mesajlar)
```sql
id (uuid, PK)
conversation_id (uuid, FK→conversations)
sender_id (uuid, FK→profiles)
content (varchar, max 1000)
is_read (boolean, default: false)      -- Okundu bilgisi
created_at (timestamp)
```

#### notifications (Bildirimler)
```sql
id (uuid, PK)
user_id (uuid)
type (enum: message_request|request_accepted|new_message|new_conversation)
title, body (varchar)
conversation_id, sender_id (uuid, nullable)
is_read (boolean, default: false)
created_at (timestamp)
```

#### blocked_users (Engellenenler)
```sql
id (uuid, PK)
blocker_id (uuid, FK→profiles)         -- Engelleyen
blocked_id (uuid, FK→profiles)         -- Engellenen
created_at (timestamp)
UNIQUE(blocker_id, blocked_id)
```

#### conversation_nicknames (Takma Adlar)
```sql
id (uuid, PK)
conversation_id (uuid, FK→conversations)
user_id (uuid, FK→profiles)
nickname (varchar, max 50)
created_at, updated_at
```

#### reports (Şikayetler)
```sql
id (uuid, PK)
reporter_id (uuid, FK→profiles)
reported_user_id (uuid, FK→profiles)
conversation_id (uuid, nullable)
reason (enum: spam|harassment|inappropriate|other)
description (varchar, nullable)
status (enum: pending|reviewed|action_taken|dismissed)
created_at, reviewed_at
```

#### banned_ips (Yasaklı IP'ler)
```sql
ip_address (inet, UNIQUE)
reason (varchar)
banned_by (uuid, FK→profiles)
created_at (timestamp)
```

#### user_ip_history (IP Geçmişi)
```sql
user_id (uuid, FK→profiles)
ip_address (inet)
first_seen_at, last_seen_at (timestamp)
```

### Aktif Database Triggers

| Trigger | Tablo | Olay | İşlev |
|---------|-------|------|-------|
| `check_daily_star_limit` | stars | BEFORE INSERT | Günlük 3 yıldız limiti (Europe/Istanbul TZ) |
| `notify_on_message_request` | conversations | AFTER INSERT | Mesaj isteği bildirimi oluştur |
| `notify_on_request_accepted` | conversations | AFTER UPDATE | İstek kabul bildirimi oluştur |
| `notify_on_new_message` | messages | AFTER INSERT | Yeni mesaj bildirimi oluştur |
| `unhide_conversation_on_new_message` | messages | AFTER INSERT | Yeni mesajda hidden flag'leri sıfırla |

### RLS (Row Level Security) Kuralları

- **profiles:** Kullanıcılar sadece kendi profilini görebilir/düzenleyebilir
- **stars:** Herkes okuyabilir, sadece kendi yıldızını oluşturabilir/silebilir
- **conversations:** Sadece katıldığın sohbetleri görebilirsin
- **messages:** Sadece katıldığın sohbetin mesajlarını görebilirsin
- **notifications:** INSERT için `WITH CHECK (TRUE)` (trigger'lar için), SELECT/UPDATE sadece kendi
- **blocked_users:** Sadece kendi engel listeni yönetebilirsin
- **reports:** `reporter_id = auth.uid() AND reporter_id != reported_user_id`

---

## Zustand Global State (useStore)

```typescript
interface AppState {
  // User
  user: { id: string; email: string } | null
  profile: Profile | null
  setUser, setProfile

  // Selected entities
  selectedPlanet: Planet | null
  selectedStar: Star | null
  setSelectedPlanet, setSelectedStar

  // Modals
  isStarModalOpen: boolean
  setStarModalOpen

  // View mode
  isViewingStars: boolean
  setViewingStars

  // Messaging
  activeConversation: ConversationWithDetails | null
  setActiveConversation
  isMessagingPanelOpen: boolean
  setMessagingPanelOpen
  isChatCompact: boolean  // Desktop: sidebar küçültme
  setChatCompact
  isMessageRequestModalOpen: boolean
  setMessageRequestModalOpen

  // Counts
  pendingRequestsCount: number
  unreadMessagesCount: number
  unreadNotificationsCount: number

  // Triggers
  lastConversationCreatedAt: number
  triggerConversationCreated
}
```

---

## Önemli Sistemler

### 1. İçerik Moderasyonu (2 Katmanlı)

**Katman 1: Local Filter (Hızlı, Offline)**
- Türkçe keyword matching + normalization
- Kategoriler:
  - `SUICIDE_SELF_HARM` - İntihar/kendine zarar (intihar, ölmek istiyorum)
  - `POLITICAL_FIGURES` - Siyasi figürler (Atatürk, Erdoğan) - Kanun 5816
  - `VIOLENCE_THREATS` - Şiddet tehditleri (seni öldüreyim, geber)
  - `CHILD_ABUSE` - Çocuk istismarı → ANINDA ENGELLE
  - `SEXUAL_EXPLICIT` - Cinsel içerik (tecavüz, taciz)
- Obfuscation handling: `0→o, 1→i, 3→e, @→a`, Türkçe karakter normalizasyonu

**Katman 2: Gemini AI Moderation (Context-aware)**
- Local filter `requiresAIReview=true` döndürünce çalışır
- Bağlamı analiz eder ("babam öldü" ✓, "seni öldüreyim" ✗)
- AI unavailable → local filter sonucu kullanılır

**Fail-safe Stratejisi:**
- Yüksek riskli kategori + AI unavailable → defensively block
- İntihar içeriği → Yardım hattı göster (182)

### 2. Günlük Limit Sistemi

```
Yıldız: 3/gün (admin hariç - sınırsız)
Mesaj İsteği: 5/gün (admin hariç - sınırsız)
Reset: Gece 00:00 Türkiye saati (Europe/Istanbul)
```

- `useDailyLimit` hook ile yönetilir
- `profiles.last_reset_date` ile takip edilir
- Admin kontrolü: `/api/admin/check` endpoint + ADMIN_EMAILS env var

### 3. Shadow Ban Sistemi

Engellenen kullanıcıdan gelen mesaj istekleri:
1. Kullanıcıya başarılı görünür (hata mesajı yok)
2. Günlük istek hakkı düşer
3. Ama istek karşı tarafa **ulaşmaz**

```typescript
// useConversations.ts - sendMessageRequest içinde
if (blocked && blocked.length > 0) {
  // Shadow ban: Günlük hakkı düşür
  await incrementMessageRequestCount()
  return { id: 'shadow-banned', shadowBanned: true }
}
```

### 4. Çift Taraflı Engel Kontrolü

Mesaj gönderirken (`useMessages.ts`):
1. Ben karşı tarafı engellemişsem → "Bu kullanıcıyı engellediniz"
2. Karşı taraf beni engellemişse → "Bu kullanıcıya mesaj gönderemezsiniz"

### 5. Realtime Subscriptions

```typescript
// Mesajlar için
supabase.channel(`messages:${conversationId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `conversation_id=eq.${id}` }, ...)
  .subscribe()

// Bildirimler için
supabase.channel(`notifications:${userId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'notifications', filter: `user_id=eq.${id}` }, ...)
  .subscribe()
```

### 6. IP Ban Sistemi

- `/api/ip/track` - Login'de IP kaydı
- `/api/ip/check` - Auth öncesi ban kontrolü
- `banned_ips` tablosunda yönetim
- Kalıcı ban: `banned_until = infinity`

---

## 3D Rendering (Three.js + React Three Fiber)

### Ana Bileşenler

| Bileşen | İşlev |
|---------|-------|
| `UnifiedUniverse` | Ana 3D sahne (dual view: universe/planet) |
| `PlanetScene` | Gezegen içi yıldız görünümü |
| `Planet` | Fresnel glow shader ile gezegen mesh |
| `OrbitingStar` | Billboard yıldız particle (instanced) |
| `CameraController` | Smooth kamera transitions |
| `LoadingVortex` | Vortex gathering → Big Bang explosion |

### Animasyon Sabitleri

```typescript
// lib/constants/animation.ts
CAMERA.MIN_DURATION = 0.6s      // Min kamera animasyonu
CAMERA.MAX_DURATION = 1.8s      // Max kamera animasyonu

STAR_APPEAR.DURATION = 1200ms   // Big Bang süresi
STAR_APPEAR.STAGGER_SPREAD = 0  // Tüm yıldızlar aynı anda

ORBIT.PLANET_ROTATION_SPEED = 0.08
ORBIT.STAR_SPEED_MIN = 0.015
```

### Performance Optimizasyonları

- **Instancing:** 1000+ yıldız için instanced geometry
- **Frustum Culling:** Sadece görünür yıldızları render et
- **Mobile:** Azaltılmış particle count, basit shaderlar
- **Disposal:** Material/Geometry cleanup (memory leak önleme)

---

## Geliştirme Kuralları

### TypeScript
- Strict mode aktif, `any` kullanma
- Tüm props için interface tanımla
- Supabase realtime payload: `as unknown as Type` kullan

### Supabase
```typescript
// Client-side
import { createClient } from '@/lib/supabase/client'

// Server-side (API routes)
import { createClient } from '@/lib/supabase/server'

// REST API helpers
import { supabaseFetch, supabaseInsert, supabaseUpdate } from '@/lib/supabase/fetch'
```
- Her zaman access token ile işlem yap (RLS enforcement)

### React Patterns
- Custom hooks `lib/hooks/` altında
- Global state için `useStore` (Zustand)
- Realtime subscription'lar `useEffect` içinde, return'de cleanup
- `isMountedRef` pattern ile memory leak önleme

### 3D (Three.js)
- Material/Geometry dispose etmeyi unutma
- `useFrame` içinde state güncellemesi yapma
- Mobile için performans optimizasyonu

### i18n
```typescript
const { t, language } = useTranslation()
t('key.path')                    // Çeviri al
t('key', { param: 'value' })     // Parametreli çeviri
```

### Stil
- Tailwind CSS kullan, inline style'dan kaçın
- Modal/Panel background: `bg-[#0d0d1a]` (opak, şeffaf değil)
- Border: `border-white/10` veya `border-white/20`

---

## Sık Kullanılan Komutlar

```bash
# Geliştirme
npm run dev

# Build
npm run build

# Test (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # Coverage report

# Lint
npm run lint
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx           # Sadece API routes

# AI Moderation
GEMINI_API_KEY=xxx

# Admin
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Site
NEXT_PUBLIC_SITE_URL=https://www.duyguevreni.com
```

---

## Debug & Troubleshooting

### SQL Queries

```sql
-- Kullanıcı bildirimlerini kontrol et
SELECT * FROM notifications WHERE user_id = 'xxx' ORDER BY created_at DESC;

-- Günlük limit kontrolü
SELECT username, daily_stars_added, daily_message_requests_sent, last_reset_date
FROM profiles WHERE username = 'xxx';

-- Aktif triggerları listele
SELECT trigger_name, event_object_table FROM information_schema.triggers;

-- Engellenen kullanıcılar
SELECT * FROM blocked_users WHERE blocker_id = 'xxx';

-- RLS policy'leri kontrol et
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
```

### Yaygın Sorunlar

1. **Bildirim gelmiyor:**
   - Realtime subscription aktif mi? (browser console)
   - Trigger çalışıyor mu? (SQL ile kontrol)
   - RLS policy'ler doğru mu?

2. **Yıldız oluşturulamıyor:**
   - Günlük limit dolmuş olabilir
   - İçerik moderasyondan geçememiş olabilir
   - `check_daily_star_limit` trigger kontrol et

3. **Mesaj gönderilemiyor:**
   - Engel kontrolü (çift taraflı)
   - Conversation status: `accepted` mi?

4. **3D yıldızlar görünmüyor:**
   - Position değerleri -3 ile 3 arasında mı?
   - Planet ID doğru mu?
   - WebGL destekleniyor mu?

---

## Önemli Dosya Yolları

| İşlev | Dosya |
|-------|-------|
| Ana sayfa (3D) | `app/page.tsx` |
| 3D sahne | `components/3d/UnifiedUniverse.tsx` |
| Global state | `lib/store/useStore.ts` |
| Auth hook | `lib/hooks/useAuth.ts` |
| Mesajlaşma | `lib/hooks/useMessages.ts`, `lib/hooks/useConversations.ts` |
| İçerik filtresi | `lib/moderation/localFilter.ts` |
| TypeScript tipleri | `types/index.ts` |
| Türkçe çeviriler | `lib/i18n/translations/tr.json` |
