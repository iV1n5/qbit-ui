import { useRef, useState, type PointerEvent, type ReactNode } from "react"
import { Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"

// How far left a row must be dragged to trigger, and how far a finger must
// move before a swipe can be told from a scroll.
const TRIGGER_PX = 96
const SLOP_PX = 10

/**
 * A row that calls `onSwipe` when dragged left past a threshold, with
 * "Delete" showing underneath. `touch-pan-y` leaves vertical drags to the
 * browser, which scrolls as usual. Touch only: a mouse just clicks.
 */
export function SwipeToDelete({
  children,
  onSwipe,
}: {
  children: ReactNode
  onSwipe: () => void
}) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{ id: number; x: number; y: number; swiping: boolean }>(
    undefined
  )
  // A swipe may end with a click on the row: it must not open the row.
  const swallowClick = useRef(false)

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    swallowClick.current = false
    if (e.pointerType === "mouse") return
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, swiping: false }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x
    if (!g.swiping) {
      const dy = e.clientY - g.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SLOP_PX) return
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current = undefined // a scroll
        return
      }
      g.swiping = true
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
    }
    setOffset(Math.min(0, dx))
  }

  function handlePointerEnd(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const g = gesture.current
    gesture.current = undefined
    if (!g?.swiping || g.id !== e.pointerId) return
    swallowClick.current = true
    setDragging(false)
    setOffset(0)
    if (!cancelled && e.clientX - g.x <= -TRIGGER_PX) onSwipe()
  }

  const armed = offset <= -TRIGGER_PX
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-end gap-2 px-6 text-sm text-white transition-colors",
          armed ? "bg-destructive font-medium" : "bg-destructive/70"
        )}
      >
        <Trash2 className="size-4" />
        Delete
      </div>
      <div
        className={cn(
          "relative touch-pan-y bg-background",
          !dragging && "transition-transform duration-200"
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => handlePointerEnd(e, false)}
        onPointerCancel={(e) => handlePointerEnd(e, true)}
        onClickCapture={(e) => {
          if (!swallowClick.current) return
          swallowClick.current = false
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {children}
      </div>
    </div>
  )
}
