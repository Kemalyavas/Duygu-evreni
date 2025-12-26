// Direct fetch helper for Supabase REST API
// Bypasses the @supabase/ssr client which has issues

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const headers = {
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

export async function supabaseFetch<T>(
  table: string,
  options?: {
    select?: string
    filter?: string
    order?: string
    limit?: number
    offset?: number
    single?: boolean
    accessToken?: string
  }
): Promise<{ data: T | null; error: string | null }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}`
    const params = new URLSearchParams()

    if (options?.select) {
      params.append('select', options.select)
    } else {
      params.append('select', '*')
    }

    if (options?.filter) {
      url += `?${options.filter}&${params.toString()}`
    } else {
      url += `?${params.toString()}`
    }

    if (options?.order) {
      url += `&order=${options.order}`
    }

    if (options?.limit) {
      url += `&limit=${options.limit}`
    }

    if (options?.offset) {
      url += `&offset=${options.offset}`
    }

    // Use user's access token if provided (required for RLS)
    const requestHeaders = options?.accessToken
      ? {
          ...headers,
          'Authorization': `Bearer ${options.accessToken}`,
        }
      : headers

    const response = await fetch(url, { headers: requestHeaders })

    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()

    if (options?.single && Array.isArray(data)) {
      return { data: data[0] || null, error: null }
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Fetch error' }
  }
}

export async function supabaseInsert<T>(
  table: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}`

    // Use user's access token if provided (required for RLS)
    const requestHeaders = accessToken
      ? {
          ...headers,
          'Authorization': `Bearer ${accessToken}`,
        }
      : headers

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { data: Array.isArray(data) ? data[0] : data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Insert error' }
  }
}

export async function supabaseUpdate<T>(
  table: string,
  filter: string,
  body: Record<string, unknown>,
  accessToken?: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const url = `${supabaseUrl}/rest/v1/${table}?${filter}`

    // Use user's access token if provided (required for RLS)
    const requestHeaders = accessToken
      ? {
          ...headers,
          'Authorization': `Bearer ${accessToken}`,
        }
      : headers

    const response = await fetch(url, {
      method: 'PATCH',
      headers: requestHeaders,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { data: null, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    return { data: Array.isArray(data) ? data[0] : data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Update error' }
  }
}

// Auth functions still need the Supabase client
export { createClient } from './client'
