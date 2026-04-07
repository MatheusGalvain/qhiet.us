'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TrailReader from './TrailReader'

interface Tx {
  id: string
  title: string
  content: string
  order_index: number
  read_time_minutes: number
  section_title?: string | null
}

interface Trail {
  id: string
  title: string
  xp_reward: number
  duration_days: number
}

// A section is a named group of transmissions (or a single solo tx with no section_title)
interface Section {
  key: string            // unique key for this section
  title: string | null   // null = solo tx (show tx title instead)
  transmissions: Tx[]
}

interface Props {
  trail: Trail
  transmissoes: Tx[]
  completedSet: string[]
  isTrailCompleted: boolean
  isSubscriber: boolean
}

// ─── Group transmissions into sections ────────────────────────
function groupIntoSections(txList: Tx[]): Section[] {
  const sections: Section[] = []
  const seen = new Map<string, Section>()

  for (const tx of txList) {
    const sTitle = tx.section_title?.trim() || null

    if (sTitle === null) {
      // Solo transmission — its own section node
      sections.push({ key: `solo_${tx.id}`, title: null, transmissions: [tx] })
    } else {
      if (seen.has(sTitle)) {
        seen.get(sTitle)!.transmissions.push(tx)
      } else {
        const section: Section = { key: `sec_${sTitle}`, title: sTitle, transmissions: [tx] }
        sections.push(section)
        seen.set(sTitle, section)
      }
    }
  }

  return sections
}

// ─── Spiral layout ────────────────────────────────────────────
function spiralPositions(count: number, cx: number, cy: number) {
  if (count === 0) return []
  const positions: { x: number; y: number }[] = []
  const PER_LAYER = 5
  const BASE_RADIUS = 110
  const RADIUS_STEP = 120

  for (let i = 0; i < count; i++) {
    const layer = Math.floor(i / PER_LAYER)
    const posInLayer = i % PER_LAYER
    const inThisLayer = Math.min(PER_LAYER, count - layer * PER_LAYER)
    const angleStep = (2 * Math.PI) / inThisLayer
    const radius = BASE_RADIUS + layer * RADIUS_STEP
    const offset = layer % 2 === 0 ? 0 : angleStep / 2
    const angle = posInLayer * angleStep + offset - Math.PI / 2
    positions.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) })
  }
  return positions
}

// ─── Constellation layout ─────────────────────────────────────
function constellationPositions(count: number, cx: number, cy: number) {
  if (count === 0) return []
  const positions: { x: number; y: number }[] = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  const MIN_R = 55, MAX_R = 250
  for (let i = 0; i < count; i++) {
    const r = MIN_R + (MAX_R - MIN_R) * Math.sqrt((i + 0.5) / Math.max(count, 1))
    const t = i * phi
    positions.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) })
  }
  return positions
}

