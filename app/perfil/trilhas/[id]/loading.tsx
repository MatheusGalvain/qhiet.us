export default function TrailDetailLoading() {
  return (
    <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)' }}>
      {/* Back link */}
      <div style={{ width: 80, height: 10, background: '#1a1410', marginBottom: 24, borderRadius: 2 }} />

      {/* Tags */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 80, height: 22, background: '#1a1410', borderRadius: 2 }} />
        <div style={{ width: 60, height: 22, background: '#1a1410', borderRadius: 2 }} />
      </div>

      {/* Title */}
      <div style={{ width: '55%', height: 48, background: '#1a1410', marginBottom: 14, borderRadius: 2 }} />
      <div style={{ width: '80%', height: 14, background: '#131008', marginBottom: 6, borderRadius: 2 }} />
      <div style={{ width: '60%', height: 14, background: '#131008', marginBottom: 24, borderRadius: 2 }} />

      {/* Info banner */}
      <div style={{ width: 280, height: 36, background: '#1a1410', marginBottom: 40, borderRadius: 2 }} />

      {/* SVG map placeholder */}
      <div style={{ width: '100%', height: 400, background: '#0a0806', border: '1px solid #1a1410', borderRadius: 2 }} />
    </div>
  )
}
