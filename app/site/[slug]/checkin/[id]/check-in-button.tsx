"use client"

import { useActionState } from "react"

import { FormMessage, SubmitButton, useFollowRedirect } from "@/components/form"

import { selfCheckIn } from "../../actions"

export function CheckInButton({ slug, eventId, code, brand }: { slug: string; eventId: string; code: string; brand: string }) {
  const [state, action] = useActionState(selfCheckIn.bind(null, slug, eventId, code), null)
  useFollowRedirect(state)
  if (state?.ok && !state.redirectTo) return <p className="text-lg font-semibold">{state.message}</p>
  return (
    <form action={action} className="space-y-3">
      <SubmitButton className="h-12 w-full text-base text-white" style={{ background: brand }} pendingText="Checking in…">
        I&apos;m here
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}
