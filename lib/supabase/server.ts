import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    }
  )
}

/** Service-role client for admin/webhook routes only.
 *
 *  Typed as `any` because the project doesn't have a generated Supabase schema
 *  (supabase gen types). Without the schema the typed client infers every table
 *  as `never`, which breaks all insert/update/upsert calls at the TS level.
 *  The service key itself has no per-user state, so caching it per module
 *  instance is safe.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _serviceClient: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createServiceClient(): any {
  if (_serviceClient) return _serviceClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add these in Vercel → Settings → Environment Variables.'
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  _serviceClient = createClient(url, key)
  return _serviceClient
}
