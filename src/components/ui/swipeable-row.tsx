import { useState, useRef, type ReactNode } from 'react'

interface SwipeableRowProps {
  children: ReactNode
  revealContent: ReactNode
  revealWidth?: number
}

export function SwipeableRow({ children, revealContent, revealWidth = 84 }: SwipeableRowProps) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const trackingRef = useRef(false)
  const [offsetX, setOffsetX] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [animate, setAnimate] = useState(false)

  function snapTo(px: number) {
    setAnimate(true)
    setOffsetX(px)
    setRevealed(px < 0)
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t0 = e.touches[0]
    if (!t0) return
    startRef.current = { x: t0.clientX, y: t0.clientY }
    trackingRef.current = false
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
    setAnimate(false)
    const base = revealed ? -revealWidth : 0
    setOffsetX(Math.max(-revealWidth, Math.min(0, base + dx)))
  }

  function handleTouchEnd() {
    if (!trackingRef.current) return
    startRef.current = null
    if (revealed) {
      snapTo(offsetX > -(revealWidth * 2 / 3) ? 0 : -revealWidth)
    } else {
      snapTo(offsetX < -(revealWidth / 3) ? -revealWidth : 0)
    }
  }

  function close() {
    snapTo(0)
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Reveal panel */}
      <div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: revealWidth }}
      >
        {revealContent}
      </div>

      {/* Swipeable content */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: animate ? 'transform 0.2s ease' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={() => setAnimate(false)}
      >
        {children}
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
