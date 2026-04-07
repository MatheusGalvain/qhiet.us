'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['Hermetismo', 'Cabala', 'Gnosticismo', 'Alquimia', 'Tarot', 'Rosacruz', 'Maçonaria', 'Magia', 'Astrologia', 'Teosofia']
const ERAS = ['Antiguidade', 'Medieval', 'Renascimento', 'Moderno', 'Contemporâneo']

interface FormFields {
  title: string
  author: string
  year: string
  category: string
  era: string
  description: string
  is_published: boolean
  order_index: string
}

export default function BibliotecaAdminForm({ initial }: { initial?: any }) {
  const router = useRouter()
  const [form, setForm] = useState<FormFields>({
    title:        initial?.title ?? '',
    author:       initial?.author ?? '',
    year:         String(initial?.year ?? ''),
    category:     initial?.category ?? 'Hermetismo',
    era:          initial?.era ?? 'Moderno',
    description:  initial?.description ?? '',
    is_published: initial?.is_published ?? false,
    order_index:  String(initial?.order_index ?? 0),
  })
  const [pdfFile,    setPdfFile]    = useState<File | null>(null)
  const [coverFile,  setCoverFile]  = useState<File | null>(null)
  const [coverUrl,   setCoverUrl]   = useState<string>(initial?.cover_url ?? '')
  const [coverMode,  setCoverMode]  = useState<'file' | 'url'>('file')
  const [saving,     setSaving]     = useState(false)
  const [uploadPct,  setUploadPct]  = useState<number | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)
  const pdfRef   = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  /** Upload PDF directly to R2 via presigned URL — bypasses Next.js 4.5 MB body limit */
  async function uploadPdfToR2(file: File): Promise<string> {
    // 1. Get presigned URL from our API
    const urlRes = await fetch(
      `/api/admin/biblioteca/upload-url?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type || 'application/pdf')}`
    )
    if (!urlRes.ok) {
      const j = await urlRes.json().catch(() => ({}))
      throw new Error((j as any).error ?? 'Erro ao obter URL de upload.')
    }
    const { presignedUrl, key } = await urlRes.json()

    // 2. PUT file directly to R2 (XHR for progress tracking)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/pdf')

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setUploadPct(Math.round((ev.loaded / ev.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload falhou: ${xhr.status} ${xhr.statusText}`))
      }
      xhr.onerror = () => reject(new Error('Erro de rede ao enviar o arquivo.'))
      xhr.send(file)
    })

    return key
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim()) { setError('Título e autor são obrigatórios.'); return }
    if (!initial && !pdfFile) { setError('Selecione um arquivo PDF.'); return }

    setSaving(true)
    setError(null)
    setSuccess(false)
    setUploadPct(null)

    try {
      // Step 1: upload PDF to R2 if a file was selected
      let fileKey: string | null = null
      if (pdfFile) {
        setUploadPct(0)
        fileKey = await uploadPdfToR2(pdfFile)
        setUploadPct(100)
      }

      // Step 2: send metadata (+ optional cover image) to our API
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (fileKey) fd.append('file_key', fileKey)
      if (initial?.id) fd.append('id', initial.id)

      if (coverMode === 'file' && coverFile) {
        fd.append('cover', coverFile)
      } else if (coverMode === 'url' && coverUrl.trim()) {
        fd.append('cover_url_input', coverUrl.trim())
      }

      const res  = await fetch('/api/admin/biblioteca', {
        method: initial ? 'PATCH' : 'POST',
        body: fd,
      })

      const json = await res.json()
      if (!res.ok) throw new Error((json as any).error ?? 'Erro ao salvar.')

      setSuccess(true)
      if (!initial) {
        setForm({ title: '', author: '', year: '', category: 'Hermetismo', era: 'Moderno', description: '', is_published: false, order_index: '0' })
        setPdfFile(null)
        setCoverFile(null)
        setCoverUrl('')
        if (pdfRef.current)   pdfRef.current.value = ''
        if (coverRef.current) coverRef.current.value = ''
      }
      router.refresh()
    } catch (err: any) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
      setUploadPct(null)
    }
  }

  const field = (label: string, key: keyof FormFields, type = 'text', placeholder = '') => (
    <div>
      <label style={labelSt}>{label}</label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="form-input"
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

      {/* Row 1: Título + Autor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field('Título *', 'title', 'text', 'Kybalion')}
        {field('Autor *', 'author', 'text', 'Three Initiates')}
      </div>

      {/* Row 2: Ano + Ordem */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {field('Ano de publicação', 'year', 'number', '1908')}
        {field('Ordem de exibição', 'order_index', 'number', '0')}
      </div>

      {/* Row 3: Categoria + Era */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelSt}>Categoria</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="form-input" style={{ width: '100%' }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelSt}>Era histórica</label>
          <input
            list="eras-list"
            type="text"
            value={form.era}
            onChange={e => setForm(f => ({ ...f, era: e.target.value }))}
            placeholder="Ex: Renascimento, Moderno…"
            className="form-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <datalist id="eras-list">
            {ERAS.map(e => <option key={e} value={e} />)}
          </datalist>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label style={labelSt}>Descrição editorial</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          rows={4}
          className="form-input"
          style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
          placeholder="Resumo editorial do livro…"
        />
      </div>

      {/* PDF */}
      <div>
        <label style={labelSt}>Arquivo PDF {initial ? '(opcional: substituir)' : '*'}</label>
        <input
          ref={pdfRef}
          type="file"
          accept=".pdf"
          onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
          className="form-input"
          style={{ width: '100%', cursor: 'pointer', boxSizing: 'border-box' }}
        />
        {pdfFile && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
            {pdfFile.name} · {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
          </p>
        )}

        {/* Upload progress bar */}
        {uploadPct !== null && (
          <div style={{ marginTop: 8 }}>
            <div style={{
              height: 3,
              background: 'var(--faint)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${uploadPct}%`,
                background: 'var(--gold)',
                transition: 'width 0.2s ease',
              }} />
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', marginTop: 4 }}>
              Enviando PDF… {uploadPct}%
            </p>
          </div>
        )}
      </div>

      {/* Capa */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelSt, marginBottom: 0 }}>Capa (opcional)</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['file', 'url'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setCoverMode(m)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                  padding: '3px 10px', border: '1px solid',
                  borderColor: coverMode === m ? 'rgba(255,255,255,0.30)' : 'var(--faint)',
                  color: coverMode === m ? 'var(--cream)' : 'var(--muted)',
                  background: coverMode === m ? 'rgba(255,255,255,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {m === 'file' ? 'Arquivo' : 'URL'}
              </button>
            ))}
          </div>
        </div>

        {coverMode === 'file' ? (
          <>
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              onChange={e => setCoverFile(e.target.files?.[0] ?? null)}
              className="form-input"
              style={{ width: '100%', cursor: 'pointer', boxSizing: 'border-box' }}
            />
            {coverFile && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                {coverFile.name}
              </p>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <input
              type="url"
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
              placeholder="https://exemplo.com/capa.jpg"
              className="form-input"
              style={{ flex: 1, boxSizing: 'border-box' }}
            />
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="preview"
                style={{ width: 48, height: 64, objectFit: 'cover', border: '1px solid var(--faint)', flexShrink: 0 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
        )}

        {initial?.cover_url && !coverFile && !coverUrl && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
            Capa atual mantida · deixe vazio para não alterar
          </p>
        )}
      </div>

      {/* Toggle publicado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, is_published: !f.is_published }))}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: form.is_published ? 'var(--red)' : 'var(--faint)',
            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s',
            flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 3, left: form.is_published ? 22 : 3,
            width: 18, height: 18, borderRadius: 9, background: '#fff',
            transition: 'left .2s',
          }} />
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {form.is_published ? '◉ Publicado — visível para assinantes' : '○ Rascunho — oculto'}
        </span>
      </div>

      {/* Feedback */}
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1, borderLeft: '2px solid var(--red)', paddingLeft: 10 }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase' }}>
          ✦ Obra salva com sucesso.
        </p>
      )}

      <div>
        <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving
            ? uploadPct !== null && uploadPct < 100
              ? `Enviando PDF… ${uploadPct}%`
              : 'Salvando…'
            : initial ? 'Atualizar obra' : 'Criar obra'
          }
        </button>
      </div>
    </form>
  )
}

const labelSt: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
  color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6,
}
