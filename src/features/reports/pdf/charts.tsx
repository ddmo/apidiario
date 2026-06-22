import { Svg, Line, Path, Polygon, Circle, Rect, Text, G, Defs, ClipPath } from '@react-pdf/renderer'
import { PDF_COLORS } from './colors'

let clipIdCounter = 0
function nextClipId(): string {
  clipIdCounter += 1
  return `plot-clip-${clipIdCounter}`
}

/**
 * Catmull-Rom → cubic Bézier smoothing, so trend lines have no sharp corners.
 * Control points are clamped to [yClamp.min, yClamp.max] (pixel space) because
 * react-pdf's SVG clipPath does not reliably mask Bézier overshoot — without
 * clamping, sharp valleys/peaks can curve past the plot's baseline or top.
 */
function smoothPathD(points: { x: number; y: number }[], yClamp?: { min: number; max: number }): string {
  if (points.length < 2) return ''
  const clampY = (y: number) => (yClamp ? Math.min(Math.max(y, yClamp.min), yClamp.max) : y)
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1]!
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6)
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6)
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

/** Step-after path: holds each level until the next reading, then jumps — honest for discrete/ordinal categories. */
function stepPathD(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let i = 1; i < points.length; i++) {
    d += ` H ${points[i]!.x} V ${points[i]!.y}`
  }
  return d
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

/** Decorative honeycomb band, meant to bleed edge-to-edge at the top of the cover page. */
export function HoneycombBand({ width = 595, height = 70 }: { width?: number; height?: number }) {
  const r = 19
  const hexW = r * Math.sqrt(3)
  const rowGapY = r * 1.5
  const cols = Math.ceil(width / hexW) + 2
  const colors = [PDF_COLORS.honey300, PDF_COLORS.honey400, PDF_COLORS.honey500]
  const hexes: { cx: number; cy: number; color: string }[] = []
  for (let row = 0; row < 2; row++) {
    const cy = height - r * 0.7 - row * rowGapY
    const offsetX = row % 2 === 0 ? 0 : hexW / 2
    for (let col = -1; col < cols; col++) {
      const cx = col * hexW + offsetX
      const colorIdx = (col + row * 2 + cols * 2) % colors.length
      hexes.push({ cx, cy, color: colors[colorIdx]! })
    }
  }
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill={PDF_COLORS.honey600} />
      {hexes.map((h, i) => (
        <Polygon key={i} points={hexPoints(h.cx, h.cy, r)} fill={h.color} opacity={0.92} />
      ))}
    </Svg>
  )
}

export type LineSeries = {
  values: number[]
  color: string
}

/**
 * Multi-series line chart, values share the same x-axis index.
 * Smooth curves are clipped to the plot rectangle so Catmull-Rom overshoot never
 * dips below the baseline or pokes above the top of the chart.
 */
export function LineChartSvg({
  series,
  labels,
  width = 480,
  height = 120,
  showYAxis = false,
  yAxisFormat = (v: number) => String(Math.round(v)),
  yTickCount = 4,
}: {
  series: LineSeries[]
  labels: string[]
  width?: number
  height?: number
  showYAxis?: boolean
  yAxisFormat?: (v: number) => string
  yTickCount?: number
}) {
  const padTop = 12
  const padBottom = 18
  const padRight = 6
  const padLeft = showYAxis ? 30 : padRight
  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom
  const n = labels.length
  if (n < 2) return null

  const allValues = series.flatMap((s) => s.values)
  const min = Math.min(...allValues, 0)
  const max = Math.max(...allValues, min + 1)
  const stepX = innerW / (n - 1)
  const clipId = nextClipId()

  function toPoints(values: number[]) {
    return values.map((v, i) => ({
      x: padLeft + i * stepX,
      y: padTop + innerH - ((v - min) / (max - min)) * innerH,
    }))
  }

  const labelStep = n <= 8 ? 1 : Math.ceil(n / 8)
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => min + ((max - min) * i) / yTickCount)

  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={padLeft} y={padTop} width={innerW} height={innerH} />
        </ClipPath>
      </Defs>

      {showYAxis ? (
        yTicks.map((tv, i) => {
          const y = padTop + innerH - ((tv - min) / (max - min)) * innerH
          return (
            <G key={i}>
              <Line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke={PDF_COLORS.cream200} strokeWidth={1} />
              <Text x={padLeft - 4} y={y + 2.5} style={{ fontSize: 6.5 }} fill={PDF_COLORS.wood500} textAnchor="end">
                {yAxisFormat(tv)}
              </Text>
            </G>
          )
        })
      ) : (
        <Line x1={padLeft} y1={padTop + innerH} x2={width - padRight} y2={padTop + innerH} stroke={PDF_COLORS.cream200} strokeWidth={1} />
      )}

      {series.map((s, si) => (
        <G key={si} clipPath={`url(#${clipId})`}>
          <Path
            d={smoothPathD(toPoints(s.values), { min: padTop, max: padTop + innerH })}
            fill="none"
            stroke={s.color}
            strokeWidth={1.75}
          />
        </G>
      ))}
      {series.map((s, si) => (
        <G key={si}>
          {s.values.map((v, i) => {
            if (i % labelStep !== 0 && i !== n - 1) return null
            const x = padLeft + i * stepX
            const y = padTop + innerH - ((v - min) / (max - min)) * innerH
            return <Circle key={i} cx={x} cy={y} r={1.6} fill={s.color} />
          })}
        </G>
      ))}
      {labels.map((l, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null
        const x = padLeft + i * stepX
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
        return (
          <Text key={i} x={x} y={height - 4} style={{ fontSize: 7 }} fill={PDF_COLORS.wood500} textAnchor={anchor}>
            {l}
          </Text>
        )
      })}
    </Svg>
  )
}

