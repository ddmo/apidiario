import { useState, useRef, useEffect, type ReactNode, type MouseEvent } from 'react'

interface SwipeableRowProps {
  children: ReactNode
  revealContent: ReactNode
  revealWidth?: number
}

// Module-level registry — when a row opens, all others close
const closeRegistry = new Set<() => void>()

export function SwipeableRow({ children, revealContent, revealWidth = 84 }: SwipeableRowProps) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const trackingRef = useRef(false)
  const swipedRef = useRef(false)
  const [offsetX, setOffsetX] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [animate, setAnimate] = useState(false)
  const closeRef = useRef<() => void>(() => {})

  function snapTo(px: number) {
    setAnimate(true)
    setOffsetX(px)
    setRevealed(px < 0)
  }

  // Register close function; when this row opens, close all others first
  useEffect(() => {
    const fn = () => snapTo(0)
    closeRef.current = fn
    closeRegistry.add(fn)
    return () => { closeRegistry.delete(fn) }
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    const t0 = e.touches[0]
    if (!t0) return
    startRef.current = { x: t0.clientX, y: t0.clientY }
    trackingRef.current = false
    swipedRef.current = false
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!startRef.current) return
    const t0 = e.touches[0]
    if (!t0) return
    const dx = t0.clientX - startRef.current.x
    const dy = t0.clientY - startRef.current.y
    if (!trackingRef.current) {
      const adx = Math.abs(dx); const ady = Math.abs(dy)
      if (adx < 5 && ady < 5) return
      trackingRef.current = adx > ady
    }
    if (!trackingRef.current) return
    swipedRef.current = true
    setAnimate(false)
    const base = revealed ? -revealWidth : 0
    setOffsetX(Math.max(-revealWidth, Math.min(0, base + dx)))
  }

  function handleTouchEnd() {
    if (!trackingRef.current) return
    startRef.current = null
    if (revealed) {
      snapTo(offsetX > -(revealWidth * 2 / 3) ? 0 : -revealWidth)
    } else if (offsetX < -(revealWidth / 3)) {
      // Before opening, close all other rows
      for (const fn of closeRegistry) {
        if (fn !== closeRef.current) fn()
      }
      snapTo(-revealWidth)
    } else {
      snapTo(0)
    }
  }

  function handleClick(e: MouseEvent) {
    if (swipedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function close() {
    snapTo(0)
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Grid: content + panel at equal heights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `1fr ${revealWidth}px`,
          width: `calc(100% + ${revealWidth}px)`,
          transform: `translateX(${offsetX}px)`,
          transition: animate ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onTransitionEnd={() => setAnimate(false)}
      >
        <div className="flex">
          {children}
        </div>
        <div
          className="flex"
          style={{
            position: 'relative',
            zIndex: -1,
            overflow: 'hidden',
            borderRadius: '0 12px 12px 0',
            boxShadow: '-12px 0 0 0 var(--color-honey-500)',
          }}
        >
          {revealContent}
        </div>
      </div>

      {/* Overlay while revealed */}
      {revealed && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ right: revealWidth }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={close}
        />
      )}
    </div>
  )
}
