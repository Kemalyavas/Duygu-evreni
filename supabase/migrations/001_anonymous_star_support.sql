-- ============================================
-- Anonymous Star Support Migration
-- ============================================
-- Supabase Dashboard > SQL Editor'da çalıştır.
-- Deploy sonrası tek yapman gereken bu SQL'i çalıştırmak.
-- Anonymous user ilk anonim yıldız request'inde otomatik oluşturulur
-- (getOrCreateAnonymousUser fonksiyonu lazy creation yapıyor).
--
-- SORUN: Tüm anonim yıldızlar tek bir user_id kullanıyor.
-- check_daily_star_limit trigger'ı günde 3 yıldız koyunca,
-- 4. anonim yıldızdan itibaren TÜM anonim kullanıcılar bloklanır.
-- ÇÖZÜM: Trigger'da anonymous user'ı skip et.
-- Gerçek spam koruması API'deki IP rate limiter (1/gün/IP).
-- ============================================


-- ============================================
-- ADIM 1: Mevcut trigger fonksiyonunun kodunu gör
-- (Aşağıyı çalıştırıp mevcut yapıyı kontrol et)
-- ============================================

-- SELECT pg_get_functiondef(oid)
-- FROM pg_proc
-- WHERE proname = 'check_daily_star_limit';


-- ============================================
-- ADIM 2: Trigger fonksiyonunu güncelle
-- ============================================
-- Eğer mevcut trigger fonksiyonun yapısı aşağıdakinden farklıysa,
-- kendi fonksiyonunun BEGIN bloğunun hemen sonrasına şu satırları ekle:
--
--   -- Anonymous user exempt
--   IF (SELECT username FROM profiles WHERE id = NEW.user_id) = '__anonymous__' THEN
--     RETURN NEW;
--   END IF;
--
-- Aşağıdaki tam fonksiyon, yaygın Duygu Evreni trigger yapısı içindir:

CREATE OR REPLACE FUNCTION check_daily_star_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  current_username TEXT;
  current_last_reset DATE;
  today DATE;
BEGIN
  today := (NOW() AT TIME ZONE 'Europe/Istanbul')::DATE;

  -- Kullanıcı bilgilerini al
  SELECT daily_stars_added, username, last_reset_date::DATE
  INTO current_count, current_username, current_last_reset
  FROM profiles
  WHERE id = NEW.user_id;

  -- *** ANONYMOUS USER EXEMPTION ***
  -- Anonim yıldızlar tek user_id paylaşıyor.
  -- Günlük limit API seviyesinde IP bazlı uygulanıyor (1/gün/IP).
  IF current_username = '__anonymous__' THEN
    RETURN NEW;
  END IF;

  -- Gün değişmişse counter'ı sıfırla
  IF current_last_reset IS NULL OR current_last_reset < today THEN
    UPDATE profiles
    SET daily_stars_added = 0, last_reset_date = today
    WHERE id = NEW.user_id;
    current_count := 0;
  END IF;

  -- Günlük limit kontrolü (3 yıldız/gün)
  IF current_count >= 3 THEN
    RAISE EXCEPTION 'Günlük yıldız limitine ulaştınız (3/gün)';
  END IF;

  -- Counter'ı artır
  UPDATE profiles
  SET daily_stars_added = current_count + 1
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- ADIM 3: Trigger bağlantısını yenile
-- ============================================

DROP TRIGGER IF EXISTS check_daily_star_limit ON stars;
CREATE TRIGGER check_daily_star_limit
  BEFORE INSERT ON stars
  FOR EACH ROW
  EXECUTE FUNCTION check_daily_star_limit();


-- ============================================
-- ADIM 4: Doğrula
-- ============================================

-- Trigger'ın bağlı olduğunu kontrol et:
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'stars'::regclass;

-- Fonksiyon kodunu doğrula:
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'check_daily_star_limit';