/** Smooth trend line over an ordinal category scale (e.g. Debole/Media/Forte), one color per point. */
export function CategoryTrendSvg({
  points,
  labels,
  levels,
  lineColor = PDF_COLORS.wood400,
  width = 480,
  height = 130,
  stepped = false,
}: {
  points: { levelIndex: number; color: string }[]
  labels: string[]
  levels: string[]
  lineColor?: string
  width?: number
  height?: number
  stepped?: boolean
}) {
  const padLeft = 58
  const padRight = 6
  const padTop = 10
  const padBottom = 18
  const innerW = width - padLeft - padRight
  const innerH = height - padTop - padBottom
  const n = labels.length
  if (n < 2) return null

  const maxLevel = levels.length - 1
  const stepX = innerW / (n - 1)
  const levelY = (li: number) => (maxLevel === 0 ? padTop + innerH / 2 : padTop + innerH - (li / maxLevel) * innerH)
  const clipId = nextClipId()

  const coords = points.map((p, i) => ({ x: padLeft + i * stepX, y: levelY(p.levelIndex) }))
  const labelStep = n <= 8 ? 1 : Math.ceil(n / 8)

  return (
    <Svg width={width} height={height}>
      <Defs>
        <ClipPath id={clipId}>
          <Rect x={padLeft} y={padTop} width={innerW} height={innerH} />
        </ClipPath>
      </Defs>
      {levels.map((lvl, li) => (
        <G key={li}>
          <Line x1={padLeft} y1={levelY(li)} x2={width - padRight} y2={levelY(li)} stroke={PDF_COLORS.cream200} strokeWidth={1} />
          <Text x={padLeft - 6} y={levelY(li) + 2.5} style={{ fontSize: 7 }} fill={PDF_COLORS.wood500} textAnchor="end">
            {lvl}
          </Text>
        </G>
      ))}
      <G clipPath={`url(#${clipId})`}>
        <Path
          d={stepped ? stepPathD(coords) : smoothPathD(coords, { min: padTop, max: padTop + innerH })}
          fill="none"
          stroke={lineColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </G>
      {coords.map((c, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null
        return <Circle key={i} cx={c.x} cy={c.y} r={2} fill={points[i]!.color} />
      })}
      {labels.map((l, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null
        const x = padLeft + i * stepX
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
        return (
          <Text key={i} x={x} y={height - 4} style={{ fontSize: 7 }} fill={PDF_COLORS.wood500} textAnchor={anchor}>
            {l}
          </Text>
        )
      })}
    </Svg>
  )
}

/** Timeline of binary events (e.g. celle reali rilevate) across all data points in chronological order. */
export function EventTimelineSvg({
  labels,
  present,
  color,
  width = 480,
  height = 70,
}: {
  labels: string[]
  present: boolean[]
  color: string
  width?: number
  height?: number
}) {
  const padX = 8
  const innerW = width - padX * 2
  const n = labels.length
  if (n < 2) return null

  const baseline = height - 22
  const stepX = innerW / (n - 1)
  const labelStep = n <= 8 ? 1 : Math.ceil(n / 8)

  return (
    <Svg width={width} height={height}>
      <Line x1={padX} y1={baseline} x2={width - padX} y2={baseline} stroke={PDF_COLORS.cream200} strokeWidth={1} />
      {present.map((isPresent, i) => {
        const x = padX + i * stepX
        return isPresent ? (
          <Circle key={i} cx={x} cy={baseline} r={4} fill={color} />
        ) : (
          <Circle key={i} cx={x} cy={baseline} r={1.6} fill={PDF_COLORS.wood300} />
        )
      })}
      {labels.map((l, i) => {
        if (i % labelStep !== 0 && i !== n - 1) return null
        const x = padX + i * stepX
        const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
        return (
          <Text key={i} x={x} y={height - 4} style={{ fontSize: 7 }} fill={PDF_COLORS.wood500} textAnchor={anchor}>
            {l}
          </Text>
        )
      })}
    </Svg>
  )
}

export function BarChartSvg({
  bars,
  width = 480,
  height = 120,
}: {
  bars: { label: string; value: number; color: string }[]
  width?: number
  height?: number
}) {
  const padTop = 16
  const padBottom = 16
  const padX = 6
  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const max = Math.max(...bars.map((b) => b.value), 1)
  const gap = 14
  const barW = (innerW - gap * (bars.length - 1)) / bars.length

  return (
    <Svg width={width} height={height}>
      <Line x1={padX} y1={padTop + innerH} x2={width - padX} y2={padTop + innerH} stroke={PDF_COLORS.cream200} strokeWidth={1} />
      {bars.map((b, i) => {
        const x = padX + i * (barW + gap)
        const h = (b.value / max) * innerH
        const y = padTop + innerH - h
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={Math.max(h, 0.5)} fill={b.color} rx={2} />
            <Text x={x + barW / 2} y={y - 4} style={{ fontSize: 8 }} fill={PDF_COLORS.wood700} textAnchor="middle">
              {b.value}
            </Text>
            <Text x={x + barW / 2} y={height - 4} style={{ fontSize: 7.5 }} fill={PDF_COLORS.wood500} textAnchor="middle">
              {b.label}
            </Text>
          </G>
        )
      })}
    </Svg>
  )
}

