'use client'

import { useState, useRef } from 'react'

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
  const [title,    setTitle]    = useState('')
  const [author,   setAuthor]   = useState('')
  const [month,    setMonth]    = useState('')
  const [plan,     setPlan]     = useState<'profano' | 'iniciado'>('profano')
  const [coverUrl, setCoverUrl] = useState('')
  const [file,     setFile]     = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status,   setStatus]   = useState<'idle' | 'uploading' | 'saving' | 'done' | 'error'>('idle')
  const [error,    setError]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Selecione um arquivo PDF.'); return }

    setStatus('uploading'); setError(''); setProgress(0)

    // 1. Upload via servidor Next.js → R2 (evita CORS do R2 direto)
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
          if (xhr.status < 300) {
            r2Key = JSON.parse(xhr.responseText).key
            resolve()
          } else {
            reject(new Error(`Upload falhou: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Erro de rede ao enviar o arquivo'))
        xhr.send(form)
      })
    } catch (err: any) {
      setError(err.message); setStatus('error'); return
    }

    // 2. Save metadata to DB with file_key (R2 key)
    setStatus('saving')
    const saveRes = await fetch('/api/admin/livros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author, month, file_key: r2Key, cover_url: coverUrl.trim() || null, plan }),
    })
    if (!saveRes.ok) {
      const d = await saveRes.json()
      setError(d.error ?? 'Erro ao salvar.'); setStatus('error'); return
    }

    setStatus('done')
    setTitle(''); setAuthor(''); setMonth(''); setFile(null); setCoverUrl(''); setProgress(0)
    if (fileRef.current) fileRef.current.value = ''
    onSaved()
    setTimeout(() => setStatus('idle'), 2500)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 580 }}>
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

      <div>
        <label style={labelStyle}>URL da capa (opcional)</label>
        <input type="url" value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://... (imagem JPG/PNG)" style={inputStyle} />
        {coverUrl && (
          <div style={{ marginTop: 8, width: 80, height: 110, border: '1px solid var(--faint)', overflow: 'hidden' }}>
            <img src={coverUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>

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
          {file && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB · será salvo no R2</p>}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
          onChange={e => setFile(e.target.files?.[0] ?? null)} />
      </div>

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
          : status === 'saving' ? 'Salvando…'
          : status === 'done' ? '✓ Livro Adicionado'
          : 'Adicionar Livro →'}
      </button>
    </form>
  )
}
