export default function PerfilLoading() {
  return (
    <div className="profile-layout">
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--faint)', padding: '40px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1410', marginBottom: 16 }} />
        <div style={{ width: '70%', height: 12, background: '#1a1410', marginBottom: 10, borderRadius: 2 }} />
        <div style={{ width: '50%', height: 10, background: '#131008', borderRadius: 2 }} />
      </div>
      {/* Content */}
      <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)', flex: 1 }}>
        <div style={{ width: '60%', height: 40, background: '#1a1410', marginBottom: 32, borderRadius: 2 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, background: '#0a0806', border: '1px solid #1a1410', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
