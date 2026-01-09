import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export function createClient() {
  const headersList = headers()
  const accessToken = headersList.get('x-access-token')

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}

export function getUserId(): string | null {
  const headersList = headers()
  return headersList.get('x-user-id')
}
