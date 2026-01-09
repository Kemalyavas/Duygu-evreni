import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If this is a password recovery, redirect to password reset page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/sifre-sifirla`)
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
