# Duygu Evreni — Performans / Verimlilik / İnovasyon Denetimi (Haziran 2026)

3 Opus 4.8 agent (read-only) tarafından yapılan kapsamlı analiz. Kısıt: **önyüz görsel kalitesi
en yüksek öncelik** — kazançlar minimum/sıfır görsel taviz ile.

> Bunlar ÖNERİDİR, henüz uygulanmadı. "Zaten yapılmış" optimizasyonlar (OrbitingStar hot-path,
> frameloop hidden-pause, reduced-motion, mobil dpr=1, bloom mobilde kapalı) hariç tutuldu.

---

## 🔴 EN BÜYÜK + RİSKSİZ KAZANÇLAR (önce bunlar)

### 1. 10 GLB gezegen modeli sıkıştırılmamış (~17 MB) — Draco/meshopt/KTX2 YOK
`public/models/planets/*.glb` toplam **~16.9 MB**, gömülü JPEG dokular, sıkıştırma işareti yok.
`PlanetRenderer.tsx:15-17` hepsini import'ta preload ediyor. Mobilde 4G'de saniyelerce indirme +
CPU decode + GPU upload = ilk etkileşimde donma.
**Çözüm:** `gltf-transform optimize` / `gltfpack` → Draco/meshopt (geometri, görsel kayıpsız) +
KTX2/WebP (doku). ~10x küçülme (her biri ~150-400 KB). **Görsel risk: yok→düşük. Tek en büyük kazanç.**

### 2. 21.8 MB arka plan müziği `preload="auto"` (mobilde müzik kapalı olsa bile indiriliyor)
`MusicProvider.tsx:7,67-69`. **Çözüm:** mobilde/müzik kapalıyken `preload='none'`; sadece kullanıcı
açınca `.load()`. Ayrıca 96-128 kbps'e yeniden encode (2-4 MB). **Görsel risk: yok.**

### 3. Zustand: her tüketici TÜM store'a abone (selector yok)
`useStore()` selector'sız → herhangi bir `set()` her tüketiciyi re-render ediyor. Tek bir bildirim
(`useNotifications`) → tüm ana sayfa (`useAuth` page.tsx:115) yeniden render + tüm `.find/.filter`
yeniden çalışıyor. **Çözüm:** `useShallow` + atomik selector'lar. **Görsel risk: yok. Düşük efor, yüksek etki.**

### 4. Her veri işleminden önce `getSession()` — seri auth round-trip'leri
~10 hook'ta her metod `await getSession()` ile başlıyor. `sendMessage` = 6 seri round-trip.
**Çözüm:** token'ı `useAuth` `onAuthStateChange`'den store'a cache'le, senkron oku; bağımsız
fetch'leri `Promise.all` ile paralel yap. **Görsel risk: yok.**

---

## 📱 MOBİL KASMA ("telefonda kasma")

### B1. `useMobile()` birçok gerçek telefonu/tableti masaüstü sanıyor
`useMobile.ts:20-32`: `innerWidth<768 OR (mobileUA AND hasTouch)`. **iPadOS Safari** (masaüstü UA),
landscape Android'ler, ≥768px tabletler → masaüstü yoluna düşüp `dpr=[1,2]` + **Bloom AÇIK** + 2500
arka yıldız + tam ışık alıyor = kasmanın ana sebebi. **Çözüm:** `matchMedia('(pointer:coarse)')` +
`maxTouchPoints` ile tespit; 3 kademeli kalite (high/mid/low). **Görsel risk: düşük (sadece o cihazlar).**

### B2. Adaptif performans yok (`PerformanceMonitor` / dinamik dpr yok)
20 fps'e düşen cihazın yük azaltma mekanizması yok. **Çözüm:** drei `<PerformanceMonitor>` ile fps
düşünce dpr'yi kademeli düşür (1.5→1→0.75), bloom/yıldız sayısını azalt. Güçlü telefonda kaliteyi yükselt.

### C1. İki yıldız InstancedMesh'i `frustumCulled={false}` — ekran dışı bile her kare çiziliyor
`OrbitingStar.tsx:545,566`. Yoğun gezegende binlerce şeffaf/additive/çift-yüzlü quad culling'siz =
mobil GPU'da fill-rate katili. **Çözüm:** doğru bounding sphere ile culling'i aç + mobilde render edilen
yıldız sayısını sınırla (en yakın/yeni N). **Görsel risk: düşük.**

