interface SigilProps {
  size?: number
  opacity?: number
}

export default function Sigil({ size = 240, opacity = 0.4 }: SigilProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      className="sigil-spin"
    >
      {/* Outer ring */}
      <circle cx="120" cy="120" r="114" fill="none" stroke="#1a1410" strokeWidth="1" />
      {/* Inner dashed ring */}
      <circle cx="120" cy="120" r="94" fill="none" stroke="#221a0e" strokeWidth=".5" strokeDasharray="3 5" />

      {/* Circular text path */}
      <path
        id="ct"
        d="M120,120 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"
        fill="none"
      />
      <text
        fontFamily="'DM Mono',monospace"
        fontSize="7"
        fill="#2a1e0c"
        letterSpacing="4"
      >
        <textPath href="#ct">
          אין סוף · AIN SOPH · SEM FIM · ∞ · PORTA PATET · LUMEN ARDET · אין סוף · AIN SOPH · SEM FIM · ∞ ·
        </textPath>
      </text>

      {/* Star of David (upward) */}
      <polygon
        points="120,30 142,75 190,75 153,103 167,150 120,122 73,150 87,103 50,75 98,75"
        fill="none"
        stroke="#c8960a"
        strokeWidth="1"
        opacity=".4"
      />
      {/* Star of David (downward) */}
      <polygon
        points="120,210 142,165 190,165 153,137 167,90 120,118 73,90 87,137 50,165 98,165"
        fill="none"
        stroke="#c8960a"
        strokeWidth="1"
        opacity=".4"
      />

      {/* Center eye */}
      <circle cx="120" cy="120" r="20" fill="none" stroke="#b02a1e" strokeWidth=".8" opacity=".4" />
      <circle cx="120" cy="120" r="3" fill="#b02a1e" opacity=".3" />
    </svg>
  )
}

/** Smaller version with counter-rotation for nested sigils */
export function SigilInner({ size = 160 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', opacity: 0.25 }}
      className="sigil-spin-rev"
    >
      <circle cx="120" cy="120" r="80" fill="none" stroke="#2a1e0c" strokeWidth=".5" strokeDasharray="2 8" />
      <polygon
        points="120,50 148,100 200,100 158,132 174,184 120,150 66,184 82,132 40,100 92,100"
        fill="none"
        stroke="#c8960a"
        strokeWidth=".8"
        opacity=".3"
      />
    </svg>
  )
}
