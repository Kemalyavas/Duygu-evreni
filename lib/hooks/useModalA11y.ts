'use client'

import { useEffect, useRef } from 'react'

/**
 * Dialog a11y for hand-rolled modals WITHOUT touching their markup/visuals:
 *   - Escape closes the modal
 *   - Tab / Shift+Tab is trapped inside the modal
 *   - body scroll is locked while open
 *   - focus is restored to the previously-focused element on close
 *
 * The shared <Modal> already bakes this in; this hook gives the same behaviour
 * to the bespoke messaging modals (Nickname / MessageRequest / Report) that
 * render their own backdrop.
 *
 * Usage:
 *   const dialogRef = useModalA11y<HTMLDivElement>(isOpen, onClose)
 *   <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId}> … </div>
 */
export function useModalA11y<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
  onClose: () => void
) {
  const containerRef = useRef<T>(null)

  // Keep the latest onClose in a ref so the effect below does NOT re-run on
  // every render (a changing onClose identity would otherwise re-arm the
  // listeners and could steal focus from inputs).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElement.current?.focus?.()
    }
  }, [isOpen])

  return containerRef
}
