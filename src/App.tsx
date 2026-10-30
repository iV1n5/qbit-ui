import { useState } from "react"

import { logout } from "@/api/client"
import { AppHeader, type View } from "@/components/app-header"
import { Downloads } from "@/components/downloads"
import { LoginForm } from "@/components/login-form"
import { SearchView } from "@/components/search-view"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useMainData } from "@/hooks/use-main-data"

function App() {
  const { status, torrents, serverState, error, pollNow, restart } =
    useMainData()
  const [view, setView] = useState<View>("downloads")

  if (status === "loggedOut") {
    return (
      <main className="flex min-h-svh items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>qbit-ui</CardTitle>
            <CardDescription>
              Log in with your qBittorrent WebUI credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onLoggedIn={restart} />
          </CardContent>
        </Card>
      </main>
    )
  }

  function handleLogout() {
    // Whatever the outcome, polling again shows where we stand.
    logout().then(restart, restart)
  }

  return (
    <>
      <AppHeader
        view={view}
        onViewChange={setView}
        serverState={serverState}
        onLogout={handleLogout}
      />
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {error} Retrying…
        </p>
      )}
      <main>
        {view === "downloads" ? (
          <Downloads
            torrents={torrents}
            loading={status === "loading"}
            onChanged={pollNow}
          />
        ) : (
          // Leaving this view deletes the search from qBittorrent.
          <SearchView
            onAdded={() => {
              setView("downloads")
              pollNow()
            }}
          />
        )}
      </main>
    </>
  )
}

export default App
