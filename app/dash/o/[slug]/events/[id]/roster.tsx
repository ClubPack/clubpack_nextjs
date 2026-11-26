"use client"

import { useMemo, useState } from "react"
import { Check } from "lucide-react"

import { ActionForm, SubmitButton, selectClass } from "@/components/form"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { checkInPerson, setRsvpStatus, undoCheckIn, walkIn } from "../actions"

export type RosterRow = {
  key: string
  rsvpId: string | null
  userId: string | null
  name: string
  detail: string | null
  status: "going" | "waitlisted" | "walk_in"
  checkInId: string | null
}

export function Roster({
  slug,
  eventId,
  rows,
  members,
}: {
  slug: string
  eventId: string
  rows: RosterRow[]
  members: { id: string; name: string }[]
}) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = needle ? rows.filter((r) => r.name.toLowerCase().includes(needle)) : rows
    const order = { going: 0, walk_in: 1, waitlisted: 2 }
    return [...list].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name))
  }, [q, rows])

  return (
    <div className="space-y-4">
      <Input placeholder="Search names…" value={q} onChange={(e) => setQ(e.target.value)} />

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{rows.length ? "No matches." : "No RSVPs yet."}</p>
      ) : (
        <ul className="divide-y">
          {filtered.map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {r.detail ? <span>{r.detail}</span> : null}
                  {r.status === "waitlisted" ? <Badge variant="outline">Waitlist</Badge> : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.status === "waitlisted" && r.rsvpId ? (
                  <form action={setRsvpStatus.bind(null, slug, eventId, r.rsvpId, "going")}>
                    <button className="text-xs text-muted-foreground underline">Move to going</button>
                  </form>
                ) : null}
                {r.checkInId ? (
                  <form action={undoCheckIn.bind(null, slug, eventId, r.checkInId)}>
                    <button
                      className="inline-flex h-9 items-center gap-1 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                      title="Undo check-in"
                    >
                      <Check className="size-4" /> Here
                    </button>
                  </form>
                ) : (
                  <form action={checkInPerson.bind(null, slug, eventId)}>
                    {r.userId ? <input type="hidden" name="user_id" value={r.userId} /> : null}
                    {r.rsvpId ? <input type="hidden" name="rsvp_id" value={r.rsvpId} /> : null}
                    {!r.userId ? <input type="hidden" name="guest_name" value={r.name} /> : null}
                    <button className={cn("h-9 rounded-md border px-3 text-sm font-medium hover:bg-muted")}>Check in</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Add a walk-in</summary>
        <ActionForm action={walkIn.bind(null, slug, eventId)} className="mt-3" resetOnSuccess>
          <select name="member_id" className={selectClass} defaultValue="">
            <option value="">Member without an RSVP…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="text-center text-xs text-muted-foreground">or</p>
          <Input name="guest_name" placeholder="Guest name" />
          <SubmitButton size="sm" pendingText="Checking in…">
            Check in walk-in
          </SubmitButton>
        </ActionForm>
      </details>
    </div>
  )
}
