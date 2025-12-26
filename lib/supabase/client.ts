import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Return cached client if available
  if (client) {
    console.log('[Supabase] Returning cached client')
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('[Supabase] Creating client with URL:', supabaseUrl?.substring(0, 30) + '...')

  // Handle missing env vars gracefully
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://your-project.supabase.co') {
    console.warn('[Supabase] Credentials not configured!')
  }

  client = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
  )

  return client
}