export type BloomTimelineRow = {
  label: string
  predictedStart: number | null // day-of-year (0-365)
  predictedEnd: number | null
  observedStart: number | null
  observedEnd: number | null
}

/** Gantt-style timeline: one staggered row per species, straight bars across a shared date axis. */
export function BloomTimelineSvg({
  rows,
  monthLabels,
  domainDays = 366,
  width = 480,
  rowHeight = 18,
}: {
  rows: BloomTimelineRow[]
  monthLabels: string[]
  domainDays?: number
  width?: number
  rowHeight?: number
}) {
  const padLeft = 86
  const padRight = 6
  const padTop = 14
  const padBottom = 16
  const innerW = width - padLeft - padRight
  const height = padTop + rows.length * rowHeight + padBottom

  function xForDay(day: number) {
    return padLeft + (day / domainDays) * innerW
  }

  return (
    <Svg width={width} height={height}>
      {monthLabels.map((label, i) => {
        const day = (i / monthLabels.length) * domainDays
        const x = xForDay(day)
        return (
          <G key={i}>
            <Line x1={x} y1={padTop} x2={x} y2={height - padBottom} stroke={PDF_COLORS.cream200} strokeWidth={1} />
            <Text x={x + 2} y={height - 5} style={{ fontSize: 6.5 }} fill={PDF_COLORS.wood500}>
              {label}
            </Text>
          </G>
        )
      })}

      {rows.map((row, i) => {
        const y = padTop + i * rowHeight + rowHeight / 2
        return (
          <G key={i}>
            <Text x={4} y={y + 2.5} style={{ fontSize: 7.5 }} fill={PDF_COLORS.wood700}>
              {row.label}
            </Text>
            {row.predictedStart != null && row.predictedEnd != null && (
              <Line
                x1={xForDay(row.predictedStart)}
                y1={y - 2}
                x2={xForDay(row.predictedEnd)}
                y2={y - 2}
                stroke={PDF_COLORS.honey500}
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}
            {row.observedStart != null && (
              <Line
                x1={xForDay(row.observedStart)}
                y1={y + 4}
                x2={xForDay(row.observedEnd ?? row.observedStart)}
                y2={y + 4}
                stroke={PDF_COLORS.success500}
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}
          </G>
        )
      })}
    </Svg>
  )
}
