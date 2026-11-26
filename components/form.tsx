"use client"

import * as React from "react"
import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { ActionState } from "@/lib/actions"
import { cn } from "@/lib/utils"

type Action = (state: ActionState, form: FormData) => Promise<ActionState>

/** Follow `redirectTo` from an action result (see lib/actions.ts for why actions don't redirect themselves). */
export function useFollowRedirect(state: ActionState) {
  const router = useRouter()
  useEffect(() => {
    if (!state?.redirectTo) return
    if (state.hardRedirect) window.location.assign(state.redirectTo)
    else router.push(state.redirectTo)
  }, [state, router])
}

/**
 * Form bound to a server action with inline success/error feedback.
 * `resetOnSuccess` clears the inputs after a successful submit (for "add another" forms).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action
  children: React.ReactNode
  className?: string
  resetOnSuccess?: boolean
}) {
  const [state, formAction] = useActionState(action, null)
  const ref = useRef<HTMLFormElement>(null)
  useFollowRedirect(state)

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset()
  }, [state, resetOnSuccess])

  return (
    <form ref={ref} action={formAction} className={cn("space-y-4", className)}>
      {children}
      <FormMessage state={state} />
    </form>
  )
}

/** Single button bound to an action that takes no form fields (e.g. delete). */
export function ActionButton({
  action,
  children,
  pendingText,
  confirm,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "action"> & {
  action: () => Promise<ActionState>
  pendingText?: string
  confirm?: string
}) {
  const [state, formAction] = useActionState(() => action(), null)
  useFollowRedirect(state)
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault()
      }}
    >
      <SubmitButton pendingText={pendingText} {...props}>
        {children}
      </SubmitButton>
      <FormMessage state={state} />
    </form>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state || state.redirectTo) return null
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    )
  }
  if (state.message) {
    return (
      <p role="status" className="text-sm text-emerald-700">
        {state.message}
      </p>
    )
  }
  return null
}

export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (pendingText ?? "Saving…") : children}
    </Button>
  )
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** Native checkbox styled to match; submits "on" when checked. */
export function Checkbox({ label, hint, ...props }: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" className="mt-0.5 size-4 rounded border-input accent-primary" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  )
}

export const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
