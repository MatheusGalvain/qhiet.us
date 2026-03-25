import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export default async function TermosPage() {
   return(
        <div style={{ padding: 'clamp(40px,6vw,72px) var(--px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 20 }}>Você está em · Termos de Uso</p>
            <h1 className="hero-title-xl">
              Termos <span style={{ color: 'var(--red)' }}> De </span> Uso
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.5vw,19px)', color: 'var(--muted)', lineHeight: 1.8, marginTop: 20 }}>
              Escolha como deseja percorrer o caminho. O conhecimento aguarda — a profundidade do acesso é sua escolha.
            </p>
          </div>
        </div>
    )
}