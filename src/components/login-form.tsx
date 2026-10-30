import { useState, type FormEvent } from "react"

import { ApiError, login } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Read the fields only on submit: the password is never kept in state.
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await login(String(form.get("username")), String(form.get("password")))
      onLoggedIn()
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? "Logging in…" : "Log in"}
      </Button>
    </form>
  )
}

function loginErrorMessage(err: unknown) {
  if (!(err instanceof ApiError)) return "Cannot reach the server."
  if (err.status === 401) return "Wrong username or password."
  if (err.status === 403) return err.message // banned after too many failures
  return `Login failed: HTTP ${err.status} ${err.message}`
}
