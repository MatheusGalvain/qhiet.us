import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require authentication only */
const AUTH_ROUTES = ['/perfil']

/**
 * Routes that require a specific plan.
 * Format: [pathname_prefix, required_plans[]]
 * Unauthenticated or wrong-plan users → /membros?upgrade=true
 */
const PLAN_ROUTES: Array<[string, string[]]> = [
  ['/biblioteca',        ['acervo', 'adepto']],
  ['/perfil/trilhas',    ['iniciado', 'adepto']],
  ['/perfil/grimorio',   ['iniciado', 'adepto']],   // acervo NÃO tem grimório
  ['/perfil/biblioteca', ['acervo', 'adepto']],
]

// ── Rate limiting store (in-memory, per Edge instance) ────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const RATE_WINDOW_MS = 15 * 60 * 1000  // 15 minutes
const RATE_MAX       = 12              // max attempts per window

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_MAX
}

export async function middleware(request: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const res = NextResponse.next({ request })
    res.headers.set('x-pathname', request.nextUrl.pathname)
    return res
  }

  const { pathname } = request.nextUrl

  // ── Rate limit /control/login ────────────────────────────────────────────
  if (pathname === '/control/login') {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '900', 'Content-Type': 'text/plain' },
      })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── Auth code on root URL ─────────────────────────────────────────────────
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const code = request.nextUrl.searchParams.get('code')!
    const callbackUrl = new URL('/api/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackUrl)
  }

  // ── Protect /control (admin panel) ────────────────────────────────────────
  if (pathname.startsWith('/control') && pathname !== '/control/login') {
    if (!user) return NextResponse.redirect(new URL('/control/login', request.url))
  }

  // ── Protect plan-gated routes ─────────────────────────────────────────────
  // Note: We only check unauthenticated here (fast path). Actual plan check is
  // done inside the server component, which has DB access.
  // For unauthenticated users on plan-gated routes: send to login.
  const planRoute = PLAN_ROUTES.find(([prefix]) => pathname.startsWith(prefix))
  if (planRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    // Plan verification is done inside the server component (requires DB query).
    // We set a header so the page knows which plans are required.
    supabaseResponse.headers.set('x-required-plans', planRoute[1].join(','))
  }

  // ── Protect auth-only routes ───────────────────────────────────────────────
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

  supabaseResponse.headers.set('x-pathname', pathname)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
