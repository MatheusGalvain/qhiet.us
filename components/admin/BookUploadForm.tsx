'use client'

import { useState, useRef, useEffect } from 'react'

interface Props { onSaved: () => void }

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--faint)',
  color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: 14,
  padding: '10px 14px', outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11,
  letterSpacing: 3, textTransform: 'uppercase' as const,
  color: 'var(--muted)', marginBottom: 6,
}

export default function BookUploadForm({ onSaved }: Props) {
  const [title,         setTitle]         = useState('')
  const [author,        setAuthor]        = useState('')
  const [month,         setMonth]         = useState('')
  const [plan,          setPlan]          = useState<'profano' | 'iniciado'>('profano')
  const [coverMode,     setCoverMode]     = useState<'url' | 'auto'>('url')
  const [coverUrl,      setCoverUrl]      = useState('')
  const [autoCoverBlob, setAutoCoverBlob] = useState<File | null>(null)
  const [autoCoverPrev, setAutoCoverPrev] = useState<string | null>(null)
  const [autoLoading,   setAutoLoading]   = useState(false)
  const [file,          setFile]          = useState<File | null>(null)
  const [progress,      setProgress]      = useState(0)
  const [status,        setStatus]        = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
  const [error,         setError]         = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // ── pdf.js loader ──────────────────────────────────────────────────────────
  async function loadPdfJs(): Promise<any> {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib
    const V    = '3.11.174'
    const CDNS = [
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${V}/build/pdf.min.js`,
      `https://unpkg.com/pdfjs-dist@${V}/build/pdf.min.js`,
    ]
    for (const src of CDNS) {
      try {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = src; s.onload = () => resolve(); s.onerror = () => reject()
          document.head.appendChild(s)
        })
        if ((window as any).pdfjsLib) break
      } catch { /* tenta próximo CDN */ }
    }
    if (!(window as any).pdfjsLib) throw new Error('Não foi possível carregar o leitor de PDF.')
    ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${V}/build/pdf.worker.min.js`
    return (window as any).pdfjsLib
  }

  /** Extrai a 1ª página do PDF como File JPEG */
  async function extractCoverFromPdf(pdfFile: File): Promise<File> {
    const lib    = await loadPdfJs()
    const buf    = await pdfFile.arrayBuffer()
    const pdf    = await lib.getDocument({ data: buf }).promise
    const page   = await pdf.getPage(1)
    const vp     = page.getViewport({ scale: 2.0 })
    const canvas = document.createElement('canvas')
    canvas.width  = vp.width
    canvas.height = vp.height
    await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Falha ao gerar imagem')); return }
        resolve(new File([blob], 'capa-auto.jpg', { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.92)
    })
  }

  // Re-extrai a capa quando o PDF muda no modo auto
  useEffect(() => {
    if (coverMode !== 'auto' || !file) return
    let cancelled = false
    setAutoLoading(true)
    setAutoCoverBlob(null)
    setAutoCoverPrev(null)
    extractCoverFromPdf(file)
      .then(f => {
        if (cancelled) return
        setAutoCoverBlob(f)
        setAutoCoverPrev(URL.createObjectURL(f))
      })
      .catch(err => { if (!cancelled) setError('Erro ao extrair capa: ' + err.message) })
      .finally(() => { if (!cancelled) setAutoLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, coverMode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Selecione um arquivo PDF.'); return }

    setStatus('uploading'); setError(''); setProgress(0)

    // 1. Upload PDF → R2
    let r2Key = ''
    try {
      const form = new FormData()
      form.append('file', file)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/admin/livros/upload')
        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => {
          if (xhr.status < 300) { r2Key = JSON.parse(xhr.responseText).key; resolve() }
          else reject(new Error(`Upload falhou: ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('Erro de rede ao enviar o arquivo'))
        xhr.send(form)
      })
    } catch (err: any) {
      setError(err.message); setStatus('error'); return
    }

    // 2. Se modo auto, faz upload da capa gerada e obtém URL
    let finalCoverUrl: string | null = coverUrl.trim() || null
    if (coverMode === 'auto' && autoCoverBlob) {
      setStatus('saving')
      try {
        const fd = new FormData()
        fd.append('cover', autoCoverBlob)
        const res = await fetch('/api/admin/livros/upload-cover', { method: 'POST', body: fd })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error((j as any).error ?? 'Erro ao salvar capa.')
        }
        const { cover_url } = await res.json()
        finalCoverUrl = cover_url
      } catch (err: any) {
        setError(err.message); setStatus('error'); return
      }
    }

    // 3. Salva metadados no DB
    setStatus('saving')
    const saveRes = await fetch('/api/admin/livros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, month, file_key: r2Key, cover_url: finalCoverUrl, plan }),
    })
    if (!saveRes.ok) {
      const d = await saveRes.json()
      setError(d.error ?? 'Erro ao salvar.'); setStatus('error'); return
    }

    setStatus('done')
    setTitle(''); setAuthor(''); setMonth(''); setFile(null)
    setCoverUrl(''); setAutoCoverBlob(null); setAutoCoverPrev(null)
    setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    onSaved()
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 580 }}>

      {/* Título + Autor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Título</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="O Kybalion" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Autor</label>
          <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Três Iniciados" style={inputStyle} />
        </div>
      </div>

      {/* Mês + Plano */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Mês de referência</label>
          <input required type="month" value={month} onChange={e => setMonth(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
        <div>
          <label style={labelStyle}>Disponível para</label>
          <select value={plan} onChange={e => setPlan(e.target.value as 'profano' | 'iniciado')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="profano">Profano (todos)</option>
            <option value="iniciado">Iniciado (assinante)</option>
          </select>
        </div>
      </div>

      {/* Capa */}
      <div>
        {/* Header com toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Capa (opcional)</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {([['url', 'URL'], ['auto', '◎ Auto PDF']] as const).map(([m, lbl]) => (
              <button
                key={m}
                type="button"
                onClick={() => setCoverMode(m)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                  padding: '3px 10px', border: '1px solid',
                  borderColor: coverMode === m ? (m === 'auto' ? 'var(--gold)' : 'rgba(255,255,255,0.30)') : 'var(--faint)',
                  color:       coverMode === m ? (m === 'auto' ? 'var(--gold)' : 'var(--cream)') : 'var(--muted)',
                  background:  coverMode === m ? (m === 'auto' ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.06)') : 'transparent',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Modo URL */}
        {coverMode === 'url' && (
          <>
            <input
              type="url"
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
              placeholder="https://... (imagem JPG/PNG)"
              style={inputStyle}
            />
            {coverUrl && (
              <div style={{ marginTop: 8, width: 80, height: 110, border: '1px solid var(--faint)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </>
        )}

        {/* Modo Auto */}
        {coverMode === 'auto' && (
          <div style={{ marginTop: 4 }}>
            {!file ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>
                ↓ Selecione o arquivo PDF abaixo — a capa será extraída da 1ª página.
              </p>
            ) : autoLoading ? (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 1 }}>
                ◌ Extraindo primeira página…
              </p>
            ) : autoCoverPrev ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={autoCoverPrev}
                  alt="capa gerada"
                  style={{ width: 64, height: 90, objectFit: 'cover', border: '1px solid var(--gold)', flexShrink: 0 }}
                />
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: 1, marginBottom: 6 }}>
                    ✦ Capa extraída da 1ª página do PDF
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!file) return
                      setAutoCoverBlob(null); setAutoCoverPrev(null); setAutoLoading(true)
                      extractCoverFromPdf(file)
                        .then(f => { setAutoCoverBlob(f); setAutoCoverPrev(URL.createObjectURL(f)) })
                        .catch(err => setError('Erro ao extrair capa: ' + err.message))
                        .finally(() => setAutoLoading(false))
                    }}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                      padding: '3px 10px', border: '1px solid var(--faint)',
                      color: 'var(--muted)', background: 'transparent', cursor: 'pointer',
                    }}
                  >
                    Regenerar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* PDF */}
      <div>
        <label style={labelStyle}>Arquivo PDF</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1px dashed ${file ? 'var(--gold)' : 'var(--faint)'}`,
            padding: '28px 24px', textAlign: 'center', cursor: 'pointer',
            background: file ? 'rgba(184,134,11,0.04)' : 'transparent',
          }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: file ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase', marginBottom: file ? 4 : 0 }}>
            {file ? file.name : '+ Clique para selecionar PDF'}
          </p>
          {file && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB · será salvo no R2
            </p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Barra de progresso */}
      {status === 'uploading' && (
        <div>
          <div style={{ height: 3, background: 'var(--faint)' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--gold)', transition: 'width .2s' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', marginTop: 4 }}>
            Enviando para R2… {progress}%
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', borderLeft: '3px solid var(--red)', background: 'var(--red-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'uploading' || status === 'saving'}
        style={{
          padding: '12px 28px',
          background: status === 'done' ? 'transparent' : 'var(--red)',
          border: status === 'done' ? '1px solid var(--gold)' : '1px solid var(--red)',
          color: status === 'done' ? 'var(--gold)' : '#fff',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase',
          cursor: (status === 'uploading' || status === 'saving') ? 'wait' : 'pointer',
          opacity: (status === 'uploading' || status === 'saving') ? 0.6 : 1,
          alignSelf: 'flex-start',
        }}
      >
        {status === 'uploading' ? `Enviando… ${progress}%`
          : status === 'saving'   ? 'Salvando…'
          : status === 'done'     ? '✓ Livro Adicionado'
          : 'Adicionar Livro →'}
      </button>

    </form>
  )
}
