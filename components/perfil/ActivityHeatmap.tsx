'use client'

interface Props {
  /** Record of ISO date string → activity count */
  activityMap: Record<string, number>
  totalActiveDays: number
}

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const DAYS_PT   = ['D','S','T','Q','Q','S','S']

function toISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeStreaks(activityMap: Record<string, number>) {
  const todayStr = toISO(new Date());
  const sorted = Object.keys(activityMap).sort();
  
  if (sorted.length === 0) return { currentStreak: 0, maxStreak: 0 };

  // 1. Cálculo do MAX Streak
  let maxStreak = 0;
  let run = 0;
 for (let i = 1; i < sorted.length; i++) {
  const prevDate = new Date(sorted[i - 1] + 'T00:00:00'); // Garante fuso local
  prevDate.setDate(prevDate.getDate() + 1);
  
  if (toISO(prevDate) === sorted[i]) {
    run++;
  } else {
    run = 1;
  }
  if (run > maxStreak) maxStreak = run;
}

  // 2. Cálculo do CURRENT Streak (Sequência Atual)
  let currentStreak = 0;
  const curr = new Date();
  curr.setHours(0, 0, 0, 0);

  // Se não fez nada hoje, verifica se fez ontem para manter a chama acesa
  if (!activityMap[toISO(curr)]) {
    curr.setDate(curr.getDate() - 1);
  }

  // Conta para trás enquanto houver atividade
  while (activityMap[toISO(curr)] > 0) {
    currentStreak++;
    curr.setDate(curr.getDate() - 1);
  }

  return { currentStreak, maxStreak };
}
export default function ActivityHeatmap({ activityMap, totalActiveDays }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const currentYear = today.getFullYear()

  // Build weeks from Jan 1 to Dec 31 of current year
  const yearStart = new Date(currentYear, 0, 1) // Jan 1
  const yearEnd   = new Date(currentYear, 11, 31) // Dec 31

  // Align startDate to the Sunday of the week containing Jan 1
  const startDate = new Date(yearStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const weeks: Date[][] = []
  const cursor = new Date(startDate)
  while (cursor <= yearEnd) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const { currentStreak, maxStreak } = computeStreaks(activityMap)

  function cellColor(count: number): string {
    if (count === 0) return 'var(--faint)'
    if (count === 1) return 'rgba(176,42,30,0.5)'
    if (count === 2) return 'rgba(176,42,30,0.75)'
    return 'var(--red)'
  }

  function cellGlow(count: number): string {
    if (count === 0) return 'none'
    const intensity = Math.min(count / 3, 1)
    return `0 0 ${4 + intensity * 6}px rgba(176,42,30,${0.3 + intensity * 0.5})`
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 24,
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>
          ATIVIDADE
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {totalActiveDays} dia{totalActiveDays !== 1 ? 's' : ''} ativos em {currentYear}
        </p>
      </div>

      {/* Calendar grid — horizontal scroll on small screens */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ minWidth: 680 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 3, marginLeft: 22, marginBottom: 5 }}>
            {weeks.map((week, wi) => {
              const first = week[0]
              // Show month label when the 1st or 2nd of a month falls in this week
              const showLabel = first.getDate() <= 7
              return (
                <div
                  key={wi}
                  style={{
                    width: 12,
                    flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: showLabel ? 'var(--muted)' : 'transparent',
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showLabel ? MONTHS_PT[first.getMonth()] : '·'}
                </div>
              )
            })}
          </div>

          {/* Grid body */}
          <div style={{ display: 'flex', gap: 3 }}>
            {/* Day-of-week labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4, flexShrink: 0 }}>
              {DAYS_PT.map((label, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    opacity: i % 2 === 1 ? 1 : 0,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                {week.map((day, di) => {
                  const iso = toISO(day)
                  const isFuture = day > today
                  const count = activityMap[iso] ?? 0

                  return (
                    <div
                      key={di}
                      title={isFuture ? '' : `${iso}${count > 0 ? ` · ${count} atividade${count > 1 ? 's' : ''}` : ''}`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: isFuture ? 'transparent' : cellColor(count),
                        boxShadow: isFuture ? 'none' : cellGlow(count),
                        border: isFuture ? 'none' : count === 0 ? '1px solid rgba(26,20,16,0.5)' : 'none',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        cursor: count > 0 ? 'pointer' : 'default',
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 6, marginTop: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)',
          }}>
            <span>Menos</span>
            {[0, 1, 2, 3, 4].map(v => (
              <div
                key={v}
                style={{
                  width: 12, height: 12, borderRadius: 2,
                  background: cellColor(v),
                  boxShadow: cellGlow(v),
                }}
              />
            ))}
            <span>Mais</span>
          </div>
        </div>
      </div>

      {/* Streak stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--faint)', marginTop: 20 }}>
        {[
          { label: 'Dias ativos', value: String(totalActiveDays) },
          { label: 'Maior sequência', value: `${maxStreak}d` },
          { label: 'Sequência atual', value: `${currentStreak}d` },
        ].map(({ label, value }, i) => (
          <div
            key={i}
            style={{
              padding: '16px 20px',
              borderRight: i < 2 ? '1px solid var(--faint)' : 'none',
              textAlign: 'center',
            }}
          >
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 2, color: 'var(--muted)',
              textTransform: 'uppercase', marginBottom: 6,
            }}>
              {label}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px,3vw,32px)',
              color: currentStreak > 0 && i === 2 ? 'var(--red)' : 'var(--cream)',
              letterSpacing: 2,
              textShadow: currentStreak > 0 && i === 2 ? '0 0 20px rgba(176,42,30,0.5)' : 'none',
            }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
