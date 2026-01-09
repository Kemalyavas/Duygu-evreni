'use client'

import { motion } from 'framer-motion'

interface DonutChartData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  size?: number
  strokeWidth?: number
}

export function DonutChart({ data, size = 200, strokeWidth = 28 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">0</span>
            <span className="text-sm text-white/60">yıldız</span>
          </div>
        </div>
      </div>
    )
  }

  // Pre-calculate cumulative percentages to avoid mutation during render
  const segmentsWithRotation = filteredData.map((item, index) => {
    const percent = item.value / total
    const cumulativePercent = filteredData
      .slice(0, index)
      .reduce((sum, d) => sum + d.value / total, 0)
    return { ...item, percent, rotation: cumulativePercent * 360 - 90 }
  })

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Data segments */}
          {segmentsWithRotation.map((segment, index) => {
            const strokeDasharray = circumference
            const strokeDashoffset = circumference * (1 - segment.percent)

            return (
              <motion.circle
                key={segment.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(${segment.rotation} ${center} ${center})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: 'easeOut'
                }}
                style={{
                  filter: `drop-shadow(0 0 6px ${segment.color}50)`
                }}
              />
            )
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {total}
          </motion.span>
          <span className="text-sm text-white/60">yıldız</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-6">
        {filteredData.map((item, index) => (
          <motion.div
            key={item.label}
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: item.color,
                boxShadow: `0 0 6px ${item.color}60`
              }}
            />
            <span className="text-sm text-white/70">{item.label}</span>
            <span className="text-xs text-white/40">({item.value})</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
