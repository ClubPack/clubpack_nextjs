import { EmptyState, PageHeader, Panel } from "@/components/page-header"
import { ActionForm, Field, SubmitButton, selectClass } from "@/components/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { hasRole, requireOrgAccess } from "@/lib/orgs"
import { createClient } from "@/lib/supabase/server"
import { daysAgoIso } from "@/lib/time"

import { createInvite, revokeInvite, setMemberRole, setMemberStatus } from "./actions"

export const metadata = { title: "Members" }

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { org, role: myRole, user } = await requireOrgAccess(slug, "staff")
  const isAdmin = hasRole(myRole, "admin")
  const isOwner = myRole === "owner"
  const isClub = org.kind === "club"
  const supabase = await createClient()
  const since = daysAgoIso(90)

  const [{ data: members }, { data: invites }, { data: waiver }, { data: checkins }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("user_id, role, status, joined_at, profiles(full_name, school, graduation_year)")
      .eq("organization_id", org.id)
      .neq("status", "removed")
      .order("joined_at", { ascending: false }),
    isAdmin
      ? supabase.from("organization_invitations").select("id, email, role, expires_at").eq("organization_id", org.id).is("accepted_at", null)
      : Promise.resolve({ data: [] as { id: string; email: string; role: string; expires_at: string }[] }),
    isClub ? supabase.from("waivers").select("id").eq("organization_id", org.id).eq("is_active", true).maybeSingle() : Promise.resolve({ data: null }),
    isClub
      ? supabase.from("check_ins").select("user_id").eq("organization_id", org.id).gte("checked_in_at", since).not("user_id", "is", null)
      : Promise.resolve({ data: [] as { user_id: string | null }[] }),
  ])

  const { data: signatures } = waiver
    ? await supabase.from("waiver_signatures").select("user_id").eq("waiver_id", waiver.id)
    : { data: [] as { user_id: string }[] }
  const signed = new Set((signatures ?? []).map((s) => s.user_id))
  const attendance = new Map<string, number>()
  for (const c of checkins ?? []) if (c.user_id) attendance.set(c.user_id, (attendance.get(c.user_id) ?? 0) + 1)

  const pending = (members ?? []).filter((m) => m.status === "pending")
  const active = (members ?? []).filter((m) => m.status === "active")
  const team = active.filter((m) => m.role !== "member")
  const regular = active.filter((m) => m.role === "member")

  const renderMember = (m: (typeof active)[number]) => {
    const p = m.profiles
    const canEdit = isAdmin && m.user_id !== user.id && (m.role !== "owner" || isOwner)
    return (
      <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div>
          <p className="font-medium">{p?.full_name || "Unnamed member"}</p>
          <p className="text-xs text-muted-foreground">
            {[p?.school, p?.graduation_year ? `'${String(p.graduation_year).slice(2)}` : null].filter(Boolean).join(" ")}
            {p?.school || p?.graduation_year ? " · " : ""}
            Joined {new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {isClub ? <span className="tabular-nums text-muted-foreground">{attendance.get(m.user_id) ?? 0} check-ins (90d)</span> : null}
          {isClub && waiver ? signed.has(m.user_id) ? <Badge variant="secondary">Waiver signed</Badge> : <Badge variant="outline">No waiver</Badge> : null}
          {canEdit ? (
            <>
              <form action={setMemberRole.bind(null, slug, m.user_id)} className="flex items-center gap-1">
                <select name="role" defaultValue={m.role} className={`${selectClass} h-8 w-auto`}>
                  {isOwner ? <option value="owner">Owner</option> : null}
                  <option value="admin">Admin</option>
                  <option value="staff">Staff (check-in)</option>
                  <option value="member">Member</option>
                </select>
                <Button size="sm" variant="outline">
                  Set
                </Button>
              </form>
              <form action={setMemberStatus.bind(null, slug, m.user_id, "removed")}>
                <Button size="sm" variant="ghost" className="text-destructive">
                  Remove
                </Button>
              </form>
            </>
          ) : (
            <Badge variant="outline" className="capitalize">
              {m.role}
            </Badge>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <PageHeader title={isClub ? "Members" : "Team"} description={isClub ? `${active.length} active` : undefined} />

      <div className="space-y-6">
        {pending.length > 0 ? (
          <Panel title="Waiting for approval" description="Your club requires approval to join (change this in Settings).">
            <ul className="divide-y">
              {pending.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between gap-3 py-3">
                  <p className="font-medium">{m.profiles?.full_name || "Unnamed"}</p>
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <form action={setMemberStatus.bind(null, slug, m.user_id, "active")}>
                        <Button size="sm">Approve</Button>
                      </form>
                      <form action={setMemberStatus.bind(null, slug, m.user_id, "removed")}>
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel title={isClub ? "Officers & staff" : "Team"} description={isClub ? "Admins manage everything. Staff can run events and check people in." : undefined}>
          <ul className="divide-y">
            {team.map(renderMember)}
          </ul>
        </Panel>

        {isClub ? (
          <Panel title="Members">
            {regular.length === 0 ? (
              <EmptyState title="No members yet">Share your club site. People join there, or when they RSVP to a public event.</EmptyState>
            ) : (
              <ul className="divide-y">
                {regular.map(renderMember)}
              </ul>
            )}
          </Panel>
        ) : null}

        {isAdmin ? (
          <Panel title="Invite someone" description="Useful for handing over to next year's officers. They accept with the email you enter.">
            <ActionForm action={createInvite.bind(null, slug)} resetOnSuccess>
              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                <Field label="Email" htmlFor="invite-email">
                  <Input id="invite-email" name="email" type="email" required />
                </Field>
                <Field label="Role" htmlFor="invite-role">
                  <select id="invite-role" name="role" defaultValue={isClub ? "admin" : "admin"} className={selectClass}>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    {isClub ? <option value="member">Member</option> : null}
                  </select>
                </Field>
              </div>
              <SubmitButton size="sm">Create invite link</SubmitButton>
            </ActionForm>
            {(invites ?? []).length > 0 ? (
              <ul className="mt-4 divide-y border-t text-sm">
                {invites!.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-2">
                    <span>
                      {i.email} <span className="text-muted-foreground">· {i.role}</span>
                    </span>
                    <form action={revokeInvite.bind(null, slug, i.id)}>
                      <button className="text-xs text-muted-foreground underline">Revoke</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </>
  )
}
