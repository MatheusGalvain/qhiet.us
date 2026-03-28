import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require authentication (admin auth is handled in its own layout) */
const AUTH_ROUTES = ['/perfil']
/** Routes that require Iniciado subscription */
const SUBSCRIBER_ROUTES: string[] = [] // enforced at page level via RLS

export async function middleware(request: NextRequest) {
  // Guard: if env vars are missing (e.g. during first deploy before vars are set),
  // allow the request through rather than crashing every page.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const res = NextResponse.next({ request })
    res.headers.set('x-pathname', request.nextUrl.pathname)
    return res
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Auth code on root URL ────────────────────────────────────────────────
  // Supabase email confirmation redirects to SITE_URL/?code=...
  // Intercept it here and forward to the real callback handler.
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const code = request.nextUrl.searchParams.get('code')!
    const callbackUrl = new URL('/api/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackUrl)
  }

  // Redirect unauthenticated users from protected routes
  if (!user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from /login
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/perfil', request.url))
  }

  // Expose pathname to Server Components via header (used by admin layout)
  supabaseResponse.headers.set('x-pathname', pathname)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
