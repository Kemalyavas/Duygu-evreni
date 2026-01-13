'use client'

import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({
  children,
  className,
  onClick,
  hover = false,
}: CardProps) {
  return (
    <div
      className={clsx(
        'glass rounded-2xl p-6',
        hover &&
          'cursor-pointer hover:bg-white/10 hover:scale-[1.02] transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
