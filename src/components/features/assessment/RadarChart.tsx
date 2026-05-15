'use client'

interface Skill { key: string; label: string }
interface RadarChartProps {
  skills: readonly Skill[]
  scores: Record<string, number>
  previousScores?: Record<string, number>
  size?: number
}

/**
 * RadarChart — Phase 13.2 dark mode fix:
 *   Trước đây dùng hard-coded `rgba(28,43,74,...)` (--ink navy) + `#1C2B4A`
 *   → invisible trong dark mode vì bg cũng dark navy.
 *   Bây giờ dùng `currentColor` + wrapper inherit `var(--foreground)` →
 *   tự adapt theme: navy trong light, paper trong dark.
 *   Score dots vẫn dùng semantic colors (red/green) cho clarity.
 */
export function RadarChart({ skills, scores, previousScores, size = 200 }: RadarChartProps) {
  const center = size / 2
  const radius = size * 0.38
  const n = skills.length
  if (n === 0) return null

  function getPoint(idx: number, value: number, maxVal = 5) {
    const angle = (idx * 2 * Math.PI) / n - Math.PI / 2
    const r = (value / maxVal) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  function getLabelPoint(idx: number) {
    const angle = (idx * 2 * Math.PI) / n - Math.PI / 2
    const r = radius + 22
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  // Grid lines (1-5)
  const gridLevels = [1, 2, 3, 4, 5]

  function makePolygon(vals: Record<string, number>) {
    return skills.map((sk, i) => {
      const v = vals[sk.key] ?? 0
      const p = getPoint(i, v)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  const currentPoints = makePolygon(scores)
  const prevPoints = previousScores ? makePolygon(previousScores) : null

  return (
    <div className="flex justify-center text-foreground">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={skills.map((_, i) => {
              const p = getPoint(i, level)
              return `${p.x},${p.y}`
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={level === 5 ? 1.5 : 0.8}
          />
        ))}

        {/* Axes */}
        {skills.map((_, i) => {
          const outer = getPoint(i, 5)
          return (
            <line
              key={i}
              x1={center} y1={center}
              x2={outer.x} y2={outer.y}
              stroke="currentColor"
              strokeOpacity={0.15}
              strokeWidth={0.8}
            />
          )
        })}

        {/* Previous (if any) — dashed teal */}
        {prevPoints && (
          <polygon
            points={prevPoints}
            fill="rgba(91,142,159,0.10)"
            stroke="rgba(91,142,159,0.5)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Current — uses var(--accent) for brand gold polygon */}
        <polygon
          points={currentPoints}
          fill="currentColor"
          fillOpacity={0.18}
          stroke="currentColor"
          strokeOpacity={0.85}
          strokeWidth={2}
        />

        {/* Score dots — semantic colors only (red/green/foreground) */}
        {skills.map((sk, i) => {
          const v = scores[sk.key] ?? 0
          if (!v) return null
          const p = getPoint(i, v)
          const dotFill = v <= 2 ? '#EF4444' : v >= 4 ? '#22c55e' : 'currentColor'
          return (
            <circle
              key={sk.key}
              cx={p.x} cy={p.y} r={3}
              fill={dotFill}
            />
          )
        })}

        {/* Labels */}
        {skills.map((sk, i) => {
          const lp = getLabelPoint(i)
          const v = scores[sk.key] ?? 0
          const shortLabel = sk.label.length > 10 ? sk.label.slice(0, 9) + '…' : sk.label
          const isWeak = v <= 2 && v > 0
          return (
            <text
              key={sk.key}
              x={lp.x} y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={9}
              fill={isWeak ? '#EF4444' : 'currentColor'}
              fillOpacity={isWeak ? 1 : 0.75}
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight={isWeak ? 600 : 400}
            >
              {shortLabel}
              {v > 0 && (
                <tspan
                  fontSize={8}
                  fill={v <= 2 ? '#EF4444' : v >= 4 ? '#22c55e' : 'currentColor'}
                  fillOpacity={1}
                  dx={2}
                >
                  {` ${v}`}
                </tspan>
              )}
            </text>
          )
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r={2} fill="currentColor" fillOpacity={0.35} />
      </svg>
    </div>
  )
}
