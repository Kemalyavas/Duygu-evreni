# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje Özeti
Duygu Evreni, kullanıcıların duygularını "yıldız" olarak paylaşabildiği 3D interaktif bir sosyal platformdur. Her gezegen bir duyguyu temsil eder (Aşk, Mutluluk, Hüzün, Öfke, Umut, Korku, Huzur, Özlem, Şaşkınlık, Minnettarlık).

## Tech Stack
- **Framework:** Next.js 16 (App Router, Turbopack)
- **React:** 19
- **3D:** Three.js + React Three Fiber + Drei
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, RLS)
- **State:** Zustand
- **Styling:** Tailwind CSS 4
- **Animation:** Framer Motion
- **Language:** TypeScript (strict mode)

## Proje Yapısı

```
app/                      # Next.js App Router sayfaları
├── api/                  # API routes
│   ├── admin/           # Admin endpoints (ban-ip, check)
│   ├── ip/              # IP tracking (track, check)
│   └── moderate/        # İçerik moderasyonu (Gemini AI)
├── profil/              # Profil sayfası
├── giris/               # Giriş sayfası
├── kayit/               # Kayıt sayfası
└── gezegen/[id]/        # Gezegen detay sayfası

components/
├── 3d/                  # Three.js bileşenleri
│   ├── UnifiedUniverse.tsx # Ana 3D sahne (evren + gezegen görünümü)
│   ├── Planet.tsx       # Gezegen bileşeni (Fresnel glow shader)
│   ├── OrbitingStar.tsx # Yörüngedeki yıldız
│   ├── StarField.tsx    # Arka plan yıldız alanı
│   └── CameraController.tsx # Kamera animasyonları
├── messaging/           # Mesajlaşma sistemi
│   ├── ChatPanel.tsx    # Sohbet paneli
│   ├── MessageRequestButton.tsx
│   └── ConversationList.tsx
├── ui/                  # Genel UI bileşenleri
│   ├── Navbar.tsx       # Navigasyon (NotificationBell içerir)
│   ├── Modal.tsx
│   └── NotificationBell.tsx
└── home/                # Ana sayfa bileşenleri

lib/
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Kimlik doğrulama
│   ├── useStars.ts      # Yıldız CRUD
│   ├── useConversations.ts # Mesajlaşma
│   ├── useMessages.ts   # Mesaj gönderme + Realtime
│   ├── useNotifications.ts # Bildirim sistemi + Realtime
│   └── useDailyLimit.ts # Günlük limit yönetimi
├── store/
│   └── useStore.ts      # Zustand global state
├── supabase/
│   ├── client.ts        # Client-side Supabase
│   ├── server.ts        # Server-side Supabase
│   └── fetch.ts         # REST API helpers
└── moderation/
    └── localFilter.ts   # Yerel içerik filtresi

types/
└── index.ts             # Tüm TypeScript tipleri
```

## Veritabanı Şeması

### Ana Tablolar
- `profiles` - Kullanıcı profilleri (username, daily limits, privacy settings)
- `planets` - 10 gezegen (duygu kategorileri)
- `stars` - Kullanıcı paylaşımları (content, position_x/y/z)
- `conversations` - Mesaj istekleri ve sohbetler (status: pending/accepted/rejected)
- `messages` - Sohbet mesajları
- `notifications` - Bildirimler (type: message_request/request_accepted/new_message)
- `banned_ips` - Yasaklı IP adresleri
- `user_ip_history` - Kullanıcı IP geçmişi

### Önemli RLS Kuralları
- Kullanıcılar sadece kendi verilerini görebilir/değiştirebilir
- `notifications` INSERT için `WITH CHECK (TRUE)` - triggerlar ekler
- `user_ip_history` sadece kendi kayıtlarını ekleyebilir

### Aktif Triggerlar
- `check_daily_star_limit` - Günlük 3 yıldız limiti (Europe/Istanbul timezone)
- `notify_on_message_request` - Mesaj isteği gelince bildirim
- `notify_on_request_accepted` - İstek kabul edilince bildirim
- `notify_on_new_message` - Yeni mesaj gelince bildirim

## Geliştirme Kuralları

### TypeScript
- Strict mode aktif, `any` kullanma
- Tüm props için interface tanımla
- Supabase realtime payload'ları için `as unknown as Type` kullan

### Supabase
- Client-side: `createClient()` from `@/lib/supabase/client`
- Server-side: `createClient()` from `@/lib/supabase/server`
- API routes için lazy-loaded `getSupabaseAdmin()` (service role)
- RLS her zaman aktif, access token ile işlem yap

### React Patterns
- Custom hooks `lib/hooks/` altında
- Global state için Zustand (`useStore`)
- Realtime subscription'lar `useEffect` içinde, cleanup ile
- `isMountedRef` pattern ile memory leak önleme

### 3D (Three.js)
- Material/Geometry disposal önemli (memory leak)
- `useFrame` içinde state güncellemesi yapma
- Mobile için performans optimizasyonu gerekli

### Content Moderation
- İki katmanlı: Local filter + Gemini AI
- Türkçe karakter normalizasyonu (İ → i için `\u0130` replace)
- Fail-safe: AI unavailable ise local filter kullan

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

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Sadece API routes'ta kullan
GEMINI_API_KEY=                  # Content moderation için
ADMIN_EMAILS=                    # Admin email listesi (virgülle ayrılmış)
```

## Önemli Notlar

1. **Günlük Limitler:**
   - 3 yıldız/gün (admin hariç)
   - 5 mesaj isteği/gün
   - Reset: Gece 00:00 Türkiye saati

2. **Bildirim Sistemi:**
   - Realtime subscription ile anlık
   - Navbar'da badge + Profil'de liste
   - Okundu/okunmadı takibi

3. **IP Ban Sistemi:**
   - `/api/ip/track` ile IP kaydı
   - `/api/ip/check` ile ban kontrolü
   - `banned_ips` tablosunda `banned_until = infinity` kalıcı ban

4. **Moderasyon:**
   - Küfür, hakaret, siyasi figürler filtrelenir
   - İntihar/şiddet içerikleri için yardım kaynakları gösterilir
   - Gemini AI ile context-aware moderasyon

## Debug

```sql
-- Kullanıcı bildirimlerini kontrol et
SELECT * FROM notifications WHERE user_id = 'xxx' ORDER BY created_at DESC;

-- Günlük limit kontrolü
SELECT username, daily_stars_added, last_reset_date FROM profiles WHERE username = 'xxx';

-- Aktif triggerları listele
SELECT trigger_name, event_object_table FROM information_schema.triggers;
```
