'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

declare global {
  interface Window { pdfjsLib: any }
}

interface Props {
  bookId: string
  title: string
  author: string
  initialPage: number
  initialTotal: number
  /** URL da rota de stream (default: /api/biblioteca/{bookId}/stream) */
  streamUrl?: string
  /** URL da rota de progresso (default: /api/biblioteca/{bookId}/progress) */
  progressUrl?: string
  /** URL do link de voltar (default: /perfil/biblioteca) */
  backHref?: string
  /** Label do link de voltar (default: ← Biblioteca) */
  backLabel?: string
}

const CDN_VERSION = '3.11.174'

async function injectPdfJs(): Promise<void> {
  if (window.pdfjsLib) return
  const CDNS = [
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${CDN_VERSION}/build/pdf.min.js`,
    `https://unpkg.com/pdfjs-dist@${CDN_VERSION}/build/pdf.min.js`,
  ]
  for (const src of CDNS) {
    try {
      await new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src; s.onload = () => resolve(); s.onerror = () => reject()
        document.head.appendChild(s)
      })
      if (window.pdfjsLib) break
    } catch { /* try next */ }
  }
  if (!window.pdfjsLib) throw new Error('Não foi possível carregar o leitor. Recarregue a página.')
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${CDN_VERSION}/build/pdf.worker.min.js`
}

export default function PdfReader({ bookId, title, author, initialPage, initialTotal, streamUrl, progressUrl, backHref = '/perfil/biblioteca', backLabel = '← Biblioteca' }: Props) {
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const renderTaskRef  = useRef<any>(null)

  const [pdfDoc,      setPdfDoc]      = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(initialPage || 1)
  const [totalPages,  setTotalPages]  = useState(initialTotal || 0)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [scale,       setScale]       = useState(1.0)   // will be overridden by fit-width
  const [fitScale,    setFitScale]    = useState(1.0)   // scale that fits container width
  const [zoomPct,     setZoomPct]     = useState(100)   // display value in %
  const [zoomInput,   setZoomInput]   = useState('100')   // string para o input editável
  const [noteOpen,      setNoteOpen]      = useState(false)
  const [note,          setNote]          = useState('')
  const [isMobile,      setIsMobile]      = useState(false)
  const [floatOpen,     setFloatOpen]     = useState(false)   // mobile: mini-menu aberto
  const [progressSaved, setProgressSaved] = useState(false)   // feedback "Salvo"
  const progressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeout    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Detecta mobile e atualiza no resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Load PDF ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false
    async function load() {
      try {
        await injectPdfJs()
        // Use the stream proxy route — avoids CORS issues with direct R2 signed URLs
        const pdf = await window.pdfjsLib.getDocument({
          url:             streamUrl ?? `/api/biblioteca/${bookId}/stream`,
          withCredentials: true,
          cMapUrl:         `https://cdn.jsdelivr.net/npm/pdfjs-dist@${CDN_VERSION}/cmaps/`,
          cMapPacked:      true,
        }).promise
        if (destroyed) return
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setLoading(false)
      } catch (e: any) {
        if (!destroyed) { setError(e.message ?? 'Não foi possível carregar o PDF.'); setLoading(false) }
      }
    }
    load()
    return () => { destroyed = true }
  }, [bookId])

  // ── Compute fit-to-width scale when PDF loads ────────────────────────────
  const computeFitScale = useCallback(async (doc: any, pageNum: number) => {
    if (!doc || !containerRef.current) return
    const page       = await doc.getPage(pageNum)
    const vp         = page.getViewport({ scale: 1 })
    const containerW = containerRef.current.clientWidth - 120
    const fit        = containerW / vp.width
    setFitScale(fit)
    // Mobile (≤768px) abre em 120%, desktop em 30%
    const isMobile = window.innerWidth <= 768
    const defaultPct = isMobile ? 120 : 30
    setScale(fit * (defaultPct / 100))
    setZoomPct(defaultPct)
  }, [])

  useEffect(() => {
    if (pdfDoc) computeFitScale(pdfDoc, currentPage)
  }, [pdfDoc, computeFitScale]) // only on initial load

  // ── Render page ──────────────────────────────────────────────────────────
  const renderPage = useCallback(async (pageNum: number, doc: any, s: number) => {
    if (!canvasRef.current || !doc) return

    // Cancel previous render if still running
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch {}
      renderTaskRef.current = null
    }

    const page = await doc.getPage(pageNum)
    const dpr  = window.devicePixelRatio || 1

    // Render at physical pixels, display at logical pixels — zero CSS scaling = zero blur
    const vp     = page.getViewport({ scale: s * dpr })
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { alpha: false })!

    canvas.width        = vp.width
    canvas.height       = vp.height
    canvas.style.width  = `${Math.round(vp.width  / dpr)}px`
    canvas.style.height = `${Math.round(vp.height / dpr)}px`

    const task = page.render({ canvasContext: ctx, viewport: vp })
    renderTaskRef.current = task
    try { await task.promise } catch { /* cancelled */ }
  }, [])

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage, pdfDoc, scale)
  }, [pdfDoc, currentPage, scale, renderPage])

  // ── Save progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || totalPages === 0) return
    if (progressTimeout.current) clearTimeout(progressTimeout.current)
    progressTimeout.current = setTimeout(() => {
      fetch(progressUrl ?? `/api/biblioteca/${bookId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_page: currentPage, total_pages: totalPages }),
      })
        .then(() => {
          setProgressSaved(true)
          if (savedTimeout.current) clearTimeout(savedTimeout.current)
          savedTimeout.current = setTimeout(() => setProgressSaved(false), 2500)
        })
        .catch(() => {})
    }, 800)
  }, [currentPage, totalPages, bookId, pdfDoc])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const goTo = (n: number) => setCurrentPage(Math.max(1, Math.min(totalPages, n)))

  const applyZoomPct = (pct: number) => {
    const clamped = Math.max(15, Math.min(300, Math.round(pct)))
    setZoomPct(clamped)
    setZoomInput(String(clamped))
    setScale(fitScale * (clamped / 100))
  }

  const zoom = (delta: number) => applyZoomPct(zoomPct + delta)

  const commitZoomInput = () => {
    const n = parseInt(zoomInput, 10)
    if (!isNaN(n)) applyZoomPct(n)
    else setZoomInput(String(zoomPct))
  }

  const resetZoom = () => {
    const isMobile = window.innerWidth <= 768
    const defaultPct = isMobile ? 120 : 30
    applyZoomPct(defaultPct)
  }

  // Sincroniza zoomInput quando zoomPct muda via computeFitScale
  useEffect(() => { setZoomInput(String(zoomPct)) }, [zoomPct])

  const progressPct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0

  // ── Loading / Error screens ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080503', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--red)', letterSpacing: 3, marginBottom: 12 }}>◉</div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>Carregando…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#080503', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', marginBottom: 20 }}>{error}</p>
        <Link href={backHref} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {backLabel}
        </Link>
      </div>
    </div>
  )

  const TOP_H = 56

  return (
    <div style={{ minHeight: '100vh', background: '#080503', display: 'flex', flexDirection: 'column' }}>

      {/* Reading progress bar — top edge */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.06)', zIndex: 200 }}>
        <div style={{ height: '100%', background: 'var(--red)', width: `${progressPct}%`, transition: 'width .4s ease' }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{
        position: 'fixed', top: 2, left: 0, right: 0, height: TOP_H, zIndex: 190,
        background: 'rgba(8,5,3,0.97)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: 0,
        padding: '0 16px',
      }}>

        {/* Back */}
        <Link
          href={backHref}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
            color: 'var(--cream)', textDecoration: 'none', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            padding: '7px 14px',
            flexShrink: 0,
            transition: 'background .15s, border-color .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.13)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.28)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.14)' }}
        >
          {backLabel}
        </Link>

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', margin: '0 16px', flexShrink: 0 }} />

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 2, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {title}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 2 }}>
            {author}
          </p>
        </div>

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)', margin: '0 12px', flexShrink: 0 }} />

        {/* Note */}
        <button
          onClick={() => setNoteOpen(o => !o)}
          style={{ ...ctrlBtn, color: noteOpen ? 'var(--gold)' : 'var(--muted)', borderColor: noteOpen ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)' }}
          title="Anotações"
        >
          ✎
        </button>

        {/* Progress saved indicator */}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 2,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginLeft: 12,
            opacity: progressSaved ? 1 : 0,
            transition: 'opacity .4s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        >
          ● Salvo
        </span>
      </div>

      {/* ── Note drawer ── */}
      {noteOpen && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 300,
          background: '#0d0b09', borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 180, display: 'flex', flexDirection: 'column',
          paddingTop: TOP_H + 2,
        }}>
          <div style={{ padding: '20px 20px 12px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase' }}>✦ Grimório</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 4 }}>
              Pág. {currentPage} · {title.slice(0, 24)}{title.length > 24 ? '…' : ''}
            </p>
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value.slice(0, 1000))}
            placeholder="Escreva suas reflexões…"
            maxLength={1000}
            style={{
              flex: 1, resize: 'none', background: 'transparent', margin: '0 20px',
              border: '1px solid rgba(255,255,255,0.08)', color: 'var(--cream-dim)',
              fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.8,
              padding: '12px 14px', outline: 'none',
            }}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', textAlign: 'right', padding: '8px 20px 16px' }}>
            {note.length}/1000
          </p>
        </div>
      )}

      {/* ── PDF canvas area ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          paddingTop: TOP_H + 2 + 24,
          paddingBottom: 72,
          paddingLeft: 24,
          paddingRight: 24,
          display: 'flex',
          justifyContent: 'center',
          marginRight: noteOpen ? 300 : 0,
          overflowX: 'auto', // allow horizontal scroll if zoomed in beyond fit
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
            // NO maxWidth / width override — size is set precisely in renderPage
          }}
        />
      </div>

      {/* ── Floating controls: desktop = coluna direita, mobile = pill central ── */}
      {!isMobile ? (
        /* DESKTOP: 4 botões verticais na direita */
        <div style={{
          position: 'fixed',
          right: noteOpen ? 316 : 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 185,
          transition: 'right .2s ease',
        }}>
          <button onClick={() => window.scrollBy({ top: -380, behavior: 'smooth' })} style={roundBtn} title="Rolar para cima">↑</button>
          <button onClick={() => goTo(currentPage - 1)}  disabled={currentPage <= 1}          style={{ ...roundBtn, opacity: currentPage <= 1 ? 0.3 : 1 }}          title="Página anterior">‹</button>
          <button onClick={() => goTo(currentPage + 1)}  disabled={currentPage >= totalPages}  style={{ ...roundBtn, opacity: currentPage >= totalPages ? 0.3 : 1 }}  title="Próxima página">›</button>
          <button onClick={() => window.scrollBy({ top: 380, behavior: 'smooth' })}  style={roundBtn} title="Rolar para baixo">↓</button>
        </div>
      ) : (
        /* MOBILE: botão ⊕ fixo no canto + menu radial que expande para cima */
        <div style={{ position: 'fixed', bottom: 140, right: 16, zIndex: 185 }}>

          {/* Ações expandidas — aparecem acima do gatilho */}
          {floatOpen && (
            <div style={{
              position: 'absolute', bottom: 60, right: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              animation: 'fadeSlideUp .18s ease',
            }}>
              <button onClick={() => { window.scrollBy({ top: -380, behavior: 'smooth' }); setFloatOpen(false) }} style={roundBtn} title="Rolar para cima">↑</button>
              <button
                onClick={() => { goTo(currentPage - 1); setFloatOpen(false) }}
                disabled={currentPage <= 1}
                style={{ ...roundBtn, opacity: currentPage <= 1 ? 0.3 : 1 }}
                title="Página anterior"
              >‹</button>
              <button
                onClick={() => { goTo(currentPage + 1); setFloatOpen(false) }}
                disabled={currentPage >= totalPages}
                style={{ ...roundBtn, opacity: currentPage >= totalPages ? 0.3 : 1 }}
                title="Próxima página"
              >›</button>
              <button onClick={() => { window.scrollBy({ top: 380, behavior: 'smooth' }); setFloatOpen(false) }} style={roundBtn} title="Rolar para baixo">↓</button>
            </div>
          )}

          {/* Botão gatilho */}
          <button
            onClick={() => setFloatOpen(o => !o)}
            style={{
              ...roundBtn,
              background: floatOpen ? 'rgba(212,175,55,0.18)' : 'rgba(8,5,3,0.92)',
              borderColor: floatOpen ? 'var(--gold)' : 'rgba(255,255,255,0.22)',
              color: floatOpen ? 'var(--gold)' : 'var(--cream)',
              fontSize: 22,
              transform: floatOpen ? 'rotate(45deg)' : 'none',
              transition: 'all .2s ease',
            }}
            title="Navegação"
          >
            +
          </button>
        </div>
      )}

      {/* ── Bottom nav bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: noteOpen ? 300 : 0,
        background: 'rgba(8,5,3,0.97)', borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '10px 20px', zIndex: 190, flexWrap: 'wrap',
      }}>
        {/* Back to library */}
        <Link
          href={backHref}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
            color: 'var(--cream)', textDecoration: 'none', textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.22)', padding: '6px 14px',
            background: 'rgba(255,255,255,0.07)', flexShrink: 0,
            transition: 'background .15s',
          }}
        >
          {backLabel}
        </Link>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.10)', margin: '0 4px' }} />

        {/* Page navigation */}
        <button onClick={() => goTo(1)}                disabled={currentPage <= 1}               style={ctrlBtn} title="Primeira página">⟨⟨</button>
        <button onClick={() => goTo(currentPage - 10)} disabled={currentPage <= 10}              style={ctrlBtn}>−10</button>
        <button onClick={() => goTo(currentPage - 1)}  disabled={currentPage <= 1}               style={ctrlBtn}>←</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n)) goTo(n) }}
            style={{
              width: 52, textAlign: 'center', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)',
              fontFamily: 'var(--font-mono)', fontSize: 12, padding: '5px 0', outline: 'none',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>/ {totalPages}</span>
        </div>

        <button onClick={() => goTo(currentPage + 1)}  disabled={currentPage >= totalPages}      style={ctrlBtn}>→</button>
        <button onClick={() => goTo(currentPage + 10)} disabled={currentPage + 10 > totalPages}  style={ctrlBtn}>+10</button>
        <button onClick={() => goTo(totalPages)}        disabled={currentPage >= totalPages}      style={ctrlBtn} title="Última página">⟩⟩</button>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.10)', margin: '0 6px' }} />

        {/* Zoom controls */}
        <button onClick={() => zoom(-1)} style={ctrlBtn} title="Diminuir zoom">−</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <input
            type="number"
            min={15}
            max={300}
            value={zoomInput}
            onChange={e => setZoomInput(e.target.value)}
            onBlur={commitZoomInput}
            onKeyDown={e => { if (e.key === 'Enter') { commitZoomInput(); (e.target as HTMLInputElement).blur() } }}
            style={{
              width: 48, textAlign: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--cream)',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              padding: '5px 0', outline: 'none',
              MozAppearance: 'textfield',
            } as React.CSSProperties}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1 }}>%</span>
        </div>
        <button onClick={() => zoom(+1)} style={ctrlBtn} title="Aumentar zoom">+</button>
        <button
          onClick={resetZoom}
          title="Restaurar zoom padrão"
          style={{ ...ctrlBtn, fontSize: 9, letterSpacing: 1, padding: '6px 8px', color: 'var(--faint)' }}
        >
          ↺
        </button>
      </div>
    </div>
  )
}

const ctrlBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  cursor: 'pointer',
  padding: '6px 11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  letterSpacing: 1,
  transition: 'color .15s, border-color .15s, background .15s',
}

const roundBtn: React.CSSProperties = {
  width: 50,
  height: 50,
  borderRadius: '50%',
  background: 'rgba(8,5,3,0.88)',
  border: '1px solid rgba(255,255,255,0.14)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-mono)',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
  transition: 'border-color .15s, background .15s',
  flexShrink: 0,
}
