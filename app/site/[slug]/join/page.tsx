import Link from "next/link"
import { redirect } from "next/navigation"

import { ActionForm, Checkbox, Field, SubmitButton } from "@/components/form"
import { Input } from "@/components/ui/input"
import { safeNextLocal } from "@/lib/actions"
import { getProfile } from "@/lib/auth"

import { joinClub } from "../actions"
import { getSiteClub, getVisitor } from "../data"

export const metadata = { title: "Join" }

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { slug } = await params
  const next = safeNextLocal((await searchParams).next ?? "/", "/")
  const { org, club } = await getSiteClub(slug)
  const visitor = await getVisitor(org.id)
  const brand = org.brand_color ?? "#111827"

  if (!visitor.user) {
    const back = `/join?next=${encodeURIComponent(next)}`
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Join {org.name}</h1>
        <p className="mt-2 text-muted-foreground">Create a free ClubPack account (or log in) to join, RSVP and check in.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/signup?next=${encodeURIComponent(back)}`} className="rounded-md px-4 py-2.5 font-semibold text-white" style={{ background: brand }}>
            Create an account
          </Link>
          <Link href={`/login?next=${encodeURIComponent(back)}`} className="rounded-md border px-4 py-2.5 font-medium">
            I already have one
          </Link>
        </div>
      </main>
    )
  }

  const status = visitor.membership?.status
  const mustSign = club.require_waiver && visitor.waiver && !visitor.signedWaiver

  if (status === "active" && !mustSign) redirect(next)
  if (status === "removed") {
    return <Message title="You can't rejoin this club" body="An admin removed your membership. Contact the club if you think this is a mistake." />
  }
  if (status === "pending" && !mustSign) {
    return <Message title="Request sent" body="An admin will review your request. You'll be able to RSVP once you're approved." />
  }
  if (!status && club.join_policy === "invite_only") {
    return <Message title="Invite only" body="This club adds members by invitation. Ask an officer for an invite." />
  }

  const profile = await getProfile(visitor.user.id)

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold">{status === "active" ? "Sign the updated waiver" : `Join ${org.name}`}</h1>
      <p className="mt-1 text-muted-foreground">
        {club.join_policy === "approval" && !status ? "An admin approves new members. " : ""}
        Your ClubPack profile ({profile?.full_name || visitor.user.email}) will be shared with the club&apos;s officers.
      </p>

      <ActionForm action={joinClub.bind(null, slug)} className="mt-8">
        <input type="hidden" name="next" value={next} />
        {club.require_waiver && visitor.waiver && !visitor.signedWaiver ? (
          <>
            <input type="hidden" name="waiver_id" value={visitor.waiver.id} />
            <div className="rounded-xl border">
              <div className="border-b px-4 py-3 font-medium">
                {visitor.waiver.title} <span className="text-xs text-muted-foreground">v{visitor.waiver.version}</span>
              </div>
              <div className="max-h-80 overflow-y-auto whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed">{visitor.waiver.body}</div>
            </div>
            <Checkbox name="agree" required label="I have read and agree to this waiver." />
            <Field label="Type your full legal name to sign" htmlFor="signed_name">
              <Input id="signed_name" name="signed_name" required defaultValue={profile?.full_name ?? ""} autoComplete="name" />
            </Field>
          </>
        ) : null}
        <SubmitButton className="w-full text-white" style={{ background: brand }} pendingText="Joining…">
          {mustSign ? (status === "active" ? "Sign waiver" : "Sign & join") : club.join_policy === "approval" ? "Request to join" : "Join"}
        </SubmitButton>
      </ActionForm>
    </main>
  )
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <Link href="/" className="mt-6 inline-block underline">
        Back to the club
      </Link>
    </main>
  )
}
