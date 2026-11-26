import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ActionForm, Field, SubmitButton } from "@/components/form"
import { Input } from "@/components/ui/input"
import { getUser } from "@/lib/auth"
import { safeNext } from "@/lib/env"

import { signUp } from "../actions"
import { AuthCard } from "../auth-card"

export const metadata: Metadata = { title: "Create your account" }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await getUser()) redirect(next)

  return (
    <AuthCard
      title="Create your account"
      subtitle="Run a club, join one, or sponsor them — all from one account."
      footer={
        <>
          Already have an account? <Link className="font-medium text-foreground underline" href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
        </>
      }
    >
      <ActionForm action={signUp}>
        <input type="hidden" name="next" value={next} />
        <Field label="Full name" htmlFor="full_name">
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <SubmitButton className="w-full" pendingText="Creating account…">
          Create account
        </SubmitButton>
      </ActionForm>
    </AuthCard>
  )
}
