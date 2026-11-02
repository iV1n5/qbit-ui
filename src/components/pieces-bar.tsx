import { useCallback, useEffect, useRef, useState } from "react"

import { availabilityPerPixel, statesPerPixel } from "@/lib/pieces"

// Tailwind's sky-500 and green-500, as the state colors: blue for what is
// there, green for what is downloading.
const HAVE_COLOR = "#0ea5e9"
const DOWNLOADING_COLOR = "#22c55e"

type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => void

/** A thin bar of the pieces: downloaded in blue, downloading in green. */
export function PiecesProgressBar({ states }: { states: number[] }) {
  const draw = useCallback<Draw>(
    (ctx, width, height) => {
      statesPerPixel(states, width).forEach(({ downloaded, downloading }, x) => {
        fill(ctx, x, height, downloaded, HAVE_COLOR)
        fill(ctx, x, height, downloading, DOWNLOADING_COLOR)
      })
    },
    [states]
  )
  return <PixelBar draw={draw} label="Pieces downloaded" />
}

/** A thin bar of how many peers have each piece: the bluer, the more. */
export function PiecesAvailabilityBar({ availability }: { availability: number[] }) {
  const draw = useCallback<Draw>(
    (ctx, width, height) => {
      availabilityPerPixel(availability, width).forEach((value, x) =>
        fill(ctx, x, height, value, HAVE_COLOR)
      )
    },
    [availability]
  )
  return <PixelBar draw={draw} label="Pieces available from peers" />
}

/** One pixel column, as opaque as `share`: a pixel can mix several pieces. */
function fill(
  ctx: CanvasRenderingContext2D,
  x: number,
  height: number,
  share: number,
  color: string
) {
  if (share <= 0) return
  ctx.globalAlpha = share
  ctx.fillStyle = color
  ctx.fillRect(x, 0, 1, height)
}

/** A canvas over a muted track, drawn pixel by pixel at the screen's resolution. */
function PixelBar({ draw, label }: { draw: Draw; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width * devicePixelRatio))
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const element = canvas.current
    const ctx = element?.getContext("2d")
    if (!element || !ctx || width === 0) return
    element.width = width
    element.height = Math.round(element.clientHeight * devicePixelRatio)
    draw(ctx, element.width, element.height)
  }, [draw, width])

  return (
    <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
      <canvas ref={canvas} role="img" aria-label={label} className="block size-full" />
    </div>
  )
}
