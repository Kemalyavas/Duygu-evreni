import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // If this is a password recovery, redirect to password reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/sifre-sifirla`)
      }

      // Check if user has username set
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.session.user.id)
        .single()

      // If no username, redirect to username setup page
      if (!profile?.username) {
        return NextResponse.redirect(`${origin}/kullanici-adi`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error or no code, check for hash-based auth (older flow)
  // The client-side will handle hash fragments
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    // Redirect to login with error message
    const errorMessage = encodeURIComponent(errorDescription || 'Bir hata oluştu')
    return NextResponse.redirect(`${origin}/giris?error=${errorMessage}`)
  }

  // Default redirect to home
  return NextResponse.redirect(`${origin}/`)
}
