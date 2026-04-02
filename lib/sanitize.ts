/**
 * Server-side HTML sanitizer for dangerouslySetInnerHTML.
 * Strips script tags, event handlers, javascript: URLs, and
 * any tag not in the allowlist. Safe to use in Server Components.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'hr',
  'a', 'span',
])

const ALLOWED_ATTRS: Record<string, string[]> = {
  a:    ['href', 'title', 'target', 'rel'],
  span: ['class'],
  p:    ['class'],
}

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''

  // 1. Remove <script> and <style> blocks entirely (including content)
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  // 2. Remove all on* event handler attributes (onclick, onload, onerror, etc.)
  clean = clean.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  clean = clean.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')

  // 3. Remove javascript: URLs
  clean = clean.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, 'href="#"')

  // 4. Strip tags not in the allowlist
  clean = clean.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tag) => {
    const lowerTag = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(lowerTag)) return ''

    // For closing tags, just return the clean version
    if (match.startsWith('</')) return `</${lowerTag}>`

    // For opening tags, only keep allowed attributes
    const allowed = ALLOWED_ATTRS[lowerTag] ?? []
    if (allowed.length === 0) return `<${lowerTag}>`

    // Extract and filter attributes
    const attrMatches = [...match.matchAll(/(\w[\w-]*)=["']([^"']*)["']/g)]
    const safeAttrs = attrMatches
      .filter(([, name]) => allowed.includes(name.toLowerCase()))
      .map(([, name, value]) => {
        // Force rel="noopener noreferrer" on external links
        if (lowerTag === 'a' && name === 'href' && value.startsWith('http')) {
          return `${name}="${value}" rel="noopener noreferrer" target="_blank"`
        }
        return `${name}="${value}"`
      })
      .join(' ')

    return safeAttrs ? `<${lowerTag} ${safeAttrs}>` : `<${lowerTag}>`
  })

  return clean
}
