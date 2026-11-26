import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { ActionForm, Field, SubmitButton } from "@/components/form"
import { Input } from "@/components/ui/input"
import { getUser } from "@/lib/auth"
import { safeNext } from "@/lib/env"

import { logIn } from "../actions"
import { AuthCard } from "../auth-card"

export const metadata: Metadata = { title: "Log in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await getUser()) redirect(next)

  return (
    <AuthCard
      title="Log in"
      subtitle="One ClubPack account works for every club you're in."
      footer={
        <>
          New here? <Link className="font-medium text-foreground underline" href={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
        </>
      }
    >
      <ActionForm action={logIn}>
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton className="w-full" pendingText="Logging in…">
          Log in
        </SubmitButton>
      </ActionForm>
    </AuthCard>
  )
}
