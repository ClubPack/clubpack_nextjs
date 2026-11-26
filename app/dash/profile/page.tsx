import { ActionForm, Field, SubmitButton } from "@/components/form"
import { Input } from "@/components/ui/input"
import { getProfile, requireUser } from "@/lib/auth"

import { updateProfile } from "../actions"

export const metadata = { title: "Profile" }

export default async function ProfilePage() {
  const user = await requireUser("/profile")
  const profile = await getProfile(user.id)

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Shared with the clubs you join. Signed in as {user.email}.</p>
      <div className="mt-8 rounded-xl border bg-background p-6">
        <ActionForm action={updateProfile}>
          <Field label="Full name" htmlFor="full_name">
            <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} required />
          </Field>
          <Field label="School" htmlFor="school">
            <Input id="school" name="school" defaultValue={profile?.school ?? ""} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Graduation year" htmlFor="graduation_year">
              <Input id="graduation_year" name="graduation_year" inputMode="numeric" defaultValue={profile?.graduation_year ?? ""} />
            </Field>
            <Field label="Phone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
            </Field>
          </div>
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </div>
    </main>
  )
}
