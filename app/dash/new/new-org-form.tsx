"use client"

import { useState, useSyncExternalStore } from "react"

import { ActionForm, Field, SubmitButton, selectClass } from "@/components/form"
import { Input } from "@/components/ui/input"
import { ROOT_DOMAIN } from "@/lib/env"
import { COMMON_TIMEZONES } from "@/lib/time"

import { createOrganization } from "../actions"

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

const noopSubscribe = () => () => {}

export function NewOrgForm({ kind }: { kind: "club" | "sponsor" }) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  // Server renders the default; the client swaps in the browser's timezone without a hydration mismatch.
  const detected = useSyncExternalStore(
    noopSubscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "America/New_York",
  )
  const [picked, setPicked] = useState<string | null>(null)
  const zone = picked ?? detected
  const zones = COMMON_TIMEZONES.includes(zone) ? COMMON_TIMEZONES : [zone, ...COMMON_TIMEZONES]

  return (
    <ActionForm action={createOrganization}>
      <input type="hidden" name="kind" value={kind} />
      <Field label={kind === "club" ? "Club name" : "Business name"} htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
        />
      </Field>
      <Field
        label="Web address"
        htmlFor="slug"
        hint={kind === "club" ? `Your club site: ${slug || "your-club"}.${ROOT_DOMAIN}` : "Used in links to your profile."}
      >
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value))
          }}
        />
      </Field>
      {kind === "club" ? (
        <Field label="School (optional)" htmlFor="school">
          <Input id="school" name="school" placeholder="e.g. Boston College" />
        </Field>
      ) : null}
      <Field label="City (optional)" htmlFor="city">
        <Input id="city" name="city" />
      </Field>
      <Field label="Timezone" htmlFor="timezone" hint="Event times are shown in this timezone.">
        <select id="timezone" name="timezone" value={zone} onChange={(e) => setPicked(e.target.value)} className={selectClass}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>
      <SubmitButton className="w-full" pendingText="Creating…">
        {kind === "club" ? "Create club" : "Create sponsor profile"}
      </SubmitButton>
    </ActionForm>
  )
}
