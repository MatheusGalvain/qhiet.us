export default function GrimorioLoading() {
  return (
    <div className="profile-layout">
      {/* Sidebar skeleton */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--faint)', padding: '40px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a1410', marginBottom: 16 }} />
        <div style={{ width: '70%', height: 12, background: '#1a1410', marginBottom: 10, borderRadius: 2 }} />
        <div style={{ width: '50%', height: 10, background: '#131008', borderRadius: 2 }} />
      </div>

      {/* Content skeleton */}
      <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)', flex: 1 }}>
        <div style={{ width: 80, height: 10, background: '#1a1410', marginBottom: 20, borderRadius: 2 }} />
        <div style={{ width: '40%', height: 48, background: '#1a1410', marginBottom: 32, borderRadius: 2 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ border: '1px solid #1a1410', background: '#0a0806' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #0f0c09', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: 40, height: 8, background: '#131008', marginBottom: 8, borderRadius: 2 }} />
                  <div style={{ width: 160 + i * 20, height: 14, background: '#1a1410', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{ width: 60, height: 8, background: '#131008', borderRadius: 2 }} />
                  <div style={{ width: 50, height: 8, background: '#131008', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ padding: '14px 20px 18px', background: '#080503' }}>
                <div style={{ width: '90%', height: 10, background: '#131008', marginBottom: 8, borderRadius: 2 }} />
                <div style={{ width: '65%', height: 10, background: '#131008', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
