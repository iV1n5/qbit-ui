import { LoaderCircle } from "lucide-react"

import { FileList } from "@/components/file-list"
import { useTorrentFiles } from "@/hooks/use-torrent-files"

/** The files of an added torrent, whose priorities change right away. */
export function TorrentFiles({
  hash,
  onChanged,
}: {
  hash: string
  /** Called after a priority change, which also changes the torrent's size. */
  onChanged: () => void
}) {
  const { files, error, setPriority } = useTorrentFiles(hash)

  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium">Files</h3>
      {error && <p className="text-destructive">{error}</p>}
      {files === undefined ? (
        !error && (
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        )
      ) : files.length === 0 ? (
        <p className="text-muted-foreground">
          The files are listed once the metadata has been downloaded.
        </p>
      ) : (
        <FileList
          files={files}
          onChange={(index, priority) =>
            void setPriority([index], priority).then(onChanged)
          }
        />
      )}
    </section>
  )
}
