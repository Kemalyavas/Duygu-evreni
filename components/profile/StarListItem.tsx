'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface StarListItemProps {
  star: {
    id: string
    content: string
    planet_name: string
    planet_color: string
    created_at: string
  }
  isSelected: boolean
  onClick: () => void
}

export function StarListItem({ star, isSelected, onClick }: StarListItemProps) {
  const formattedDate = (() => {
    try {
      return format(new Date(star.created_at), 'd MMM yyyy', { locale: tr })
    } catch {
      return ''
    }
  })()

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      animate={{
        scale: isSelected ? 1.03 : 1,
        boxShadow: isSelected
          ? `0 0 20px ${star.planet_color}30, 0 0 40px ${star.planet_color}15, inset 0 0 20px ${star.planet_color}10`
          : '0 0 0 transparent'
      }}
      transition={{ duration: 0.2 }}
      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 cursor-pointer transition-colors"
      style={{
        borderColor: isSelected ? `${star.planet_color}40` : undefined
      }}
    >
      {/* Planet indicator + date */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: star.planet_color,
              boxShadow: isSelected ? `0 0 8px ${star.planet_color}` : undefined
            }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: star.planet_color }}
          >
            {star.planet_name}
          </span>
        </div>
        <span className="text-xs text-white/40">
          {formattedDate}
        </span>
      </div>

      {/* Star content - truncated */}
      <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">
        {star.content}
      </p>
    </motion.div>
  )
}
