// Pieces bars: a torrent has thousands of pieces and a bar a few hundred
// pixels, so each pixel shows the pieces that fall in it, a piece counting by
// how much of it falls there (as the official WebUI's bars).

const DOWNLOADING = 1
const DOWNLOADED = 2

/** For each pixel, the share (0 to 1) of it downloading and downloaded. */
export function statesPerPixel(states: number[], width: number) {
  const downloading = new Array<number>(Math.max(width, 0)).fill(0)
  const downloaded = new Array<number>(Math.max(width, 0)).fill(0)
  eachShare(states.length, width, (x, piece, share) => {
    if (states[piece] === DOWNLOADING) downloading[x] += share
    else if (states[piece] === DOWNLOADED) downloaded[x] += share
  })
  return downloaded.map((d, x) => ({
    downloading: Math.min(downloading[x], 1),
    downloaded: Math.min(d, 1),
  }))
}

// The least shared pieces still show, faintly: empty means no peer has them.
const FAINTEST = 0.2

/**
 * For each pixel, how shared its pieces are, from FAINTEST (the least shared
 * piece) to 1 (the most shared), or 0 where no peer has them. Relative to the
 * torrent's own range: peers usually hold most pieces, and against zero the
 * differences would not show.
 */
export function availabilityPerPixel(availability: number[], width: number) {
  const average = new Array<number>(Math.max(width, 0)).fill(0)
  eachShare(availability.length, width, (x, piece, share) => {
    average[x] += share * availability[piece]
  })
  const [low, high] = minMax(availability.filter((n) => n > 0))
  return average.map((value) => {
    if (value <= 0) return 0
    if (high === low) return 1
    const t = Math.min(Math.max((value - low) / (high - low), 0), 1)
    return FAINTEST + (1 - FAINTEST) * t
  })
}

/** The fewest and most peers holding a piece, or undefined without pieces. */
export function availabilityRange(availability: number[]) {
  if (availability.length === 0) return undefined
  const [min, max] = minMax(availability)
  return { min, max }
}

// Math.min(...list) would overflow the call stack on huge torrents.
function minMax(list: number[]): [number, number] {
  return list.reduce<[number, number]>(
    ([min, max], n) => [Math.min(min, n), Math.max(max, n)],
    [list.length ? Infinity : 0, list.length ? -Infinity : 0]
  )
}

/** Calls `visit` with each piece's share of each pixel it falls in (shares of a pixel sum to 1). */
function eachShare(
  count: number,
  width: number,
  visit: (pixel: number, piece: number, share: number) => void
) {
  if (count === 0 || width <= 0) return
  const piecesPerPixel = count / width
  for (let x = 0; x < width; x++) {
    const from = x * piecesPerPixel
    const to = (x + 1) * piecesPerPixel
    for (let piece = Math.floor(from); piece < Math.ceil(to) && piece < count; piece++) {
      const covered = Math.min(piece + 1, to) - Math.max(piece, from)
      visit(x, piece, covered / piecesPerPixel)
    }
  }
}
