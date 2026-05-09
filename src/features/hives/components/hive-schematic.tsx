interface HiveSchematicProps {
  nidoFrameCount: number
  melariCount: number
  hasApiscampo: boolean
  hasPropolisNet: boolean
  hasPollenTrap: boolean
  hasActiveQueen: boolean | 'non_cercata'
}

const SVG_W  = 72
const BOT_H  = 10
const POLL_H = 6
const NIDO_H = 50
const APIS_H = 7
const MEL_H  = 20
const PROP_H = 8

const NIDO_X = 4, NIDO_W = 64
const MEL_X  = 8, MEL_W  = 56

export function HiveSchematic({
  nidoFrameCount,
  melariCount,
  hasApiscampo,
  hasPropolisNet,
  hasPollenTrap,
  hasActiveQueen,
}: HiveSchematicProps) {
  const effectiveMelari = Math.min(melariCount, 2)

  // Build layout bottom-up, then flip to top-down coordinates
  let curY = 0
  const BOT_OFF  = curY; curY += BOT_H
  const POLL_OFF = curY; if (hasPollenTrap)  curY += POLL_H
  const NIDO_OFF = curY; curY += NIDO_H
  const APIS_OFF = curY; if (hasApiscampo)   curY += APIS_H
  const melOffsets: number[] = []
  for (let i = 0; i < effectiveMelari; i++) { melOffsets.push(curY); curY += MEL_H }
  const PROP_OFF = curY; if (hasPropolisNet) curY += PROP_H

  const totalH = curY

  function toY(off: number, h: number) { return totalH - off - h }

  const botY  = toY(BOT_OFF,  BOT_H)
  const pollY = toY(POLL_OFF, POLL_H)
  const nidoY = toY(NIDO_OFF, NIDO_H)
  const apisY = toY(APIS_OFF, APIS_H)
  const propY = toY(PROP_OFF, PROP_H)
  const melYs = melOffsets.map(o => toY(o, MEL_H))

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${totalH}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full h-auto"
    >
      <defs>
        <pattern id="propolis-hatch" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="4" y2="0" stroke="#4A6E3C" strokeWidth="1" />
        </pattern>
        <pattern id="pollen-hatch" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="4" stroke="#76500F" strokeWidth="1" />
          <line x1="4" y1="0" x2="0" y2="4" stroke="#76500F" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Propolis net — above melari if present, else above nido */}
      {hasPropolisNet && (
        <rect x={MEL_X} y={propY} width={MEL_W} height={PROP_H} fill="url(#propolis-hatch)" rx={1} />
      )}

      {/* Melari */}
      {melYs.map((y, i) => (
        <g key={i}>
          <rect x={MEL_X} y={y} width={MEL_W} height={MEL_H} fill="#A06D14" stroke="#76500F" strokeWidth={1} rx={1} />
          <line x1={MEL_X} y1={y + 7}  x2={MEL_X + MEL_W} y2={y + 7}  stroke="#76500F" strokeWidth={0.5} />
          <line x1={MEL_X} y1={y + 14} x2={MEL_X + MEL_W} y2={y + 14} stroke="#76500F" strokeWidth={0.5} />
        </g>
      ))}

      {/* Apiscampo */}
      {hasApiscampo && (
        <rect x={MEL_X} y={apisY} width={MEL_W} height={APIS_H} fill="#5B8FA0" rx={1} />
      )}

      {/* Nido */}
      <rect x={NIDO_X} y={nidoY} width={NIDO_W} height={NIDO_H} fill="#5A4830" rx={2} />

      {/* Queen */}
      {hasActiveQueen === true && (
        <text x={SVG_W / 2} y={nidoY + 20} textAnchor="middle" fontSize={18} fill="#E5A938">♛</text>
      )}
      {hasActiveQueen === 'non_cercata' && (
        <text x={SVG_W / 2} y={nidoY + 20} textAnchor="middle" fontSize={14} fill="#888780" fontFamily="Inter, system-ui, sans-serif">?</text>
      )}

      {/* Frame count */}
      <text
        x={SVG_W / 2} y={nidoY + NIDO_H - 7}
        textAnchor="middle" fontSize={8.5}
        fill="#FAF6ED" fontFamily="Inter, system-ui, sans-serif"
      >
        {nidoFrameCount} telai
      </text>

      {/* Pollen trap */}
      {hasPollenTrap && (
        <rect x={NIDO_X} y={pollY} width={NIDO_W} height={POLL_H} fill="url(#pollen-hatch)" stroke="#A06D14" strokeWidth={0.5} />
      )}

      {/* Bottom board */}
      <rect x={0} y={botY} width={SVG_W} height={BOT_H} fill="#3F311F" rx={2} />
    </svg>
  )
}