### C2. Yıldızlar `meshStandardMaterial` (PBR/ışıklı) ama sadece emissive billboard
Gereksiz per-light hesap. **Çözüm:** `meshBasicMaterial` (renk = emissive). **Görsel risk: yok→düşük** (bloom luminance'tan besleniyor, korunur).

### C3. `useFrame` yıldız döngüsü her kare O(N) — binlerce trig + Map/Set lookup
3000 yıldız = kare başına ~9000 trig + 3000 Map.get + 3000 Set.has. **Çözüm (kısa):** Map yerine
düz dizi, `isRead`'i typed array'e önceden yaz, mobilde N sınırla. **(uzun):** orbit animasyonunu
vertex shader'a taşı (CPU döngüsü tamamen kalkar).

### D1. Evren görünümünde çok sayıda dinamik ışık (gezegen başına pointLight + global rig = ~15-25)
Her lit material tüm ışıkları per-fragment hesaplıyor — mobilde en pahalı işlerden. **Çözüm:** mobilde
gezegen başı point light'ları kes; emissive material + ambient/hemisphere'e yaslan. Masaüstü tam kalır.

### C4/C5. `scene.clone()` her gezegende + Hope/Depression material'ı **her render'da** yeniden kuruluyor (memoize/dispose yok) → GC churn + GPU material sızıntısı.

### E2. Touch hover her `touchmove`'da tam raycast (rAF coalescing yok) → sürüklerken kasma.
`OrbitingStar.tsx:465-479`. Mouse coalesced ama touch değil. **Çözüm:** touch'ı da rAF'le birleştir.

---

## ⚙️ GÖRÜNMEZ VERİMLİLİK (sıfır görsel taviz)

- **B5. Evren görünümünde `fetchAllStars(500)` `select=*`** — evrende tekil yıldız render edilmiyor
  (sadece gezegenler + sayılar) ama 500 tam satır çekiliyor. **Çözüm:** evrende yıldız çekme; `starCounts`
  RPC zaten var; gezegene girince lazy `fetchStarsByPlanet`. İlk paint'te büyük payload kalkar.
- **B3. Yıldız sayacı read-modify-write** — `incrementStarCount`+`checkRealLimit`+`refetchCounts` = yıldız
  oluşturmada 3-4 round-trip. **Çözüm:** atomik `UPDATE ... RETURNING` RPC; `handleStarCreated`'daki
  gereksiz `checkRealLimit`'i kaldır.
- **B2. `sendMessage`'da 2 ayrı engel sorgusu** → tek `or=(...)` sorgusu.
- **A2. Ana sayfa her render `.find/.filter` (5 yerde, 15k'ya kadar)** → `useMemo`.
- **D2. Framer Motion initial bundle'da** (Providers > MotionConfig kök layout'ta) — WebGL landing'de
  ~30-50KB. **Çözüm:** `LazyMotion`/`m.*` veya birkaç giriş animasyonunu CSS'e çevir.
- **D4. `package.json`'a `"sideEffects": false`** (barrel tree-shake) — tek satır kazanç.
- **B4. SWR/React Query yok** — planets/counts navigasyonda tekrar çekiliyor. (en az: planets'i store'a cache'le.)
- **C1(eff). `useMessages` her gelen mesajda sender profili fetch ediyor** → konuşma açılınca 1 kez çöz.
- **A5. ChatPanel + ConversationList ayrı ayrı blocked_users/nicknames çekiyor** (profil sayfasında 2x).

**Homepage waterfall (öneri):** tek `getSession` → token store'a → profil/admin-check/notifications/IP
**paralel**; evrende yıldız çekme yok. ~3-4 seri zincir → 1 auth + paralel fan-out.

---

## 💡 YENİLİKÇİ FİKİRLER (önyüzü yükseltir, performansı bozmaz)

**Hızlı kazançlar:**
1. **Per-star dinamik OG kartları** — paylaşılan her yıldız linki, gezegenin renginde güzel bir
   1200×630 kart olarak açılsın (şu an hepsi aynı generic görsel). `next/og` zaten kurulu. **Sıfır runtime
   maliyet (edge'de render), 3D döngüsüne dokunmaz. En büyük büyüme kazancı (bütçesiz).**
2. **Gerçek yıldız permalink'leri** `/yildiz/[id]` (hassas içerik noindex) — temiz link + zengin unfurl.
3. **Empati reaksiyonu** — yıldıza tek dokunuş "✨ ben de hissettim" (sayı, kimlik yok). "Yalnız değilsin"
   döngüsünü tamamlar; lurker'lara sıfır-risk aksiyon. 3D'de okundu/okunmadı instanced-mesh paterniyle ucuz.
   ⚠️ Depresyon'da yeniden çerçevele ("🕊️ buradayım", public sayaç yok).
4. **Yeni paylaşımda kayan yıldız** — evren "canlı" hissi; kendi yıldızın için garantili komet. Tek mesh, ucuz.
5. **Ses tasarımı** — planet modunda ambient drone + Big Bang chime + "tap for sound" nudge.
6. **Hafif anonim kimlik (localStorage id)** — "yıldızların senin" (kendi yıldızına ince halka), reaksiyon dedup.

**Orta bahisler:** günlük duygu promptu ("Bugünün yıldızı" — ritüel/retention), "Bugünün Takımyıldızı"
(constellation çizgileri — keşif + günlük paylaşılabilir artefakt), ilk-giriş sinematik kamera fly-in
(modal yerine evreni göstererek sat), "yıldızının yolculuğu", nazik dönüş bildirimleri, calm/sakin mod (a11y + duygusal güvenlik).

**Büyük bahisler:** embed edilebilir mini-evren widget'ı (bütçesiz dağıtım), **kriz-güvenlik katmanı
(zorunlu)**, "Süpernova" keepsake monetizasyon (görseli paywall'lamadan), sezonsal temalar.

**Agent'ın önerdiği ilk 5 sıra:** (1) per-star OG kartları → (2) kriz-güvenlik katmanı (reach artmadan
önce) → (3) empati reaksiyonu → (4) kayan yıldız + ses → (5) günlük prompt. Hepsi mevcut altyapı üstünde.

---

## 🗺️ ÖNERİLEN YOL HARİTASI (etki/risk dengesi)

**Faz 1 — Risksiz büyük kazançlar:** GLB sıkıştırma (#1) · müzik preload (#2) · Zustand selector (#3) ·
getSession cache + paralel (#4) · evren over-fetch (B5). → Mobil kasma ve ilk-paint dramatik düzelir, **görsel aynı.**

**Faz 2 — Mobil kalite katmanı:** useMobile gate düzelt + PerformanceMonitor (B1/B2) · frustum cull +
mobil N-cap + Basic material (C1/C2) · mobil ışık kes (D1) · touch rAF (E2).

**Faz 3 — İnovasyon:** per-star OG kartları + kriz-güvenlik → empati reaksiyonu → kayan yıldız/ses → günlük prompt.

**Faz 4 — Mimari (planlı):** atomik sayaç RPC, SWR/React Query, usePageState/useURLSync, embed widget.
