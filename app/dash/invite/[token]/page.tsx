import { ActionForm, SubmitButton } from "@/components/form"

import { acceptInvitation } from "../../actions"

export const metadata = { title: "Accept invitation" }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl border bg-background p-6">
        <h1 className="text-xl font-semibold">You&apos;ve been invited</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept to join the team. The invitation must match the email you&apos;re signed in with.
        </p>
        <ActionForm action={acceptInvitation} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <SubmitButton className="w-full" pendingText="Joining…">
            Accept invitation
          </SubmitButton>
        </ActionForm>
      </div>
    </main>
  )
}
