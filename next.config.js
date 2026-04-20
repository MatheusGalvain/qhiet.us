/** @type {import('next').NextConfig} */

// Supabase project ref — extracted from NEXT_PUBLIC_SUPABASE_URL at build time
// e.g. https://xygmyqkywgrohkqllkfx.supabase.co → xygmyqkywgrohkqllkfx
const supabaseUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseRef   = supabaseUrl.replace('https://', '').replace('.supabase.co', '')
const supabaseHosts = supabaseRef
  ? `https://${supabaseRef}.supabase.co wss://${supabaseRef}.supabase.co`
  : 'https://*.supabase.co wss://*.supabase.co'

const ContentSecurityPolicy = [
  // Only load resources from same origin by default
  `default-src 'self'`,

  // Scripts: self + inline/eval needed by Next.js hydration + Stripe.js + PDF.js CDN + Google Analytics
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com`,

  // Styles: self + inline + Google Fonts CSS
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

  // Images: self + data URIs + external HTTPS (Wikipedia, etc. for figure images)
  `img-src 'self' data: blob: https:`,

  // Fonts: self + data URIs + Google Fonts files (gstatic) + CDN (PDF.js cmaps)
  `font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net`,

  // API / WS connections: self + Supabase + Stripe + R2 (signed PDF URLs)
  `connect-src 'self' ${supabaseHosts} https://api.stripe.com https://*.r2.cloudflarestorage.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com`,

  // Workers: blob URLs (PDF.js web worker) + CDN fallback
  `worker-src 'self' blob: https://cdn.jsdelivr.net https://unpkg.com`,

  // Iframes: Stripe payment UI only
  `frame-src https://js.stripe.com https://hooks.stripe.com`,

  // No plugins (Flash etc.)
  `object-src 'none'`,

  // Upgrade any accidental HTTP → HTTPS
  `upgrade-insecure-requests`,
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy',    value: ContentSecurityPolicy },
        ],
      },
    ]
  },
}

module.exports = nextConfig
