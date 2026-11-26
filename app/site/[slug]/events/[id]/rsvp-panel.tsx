"use client"

import Link from "next/link"
import { useActionState } from "react"

import { FormMessage, SubmitButton, useFollowRedirect } from "@/components/form"
import { Input } from "@/components/ui/input"

import { cancelRsvp, guestRsvp, rsvp } from "../../actions"

export function RsvpPanel({
  slug,
  eventId,
  state,
  opensAt,
  signedIn,
  myStatus,
  full,
  guestAllowed,
  needsWaiver,
  brand,
}: {
  slug: string
  eventId: string
  state: "cancelled" | "past" | "not_open" | "closed" | "open"
  opensAt: string | null
  signedIn: boolean
  myStatus: "going" | "waitlisted" | "cancelled" | null
  full: boolean
  guestAllowed: boolean
  needsWaiver: boolean
  brand: string
}) {
  const [rsvpState, rsvpAction] = useActionState(rsvp.bind(null, slug, eventId), null)
  const [cancelState, cancelAction] = useActionState(cancelRsvp.bind(null, slug, eventId), null)
  const [guestState, guestAction] = useActionState(guestRsvp.bind(null, slug, eventId), null)
  useFollowRedirect(rsvpState)
  // The page re-renders with the real RSVP status after each action, so only surface errors here;
  // success text from a previous action would otherwise linger next to the new state.
  const rsvpError = rsvpState?.error ? rsvpState : null
  const cancelError = cancelState?.error ? cancelState : null
  const next = `/events/${eventId}`
  const buttonStyle = { background: brand }

  const box = (children: React.ReactNode) => <div className="space-y-4 rounded-xl border p-5">{children}</div>

  if (state === "cancelled") return box(<p className="font-medium">This event was cancelled.</p>)
  if (state === "past") return box(<p className="text-sm text-muted-foreground">This event has already started.</p>)
  if (state === "not_open") return box(<p className="text-sm">RSVPs open {opensAt}.</p>)
  if (state === "closed") return box(<p className="text-sm text-muted-foreground">RSVPs are closed.</p>)

  if (signedIn && (myStatus === "going" || myStatus === "waitlisted")) {
    return box(
      <>
        <p className="text-lg font-semibold">{myStatus === "going" ? "You're going ✓" : "You're on the waitlist"}</p>
        <p className="text-sm text-muted-foreground">
          {myStatus === "going" ? "Scan the QR code at the door to check in." : "If a spot opens up you'll be moved to going automatically."}
        </p>
        <FormMessage state={rsvpError} />
        <form action={cancelAction}>
          <SubmitButton variant="outline" className="w-full" pendingText="Cancelling…">
            Can&apos;t make it
          </SubmitButton>
        </form>
        <FormMessage state={cancelError} />
      </>,
    )
  }

  if (signedIn) {
    if (needsWaiver) {
      return box(
        <>
          <p className="font-medium">Sign the club waiver to RSVP</p>
          <Link href={`/join?next=${encodeURIComponent(next)}`} className="block rounded-md px-4 py-2 text-center text-sm font-semibold text-white" style={buttonStyle}>
            Review & sign
          </Link>
        </>,
      )
    }
    return box(
      <>
        <form action={rsvpAction}>
          <SubmitButton className="w-full text-white" style={buttonStyle} pendingText="Saving…">
            {full ? "Join the waitlist" : "RSVP"}
          </SubmitButton>
        </form>
        <FormMessage state={rsvpError} />
        <FormMessage state={cancelError} />
      </>,
    )
  }

  return box(
    <>
      <Link href={`/login?next=${encodeURIComponent(next)}`} className="block rounded-md px-4 py-2 text-center text-sm font-semibold text-white" style={buttonStyle}>
        Log in to RSVP
      </Link>
      <p className="text-center text-sm text-muted-foreground">
        New?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="underline">
          Create an account
        </Link>
      </p>
      {guestAllowed ? (
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">Or RSVP as a guest</p>
          <form action={guestAction} className="space-y-3">
            <Input name="name" placeholder="Your name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <SubmitButton variant="outline" className="w-full" pendingText="Saving…">
              {full ? "Join the waitlist" : "RSVP as guest"}
            </SubmitButton>
          </form>
          <div className="mt-2">
            <FormMessage state={guestState} />
          </div>
        </div>
      ) : null}
    </>,
  )
}
