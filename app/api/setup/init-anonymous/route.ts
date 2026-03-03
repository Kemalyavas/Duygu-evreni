import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * One-time setup endpoint: Creates the anonymous system user.
 *
 * Kullanım:
 *   curl -X POST https://your-app.com/api/setup/init-anonymous \
 *     -H "x-setup-key: YOUR_SUPABASE_SERVICE_ROLE_KEY"
 *
 * Bu endpoint'i deploy sonrası BİR KEZ çağır.
 * Anonymous user oluşturulur, profili hazırlanır.
 * Sonrasında /api/stars/anonymous endpoint'i sorunsuz çalışır.
 */

const ANON_EMAIL = 'system-anonymous@duygu-evreni.internal'
const ANON_USERNAME = '__anonymous__'

export async function POST(request: NextRequest) {
  try {
    // Auth: service role key ile güvenlik
    const setupKey = request.headers.get('x-setup-key')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!setupKey || setupKey !== serviceRoleKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 1: Check if anonymous user already exists
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, username')
      .eq('username', ANON_USERNAME)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        message: 'Anonymous user zaten mevcut',
        userId: existingProfile.id,
        status: 'already_exists',
      })
    }

    // Step 2: Check if auth user exists but profile doesn't
    const { data: { users } } = await admin.auth.admin.listUsers()
    let anonAuthUser = users.find(u => u.email === ANON_EMAIL)

    // Step 3: Create auth user if doesn't exist
    if (!anonAuthUser) {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: ANON_EMAIL,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { is_system_anonymous: true },
      })

      if (createError) {
        console.error('[Setup] Auth user creation error:', createError)
        return NextResponse.json({ error: `Auth user oluşturulamadı: ${createError.message}` }, { status: 500 })
      }

      anonAuthUser = newUser.user
    }

    if (!anonAuthUser) {
      return NextResponse.json({ error: 'Auth user bulunamadı' }, { status: 500 })
    }

    // Step 4: Create profile
    const today = new Date().toISOString().split('T')[0]
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: anonAuthUser.id,
        username: ANON_USERNAME,
        daily_stars_added: 0,
        daily_views_used: 0,
        last_reset_date: today,
        show_username_in_chats: false,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[Setup] Profile creation error:', profileError)
      return NextResponse.json({ error: `Profil oluşturulamadı: ${profileError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Anonymous user başarıyla oluşturuldu',
      userId: anonAuthUser.id,
      email: ANON_EMAIL,
      username: ANON_USERNAME,
      status: 'created',
    })
  } catch (error) {
    console.error('[Setup] Unexpected error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
