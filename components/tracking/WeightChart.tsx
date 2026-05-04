'use client'

import { useState } from 'react'
import type { WeightEntry } from './WeightTracker'

// ─── Chart constants ──────────────────────────────────────────────────────────

const W  = 600
const H  = 200
const PL = 44   // left  (Y labels)
const PR = 12   // right
const PT = 12   // top
const PB = 36   // bottom (X labels)
const CW = W - PL - PR
const CH = H - PT - PB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toX(i: number, n: number): number {
  return PL + (n < 2 ? CW / 2 : (i / (n - 1)) * CW)
}

function toY(v: number, vMin: number, vMax: number): number {
  const range = vMax - vMin || 1
  return PT + (1 - (v - vMin) / range) * CH
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function buildLinePath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return ''
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`
  for (let i = 1; i < xs.length; i++) {
    const cpx = ((xs[i - 1]! + xs[i]!) / 2).toFixed(1)
    d += ` C ${cpx} ${ys[i - 1]!.toFixed(1)},${cpx} ${ys[i]!.toFixed(1)},${xs[i]!.toFixed(1)} ${ys[i]!.toFixed(1)}`
  }
  return d
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WeightChart({ logs }: { logs: WeightEntry[] }) {
  const [hover, setHover] = useState<number | null>(null)

  if (logs.length < 2) return null

  // Oldest → newest (left → right)
  const data = [...logs].reverse()

  // Y domain with padding
  const weights = data.map(d => d.weight)
  const rawMin  = Math.min(...weights)
  const rawMax  = Math.max(...weights)
  const pad     = Math.max((rawMax - rawMin) * 0.25, 2)
  const vMin    = rawMin - pad
  const vMax    = rawMax + pad

  const xs = data.map((_, i) => toX(i, data.length))
  const ys = data.map(d => toY(d.weight, vMin, vMax))

  const linePath = buildLinePath(xs, ys)
  const areaPath = `${linePath} L ${xs[xs.length - 1]!.toFixed(1)} ${(PT + CH).toFixed(1)} L ${xs[0]!.toFixed(1)} ${(PT + CH).toFixed(1)} Z`

  // Y-axis ticks (4 levels)
  const yTicks = [0, 0.33, 0.67, 1].map(t => ({
    v: vMin + t * (vMax - vMin),
    y: PT + (1 - t) * CH,
  }))

  // X-axis labels — first, last, and up to 3 in between
  const labelStep = Math.max(1, Math.ceil(data.length / 5))
  const xLabels = data
    .map((d, i) => ({ label: shortDate(d.date), x: xs[i]!, date: d.date }))
    .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % labelStep === 0)

  // Trend
  const diff = Math.round((data[data.length - 1]!.weight - data[0]!.weight) * 10) / 10
  const trendColor = diff < 0 ? '#22c55e' : diff > 0 ? '#FF471A' : '#888888'
  const trendIcon  = diff < 0 ? '↓' : diff > 0 ? '↑' : '→'
  const trendLabel = diff !== 0 ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : 'Sin cambios'

  return (
    <div className="bg-bg-secondary border border-border-default rounded-2xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text-primary font-bold text-sm">Evolución del peso</h2>
        <span className="text-xs font-bold tabular-nums" style={{ color: trendColor }}>
          {trendIcon} {trendLabel}
        </span>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ overflow: 'visible' }}
        role="img"
        aria-label="Gráfica de evolución del peso"
      >
        <defs>
          <linearGradient id="wgt-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FF471A" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FF471A" stopOpacity="0"    />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map(t => (
          <line
            key={t.v}
            x1={PL} y1={t.y}
            x2={W - PR} y2={t.y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map(t => (
          <text
            key={t.v}
            x={PL - 6}
            y={t.y}
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--text-muted)"
            fontSize={11}
          >
            {t.v.toFixed(1)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(l => (
          <text
            key={l.date}
            x={l.x}
            y={PT + CH + 20}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={11}
          >
            {l.label}
          </text>
        ))}

        {/* Gradient area */}
        <path d={areaPath} fill="url(#wgt-grad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#FF471A"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover cursor */}
        {hover !== null && (
          <line
            x1={xs[hover]} y1={PT}
            x2={xs[hover]} y2={PT + CH}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {/* Dots + hit areas */}
        {data.map((d, i) => (
          <g key={d.id}>
            <circle
              cx={xs[i]} cy={ys[i]}
              r={16}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            <circle
              cx={xs[i]} cy={ys[i]}
              r={hover === i ? 5 : 3.5}
              fill="#FF471A"
              stroke={hover === i ? 'rgba(255,71,26,0.28)' : 'none'}
              strokeWidth={hover === i ? 6 : 0}
              style={{ transition: 'r 0.12s, stroke-width 0.12s' }}
            />
          </g>
        ))}

        {/* Tooltip */}
        {hover !== null && (() => {
          const d = data[hover]
          if (!d) return null
          const x  = xs[hover]!
          const y  = ys[hover]!
          const tw = 98
          const th = 46
          const tx = x > W / 2 ? x - tw - 12 : x + 12
          const ty = Math.max(PT, Math.min(y - th / 2, PT + CH - th))
          return (
            <g>
              <rect
                x={tx} y={ty}
                width={tw} height={th}
                rx={8}
                fill="var(--bg-secondary)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={tx + 10} y={ty + 16} fill="var(--text-muted)" fontSize={10}>
                {shortDate(d.date)}
              </text>
              <text x={tx + 10} y={ty + 33} fill="var(--text-primary)" fontSize={15} fontWeight="700">
                {d.weight.toFixed(1)} kg
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