// ─── Section panel (shown when clicking a multi-tx section) ───
function SectionPanel({
  section,
  completedIds,
  isUnlocked,
  onSelectTx,
  onClose,
}: {
  section: Section
  completedIds: Set<string>
  isUnlocked: boolean
  onSelectTx: (tx: Tx) => void
  onClose: () => void
}) {
  const done = section.transmissions.filter(tx => completedIds.has(tx.id)).length
  const total = section.transmissions.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = done === total

  return (
    <div style={{ border: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', minHeight: 320 }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>
            Seção
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)', letterSpacing: 1 }}>
            {section.title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: allDone ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase' }}>
            {allDone ? '✦ ' : ''}{done}/{total}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--faint)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: allDone ? 'var(--gold)' : 'var(--red)', transition: 'width .4s ease' }} />
      </div>

      {/* Transmission list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {section.transmissions.map((tx, i) => {
          const txDone = completedIds.has(tx.id)
          const txUnlocked = isUnlocked && (i === 0 || completedIds.has(section.transmissions[i - 1].id))
          return (
            <button
              key={tx.id}
              onClick={() => txUnlocked && onSelectTx(tx)}
              disabled={!txUnlocked}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                borderBottom: i < section.transmissions.length - 1 ? '1px solid var(--faint)' : 'none',
                cursor: txUnlocked ? 'pointer' : 'not-allowed',
                textAlign: 'left',
                opacity: txUnlocked ? 1 : 0.4,
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (txUnlocked) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: txDone ? '#c8960a' : 'var(--muted)', width: 20, flexShrink: 0 }}>
                {txDone ? '✦' : String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: txDone ? '#c8960a' : 'var(--cream)', letterSpacing: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tx.title}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginTop: 2 }}>
                  ~{tx.read_time_minutes}min
                </p>
              </div>
              {txUnlocked && !txDone && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
                  Ler →
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main TrailMap component ───────────────────────────────────
export default function TrailMap({ trail, transmissoes, completedSet, isTrailCompleted, isSubscriber }: Props) {
  const sorted = [...transmissoes].sort((a, b) => a.order_index - b.order_index)
  const sections = groupIntoSections(sorted)

  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [activeTx, setActiveTx] = useState<Tx | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'xp' | 'done' } | null>(null)
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set(completedSet))
  const [trailDone, setTrailDone] = useState(isTrailCompleted)
  const [layout, setLayout] = useState<'spiral' | 'constellation'>('spiral')
  const router = useRouter()

  const totalTx = sorted.length
  const completedTx = localCompleted.size

  const W = 700, H = 660, CX = W / 2, CY = H / 2

  const positions = layout === 'spiral'
    ? spiralPositions(sections.length, CX, CY)
    : constellationPositions(sections.length, CX, CY)

  // A section is unlocked if all transmissions in the previous section are completed
  function isSectionUnlocked(secIdx: number): boolean {
    if (secIdx === 0) return true
    const prev = sections[secIdx - 1]
    return prev.transmissions.every(tx => localCompleted.has(tx.id))
  }

  function isSectionDone(section: Section): boolean {
    return section.transmissions.every(tx => localCompleted.has(tx.id))
  }

  function sectionProgress(section: Section): { done: number; total: number } {
    return {
      done: section.transmissions.filter(tx => localCompleted.has(tx.id)).length,
      total: section.transmissions.length,
    }
  }

  function handleNodeClick(idx: number) {
    if (!isSectionUnlocked(idx)) return
    const section = sections[idx]
    if (section.transmissions.length === 1) {
      // Solo section — open reader directly
      setActiveSection(section)
      setActiveTx(section.transmissions[0])
    } else {
      // Multi-tx section — show section overview
      setActiveSection(section)
      setActiveTx(null)
    }
  }

  const handleMarkComplete = useCallback(async (txId: string) => {
    if (localCompleted.has(txId)) return
    try {
      const res = await fetch('/api/trilhas/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trail_id: trail.id, transmissao_id: txId }),
      })
      const json = await res.json()
      const newSet = new Set(localCompleted)
      newSet.add(txId)
      setLocalCompleted(newSet)

      if (json.completed && json.xp_earned > 0) {
        setTrailDone(true)
        setToast({ msg: `+${json.xp_earned} XP — Trilha concluída!`, type: 'xp' })
        setTimeout(() => { setToast(null); router.refresh() }, 4000)
      } else {
        const remaining = totalTx - newSet.size
        if (remaining > 0) {
          setToast({ msg: `Transmissão concluída — ${remaining} restantes`, type: 'done' })
          setTimeout(() => setToast(null), 2500)
        }
      }
    } catch (_) {}
  }, [localCompleted, trail.id, totalTx, router])

  // Get current tx index within its section for navigation
  const sectionTxList = activeTx && activeSection ? activeSection.transmissions : []
  const currentTxIdx = activeTx ? sectionTxList.findIndex(tx => tx.id === activeTx.id) : -1
  const canNavigatePrev = currentTxIdx > 0
  const canNavigateNext = currentTxIdx >= 0 && currentTxIdx < sectionTxList.length - 1
    && localCompleted.has(sectionTxList[currentTxIdx].id)

  function handleNavigate(dir: 'prev' | 'next') {
    const nextIdx = currentTxIdx + (dir === 'next' ? 1 : -1)
    if (nextIdx >= 0 && nextIdx < sectionTxList.length) {
      setActiveTx(sectionTxList[nextIdx])
    }
  }

  function renderLines() {
    return sections.map((_, i) => {
      if (i === 0) return null
      const from = positions[i - 1]
      const to = positions[i]
      if (!from || !to) return null
      const prevDone = isSectionDone(sections[i - 1])
      return (
        <line key={`line-${i}`}
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={prevDone ? '#c8960a' : '#2a2218'}
          strokeWidth={prevDone ? 1.5 : 1}
          strokeDasharray={prevDone ? 'none' : '4 6'}
          opacity={prevDone ? 0.55 : 0.35}
        />
      )
    })
  }

  function renderNodes() {
    return sections.map((section, i) => {
      const pos = positions[i]
      if (!pos) return null
      const done = isSectionDone(section)
      const unlocked = isSectionUnlocked(i)
      const isActive = activeSection?.key === section.key
      const { done: doneCount, total } = sectionProgress(section)
      const isMulti = section.transmissions.length > 1

      const r = isMulti ? 24 : 20
      const stroke = done ? '#c8960a' : unlocked ? '#b02a1e' : '#2a2218'
      const fill = done ? 'rgba(200,150,10,0.15)' : unlocked ? 'rgba(176,42,30,0.12)' : 'rgba(0,0,0,0)'
      const textColor = done ? '#c8960a' : unlocked ? '#e8d5b0' : '#3a3228'

      // Node label: section title or tx title (solo)
      const nodeLabel = section.title ?? section.transmissions[0]?.title ?? ''
      const truncLabel = nodeLabel.length > 28 ? nodeLabel.slice(0, 28) + '…' : nodeLabel

      return (
        <g key={section.key} onClick={() => handleNodeClick(i)}
          style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}
          className={unlocked ? 'trail-node' : ''}
        >
          {isActive && (
            <circle cx={pos.x} cy={pos.y} r={r + 8}
              fill="none" stroke="#c8960a" strokeWidth={1} opacity={0.3}
              className="trail-node-pulse"
            />
          )}

          <circle cx={pos.x} cy={pos.y} r={r}
            fill={fill} stroke={stroke}
            strokeWidth={isActive ? 1.5 : 1}
            opacity={unlocked ? 1 : 0.35}
          />

          {/* Inner ring for multi-tx sections */}
          {isMulti && (
            <circle cx={pos.x} cy={pos.y} r={r - 5}
              fill="none" stroke={stroke}
              strokeWidth={0.6} opacity={unlocked ? 0.5 : 0.2}
              strokeDasharray="2 4"
            />
          )}

          <text x={pos.x} y={pos.y + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="var(--font-mono)" fontSize={done ? 14 : 10}
            fill={textColor} opacity={unlocked ? 1 : 0.35}
          >
            {done ? '✦' : unlocked ? (isMulti ? `${doneCount}/${total}` : String(i + 1).padStart(2, '0')) : '○'}
          </text>

          {/* Label below node */}
          <foreignObject
            x={pos.x - 72} y={pos.y + r + 10}
            width={144} height={52}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: 1,
              color: unlocked ? (done ? '#c8960a' : '#9a8878') : '#3a3228',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1.4,
              wordBreak: 'break-word',
              opacity: unlocked ? 1 : 0.35,
            }}>
              {truncLabel}
              {isMulti && !done && (
                <span style={{ display: 'block', fontSize: 8, opacity: 0.6, marginTop: 2 }}>
                  {section.transmissions.length} transmissões
                </span>
              )}
            </div>
          </foreignObject>
        </g>
      )
    })
  }

  function renderCenter() {
    const symbol = trailDone ? '✦' : '◈'
    return (
      <g className={trailDone ? 'center-sigil-done' : 'center-sigil'}>
        {trailDone && (
          <>
            <circle cx={CX} cy={CY} r={32} fill="none" stroke="#c8960a" strokeWidth={0.6} opacity={0.3} className="center-ring-1" />
            <circle cx={CX} cy={CY} r={44} fill="none" stroke="#c8960a" strokeWidth={0.4} opacity={0.15} className="center-ring-2" />
          </>
        )}
        {layout === 'spiral' && [110, 230].map(r => (
          <circle key={r} cx={CX} cy={CY} r={r}
            fill="none" stroke="#c8960a" strokeWidth={0.4}
            strokeDasharray="2 10" opacity={0.08} />
        ))}
        <circle cx={CX} cy={CY} r={20}
          fill={trailDone ? 'rgba(200,150,10,0.1)' : 'none'}
          stroke="#c8960a" strokeWidth={trailDone ? 1 : 0.8}
          opacity={trailDone ? 0.9 : 0.25}
          className={trailDone ? 'center-pulse' : ''}
        />
        <text x={CX} y={CY + 1}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="var(--font-mono)" fontSize={trailDone ? 14 : 10}
          fill="#c8960a" opacity={trailDone ? 1 : 0.4}
          className={trailDone ? 'center-symbol-glow' : ''}
        >
          {symbol}
        </text>
        {!trailDone && (
          <text x={CX} y={CY + 28} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={8} fill="#c8960a" opacity={0.3} letterSpacing={1}
          >
            {completedTx}/{totalTx}
          </text>
        )}
        {trailDone && (
          <text x={CX} y={CY + 32} textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={7} fill="#c8960a" opacity={0.7} letterSpacing={2}
            style={{ textTransform: 'uppercase' }}
          >
            CONCLUÍDA
          </text>
        )}
      </g>
    )
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: toast.type === 'xp' ? '#c8960a' : '#b02a1e', color: '#000',
          fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 2,
          padding: '14px 32px', textTransform: 'uppercase',
          boxShadow: '0 4px 32px rgba(0,0,0,0.6)', animation: 'fadeIn .3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Layout toggle */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase' }}>Mapa:</span>
        {(['spiral', 'constellation'] as const).map(l => (
          <button key={l} onClick={() => setLayout(l)} style={{
            background: 'none',
            border: `1px solid ${layout === l ? 'var(--gold-dim)' : 'var(--faint)'}`,
            color: layout === l ? 'var(--gold)' : 'var(--muted)',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
            padding: '4px 10px', cursor: 'pointer', transition: 'all .15s',
          }}>
            {l === 'spiral' ? '◎ Espiral' : '✦ Constelação'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        {/* Map */}
        <div style={{ flex: '1 1 300px', minWidth: 0, position: 'relative' }}>
          <div style={{ border: '1px solid var(--faint)', background: 'var(--surface)', overflow: 'hidden' }}>
            <div style={{ height: 2, background: 'var(--faint)' }}>
              <div style={{
                height: '100%', width: `${totalTx > 0 ? (completedTx / totalTx) * 100 : 0}%`,
                background: trailDone ? '#c8960a' : '#b02a1e', transition: 'width .5s ease',
              }} />
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
              {renderCenter()}
              {renderLines()}
              {renderNodes()}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(200,150,10,0.3)', border: '1px solid #c8960a', display: 'inline-block' }} />
              Concluído
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(176,42,30,0.2)', border: '1px solid #b02a1e', display: 'inline-block' }} />
              Disponível
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'none', border: '1px solid #2a2218', display: 'inline-block', opacity: 0.4 }} />
              Bloqueado
            </span>
          </div>
        </div>

        {/* Reader / Section panel */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {activeTx && activeSection ? (
            // Reading a specific transmission
            <TrailReader
              tx={activeTx}
              trailId={trail.id}
              isCompleted={localCompleted.has(activeTx.id)}
              isUnlocked={true}
              onMarkComplete={handleMarkComplete}
              onClose={() => {
                setActiveTx(null)
                // If section has multiple tx, go back to section view
                if (activeSection.transmissions.length > 1) {
                  // stay in section view
                } else {
                  setActiveSection(null)
                }
              }}
              totalCount={sectionTxList.length}
              currentIndex={currentTxIdx}
              onNavigate={handleNavigate}
              canNavigateNext={canNavigateNext}
              canNavigatePrev={canNavigatePrev}
              isSubscriber={isSubscriber}
              // Show "back to section" if multi-tx
              sectionTitle={activeSection.transmissions.length > 1 ? activeSection.title : null}
              onBackToSection={activeSection.transmissions.length > 1 ? () => setActiveTx(null) : undefined}
            />
          ) : activeSection && activeSection.transmissions.length > 1 ? (
            // Section overview (multi-tx)
            <SectionPanel
              section={activeSection}
              completedIds={localCompleted}
              isUnlocked={isSectionUnlocked(sections.findIndex(s => s.key === activeSection.key))}
              onSelectTx={tx => setActiveTx(tx)}
              onClose={() => setActiveSection(null)}
            />
          ) : (
            // Nothing selected
            <div style={{
              border: '1px solid var(--faint)', padding: '40px 32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 280, textAlign: 'center',
            }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                {trailDone ? '✦ Trilha concluída' : 'Selecione um nó no mapa'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>
                {trailDone
                  ? `Você obteve ${trail.xp_reward} XP por completar esta trilha.`
                  : sections.some(s => s.transmissions.length > 1)
                    ? 'Nós com anel duplo contêm múltiplas transmissões.'
                    : 'Clique em um nó disponível para iniciar a leitura.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
        .trail-node circle { transition: stroke-width .15s, opacity .15s; }
        .trail-node:hover circle { opacity: 1 !important; }
        @keyframes pulse { 0%, 100% { opacity: .3 } 50% { opacity: .7 } }
        .trail-node-pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes centerGlow {
          0%, 100% { opacity: 0.9; filter: drop-shadow(0 0 4px rgba(200,150,10,0.6)); }
          50%       { opacity: 1;   filter: drop-shadow(0 0 12px rgba(200,150,10,0.9)); }
        }
        .center-pulse { animation: centerGlow 2.5s ease-in-out infinite; }
        .center-symbol-glow { animation: centerGlow 2.5s ease-in-out infinite; }
        .center-ring-1 { animation: pulse 3s ease-in-out infinite; }
        .center-ring-2 { animation: pulse 3s ease-in-out infinite 1.5s; }
      `}</style>
    </div>
  )
}
