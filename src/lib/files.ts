/**
 * A file as the file lists show it: of an added torrent (`torrents/files`)
 * or of one about to be added (`torrents/fetchMetadata`).
 */
export interface FileItem {
  /** Position in the torrent: what the API's file ids and priorities follow. */
  index: number
  /** Path inside the torrent, "/"-separated. */
  name: string
  /** Bytes. */
  size: number
  priority: number
  /** From 0 to 1; none before the torrent is added. */
  progress?: number
}

/** File priorities and their names, as in the official WebUI. */
export const FILE_PRIORITIES = [
  { value: 0, label: "Do not download" },
  { value: 1, label: "Normal" },
  { value: 6, label: "High" },
  { value: 7, label: "Maximum" },
]

export const SKIP = 0
export const NORMAL = 1

/**
 * The folder every file is in, with its trailing "/" (usually the torrent's
 * own folder), or "" when there is none.
 */
export function commonFolder(files: FileItem[]) {
  const first = files[0]?.name.split("/")[0]
  const prefix = `${first}/`
  return files.length > 0 && files.every((f) => f.name.startsWith(prefix))
    ? prefix
    : ""
}

/** "Season 1/E01.mkv" → { folder: "Season 1", file: "E01.mkv" }. */
export function splitPath(path: string) {
  const slash = path.lastIndexOf("/")
  return { folder: path.slice(0, Math.max(slash, 0)), file: path.slice(slash + 1) }
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})

/** By path, with numbers in order: E2 before E10. */
export function compareFiles(a: FileItem, b: FileItem) {
  return collator.compare(a.name, b.name)
}
