# ClubPack architecture audit (2026-11-25)

Scope: the Next.js repo (252 tracked files), the live Supabase project `ClubPack` (19 public tables, Postgres 17), and the marketing content. Findings come from reading code, the live schema, and Supabase's security advisors. I did not run the app or load-test anything. Where something is inferred rather than observed, it says so.

## TL;DR

1. **Multi-tenancy is hand-rolled and fragile.** A 170-line `proxy.ts` parses hostnames, rewrites tenant traffic into a `/[site]` path segment, and hard-codes route allowlists. There is no custom-domain support, and every tenant page is dynamic and uncached.
2. **The data model grew organically.** Users are bound to one club, member identity is duplicated per club, config is split over four 1:1 tables, and the repo only contains 7 of the ~19 tables' DDL.
3. **One critical security hole is live right now:** `waiver_submissions` (148 rows of names, emails, photos and waiver URLs) has RLS disabled, with an `Allow all operations` policy sitting unenforced on it.
4. **The product and content are stale.** Billing is a stub, the blog is all July 2025, marketing claims and hosts are inconsistent, and the tour is mock data.

Recommendation: rebuild the tenancy layer and schema first (they gate everything), port the existing UI onto them, and rewrite content last.

---

## 1. Multi-tenant architecture

### What exists
- `proxy.ts` extracts a subdomain from `Host` using `NEXT_PUBLIC_ROOT_DOMAIN`. Three cases:
  - `my.<root>` is the admin app.
  - `<anything>.<root>` is a club site, rewritten to `/<subdomain>/<path>` and served from `app/(club-site)/[site]`.
  - The bare root and `localhost` are marketing.
- Hard-coded `ADMIN_ROOT_SEGMENTS` and `MARKETING_ROOT_SEGMENTS` sets decide what's reachable on each host. Adding a route means editing the proxy, and forgetting is silent: unknown paths on the admin host are rewritten to `/home`, and unknown paths on the root host to `/`.
- Admin lives in the same app and project as tenant sites, split by `my.` rather than by a real boundary.

### Problems
| # | Issue | Why it matters |
|---|---|---|
| T1 | No custom domains. The Premium plan advertises "Custom domain" but nothing implements it. | Core Vercel for Platforms feature, and a paid-tier promise with no code behind it. |
| T2 | Tenant resolved by `subdomain` string at request time, with a hack in `getClubBySubdomain`: if the exact match fails, retry with hyphens stripped. `record_club_page_view` does the same in SQL. | Two clubs `happy-mile` and `happymile` could collide. Identity should resolve once to a stable `club_id`. |
| T3 | `createClient()` reads `cookies()` in the club-site layout and every page. | Every public tenant page is dynamic. Public club pages (home, events, about, policy) are ideal for ISR / Cache Components keyed by tenant, and currently get none of that. This is also a CDN and cost problem as tenants grow. |
| T4 | Wildcard handling is manual. There's no `*.joinclubpack.com` domain strategy, and `tenant === my` isn't a reserved-name check on club creation (I didn't see one in `create-club-form.tsx`; verify). | A club named `my`, `www`, `api` or `admin` would shadow or break routing. |
| T5 | Root domain is inconsistent: `joinclubpack.com` appears 23 times, `clubpack.com` 4 times, plus an env-driven `ROOT_DOMAIN`. Marketing hard-codes `https://my.joinclubpack.com` in places and `APP_ORIGIN` in others. | Divergent links and emails. |
| T6 | Marketing CTAs point at `my.joinclubpack.com/signup`, but the real route is `/auth/sign-up`. `/signup` isn't in the admin allowlist, so the proxy likely rewrites it to `/home` and then to login. 12 call sites. | Likely a broken top-of-funnel link (inferred from the proxy logic, not tested live). |
| T7 | Auth cookies are not scoped to the parent domain. Each tenant host gets its own session, so a user can't be signed in across `my.` and a club site. | Fine as a choice, but it isn't a deliberate one, and it prevents "I'm a member of 3 clubs" from working smoothly. |

### Target (Vercel for Platforms)
- **Wildcard domain** `*.joinclubpack.com` on the project, and the **Vercel Domains API** (`@vercel/sdk`) to attach/verify custom domains per tenant.
- **One tenant resolver**: `host -> tenant` lookup, backed by a `tenant_domains` table (see section 2) with Runtime Cache or Global Config (formerly Edge Config) for fast lookups from the proxy. The proxy just rewrites to `/_sites/[tenant]/...` (or `/[domain]`), and nothing else.
- **Separate surfaces**: marketing, admin (`app.` / `my.`), and tenant sites as route groups (or Vercel Services / separate projects if you want independent deploys). Auth only where it's needed.
- **Cache public tenant pages** with `cacheComponents` / `use cache` and `cacheTag("tenant:<id>")`; call `revalidateTag` from admin mutations. Keep the logged-in bits (nav avatar, RSVP state) as small dynamic islands.
- Tenant-aware `robots`, `sitemap`, OG images and favicons per tenant.
- BotID or Firewall rules on the public form/RPC endpoints (contact, tour leads, page-view).

---

## 2. Data model

### What's live (public schema)
`clubs`, `profiles`, `memberships`, `events`, `rsvps`, `faqs`, `club_settings`, `waiver_settings`, `waiver_submissions`, `club_policy`, `club_sponsorship_profiles`, `club_contact_submissions`, `contact_submissions`, `club_website_views`, `activity_log`, `notifications`, `subscriptions`, `event_templates`, `tour_leads`.

### Structural problems
| # | Issue | Evidence |
|---|---|---|
| D1 | **A user belongs to one club.** `profiles.club_id` is a single FK and `profiles.role` is a global `admin|member` string. There's no roles/organisation-membership table. | `get-admin-context.ts` checks `profile.role === "admin"`. A person who runs two clubs, or is admin of one and member of another, can't be modelled. |
| D2 | **Person identity is duplicated per club.** `memberships` carries its own `name`, `email`, `phone`, `avatar_url`, plus `auth_user_id` (nullable). `profiles` also has `name`, `first_name`, `last_name`, `email`. The `profiles.name` column is commented "legacy". `rsvps` copies `name`, `email`, `avatar_url` again. | Same person = N copies that drift. |
| D3 | **Config sprayed across 1:1 tables**: `club_settings`, `waiver_settings`, `club_policy`, `club_sponsorship_profiles` each have `club_id UNIQUE`. Three of them are created by triggers (`create_club_settings_for_club`, `insert_default_club_settings`, `create_waiver_settings_for_club`), so two trigger functions create the same thing. | 8 rows in each. They belong as columns or a single `jsonb` settings row. |
| D4 | **`clubs` mixes identity, branding, content, and billing.** It holds `plan` and also `subscriptions.plan`; `hero_image_url`, `hero_image_small_url` and `hero_image_large_url` (the events table already dropped the equivalents); `use_mock_content`; `description`, `about_blurb`, `tagline`, `hero_subtext` (four overlapping copy fields); `meeting_location`, `meeting_time` (free-text). | Code compensates with fallback chains like `desc \|\| heroSubtext \|\| tagline`. |
| D5 | **Types are guesses.** `ClubRow` and `EventRow` in `lib/data/club-site.ts` declare columns that don't exist (`logo`, `hero_image`, `location`, `city`, `state`, `contact_email`, `event_image`) with `[key: string]: unknown`, and queries use `select("*")`. A commit in history ("revert select(*) to fix production crash") shows the cost. There are no generated Supabase types. | |
| D6 | **Events time model.** `event_date` is `timestamp without time zone` yet code treats it as a date (`.slice(0,10)`); `event_time` and `end_time` are separate `time` columns; there is no timezone. Meanwhile `rsvp_open_time` is `timestamptz`. `status` is stored (`upcoming/completed/cancelled`) and can go stale. `current_attendees` is a counter alongside real `rsvps` rows. | Events will show wrong times for anyone off the author's timezone. Replace with `starts_at`/`ends_at timestamptz` plus a club `timezone`, and derive status. |
| D7 | **RSVP and membership integrity.** `rsvps.membership_id` and `rsvps.club_id` are nullable; no unique `(event_id, membership_id)`; `memberships` has no unique `(club_id, email)` or `(club_id, auth_user_id)`. (Constraint list from `list_tables` showed only PK/FK/check, so these are absent.) | Duplicate RSVPs and duplicate members are possible. |
| D8 | **Cross-tenant FKs aren't enforced.** `rsvps.club_id` isn't tied to `events.club_id`; same for `waiver_submissions`. | A row can reference an event of club A while claiming club B. |
| D9 | **Orphaned machinery.** Functions exist for tables that don't (`update_staff_profiles_updated_at`, `update_pending_invitations_updated_at`, `update_analytics_session` taking `p_visitor_id`). `contact_submissions` and `club_contact_submissions` overlap. `notifications` has 0 rows. `activity_log.action_type` is CHECK-limited to 3 values. | Dead schema from earlier iterations. |
| D10 | **Schema isn't in version control.** `supabase/migrations` has 7 files (Feb 2026), all `ALTER`s on tables whose `CREATE` isn't in the repo, so the DB can't be rebuilt from the repo. Migrations also lack the `supabase_migrations` timestamp format. | No staging DB, no reproducibility, no review of RLS changes. |
| D11 | **Plan/limit enforcement.** `subscriptions` has Stripe columns but there's no Stripe dependency in `package.json`; the billing page's upgrade button is `console.log("Change plan")` with a `TODO: integrate real Stripe checkout`. "Up to 50 members" is marketing copy; I did not find enforcement (my search for it errored in the shell, so treat as unverified). | You're advertising limits and tiers you can't bill or enforce. |

### Security (live project, from Supabase advisors)
- **CRITICAL: `waiver_submissions` has RLS disabled** and carries 5 policies including one named `Allow all operations`. Anyone holding the public anon key can read/modify all 148 rows (names, emails, photos, signed-waiver URLs). Suggested fix (not applied, since policies need your input):
  ```sql
  ALTER TABLE public.waiver_submissions ENABLE ROW LEVEL SECURITY;
  -- then review and drop the "Allow all operations" policy
  ```
  Also check the `club-waivers` storage bucket's access, since waiver URLs live there.
- `tour_leads` SELECT policy is `USING (true)` for any `authenticated` user, so any club member can read every lead's email.
- 8 `SECURITY DEFINER` functions are callable by `anon` and `authenticated` over `/rest/v1/rpc/...`, including trigger functions (`log_*`, `create_*_settings`), `is_club_admin`, and `update_analytics_session`. Revoke `EXECUTE` on the trigger ones. `record_club_page_view` is intentionally public but unthrottled, and it inserts rows anyone can spam (2,899 rows so far).
- 15 functions have a mutable `search_path`. Leaked-password protection is off. Postgres has pending security patches.
- Tenant isolation currently depends entirely on RLS plus per-query `.eq("club_id", ...)`. The admin server actions all filter by `profile.club_id`, which is good, but nothing enforces it structurally.

### Target schema (sketch)
```
organizations(id, slug, name, plan, status, timezone, ...)          -- the tenant
tenant_domains(id, org_id, hostname UNIQUE, kind: subdomain|custom, verified_at, is_primary)
people(id = auth.users.id, display_name, avatar_url, ...)          -- one identity
org_members(org_id, person_id, role: owner|admin|member, joined_at, PK(org_id, person_id))
org_settings(org_id PK, branding jsonb, features jsonb, copy jsonb) -- replaces 4 1:1 tables
events(id, org_id, title, starts_at timestamptz, ends_at, venue jsonb, capacity, ...)
rsvps(event_id, person_id, org_id, status, PK(event_id, person_id), composite FK to events(id, org_id))
waivers / waiver_signatures(org_id, person_id, ...)                 -- RLS on, private bucket
subscriptions(org_id, stripe_*, status, ...)                        -- single source of truth for plan
```
Plus generated types (`supabase gen types`), RLS written against `org_members`, and every migration committed.

---

## 3. Application code

- **Size and shape.** ~5.5k lines in admin pages, with `events-client.tsx` at 1,058 lines, `website-client.tsx` 623, `create-event-dialog.tsx` 555, `waivers-client.tsx` 485. 71 `"use client"` files. Data fetching and mutation are mixed into big client components.
- **No data-access layer.** 90+ direct `.from("...")` calls spread through pages, actions and even client components (`onboarding-form.tsx`, `account-settings.tsx`, `create-club-form.tsx`). `memberships` alone is queried 30 times.
- **Club creation is client-side and non-atomic** (`create-club-form.tsx`): check subdomain, insert `clubs`, then update `profiles`, as separate browser calls. A failure midway leaves an orphan club. This should be one server action or RPC transaction that also provisions the domain, settings and Stripe customer.
- **Two auth stacks**: admin auth under `app/(admin-auth)/auth/*` and a separate club-member auth under `app/(club-site)/(auth)/[site]/*`, both on Supabase but with different flows and a hand-written `getAdminContext`. Needs one auth model with org-scoped roles.
- **Tooling drift.** `bun.lock` and `pnpm-lock.yaml` both existed (bun.lock removed 2026-11-25); the README is still the create-next-app template (and mentioned `.env.example`, which didn't exist; now added); there are no tests; `lint` is the only script; there is no CI config. Dependencies are mostly current (Next 16.4.6, React 19.3), so the framework itself isn't the outdated part.
- **Analytics** is a bespoke page-view RPC + dashboard (`club_website_views`, `analytics-utils.ts`). With Vercel you already have `@vercel/analytics` installed; per-tenant analytics could use Web Analytics custom events or a proper events table with retention.
- **Dirty working tree.** Large uncommitted changes (marketing rewrite, 40+ deleted images) are in progress, so this audit reflects the working tree, not `main`.

---

## 4. Product and content

- **Billing/plans** (see D11): the pricing page and the in-app billing page both define the plans separately (and differently: "White-label options" appears only on the marketing copy), so there are two sources of truth. Advertised but not built: Mobile app access, Third-party integrations, AI-powered insights, API access, Custom domain, White-label.
- **Blog**: 12 posts, all dated 2025-07-11 to 2025-07-22 (about 16 months old), generic SEO pieces (frontmatter keywords, `readingTime`), none about the product. Needs a refresh or removal.
- **Marketing claims**: hero sticker says "100+ clubs" and "Live in 3 mins". The database has 8 clubs and 285 memberships. Either the claim refers to something outside this DB or it's inflated; confirm before shipping.
- **Tour** (`app/tour`) runs on `mock-data.ts` (212 lines) and `use_mock_content` is a column on `clubs`, so mock content is a production schema concern.
- **Feature set vs. a modern club product**: missing paid events/ticketing, dues collection, member roles and committees, email/SMS broadcasts (the `messages` page is only a contact-form inbox), calendar sync (ICS/Google), recurring events, check-in (the `attendance` column exists on `rsvps` but I did not trace its UI), mobile/PWA. Many of these are what Premium advertises.
- **Accessibility, SEO and performance** weren't measured. Given T3 (uncached tenant pages) and a recent "CLS improvements" commit, run Lighthouse and the Vercel Speed Insights data you already collect.

---

## 5. Suggested order of work

1. **Today (security, ~1 hour):** enable RLS on `waiver_submissions` and review its policies; lock down `tour_leads` SELECT; revoke anon/authenticated `EXECUTE` on trigger functions; confirm `club-waivers` bucket privacy.
2. **Baseline:** link a Supabase branch/staging project; dump the current schema into `supabase/migrations` (`supabase db pull`); generate TS types; pick one package manager; add CI (typecheck, lint, build).
3. **New schema + migration plan:** orgs / domains / org_members / people; backfill from `clubs`, `profiles`, `memberships`; fix event time model; add integrity constraints. Run old and new in parallel behind a view layer.
4. **Tenancy on Vercel for Platforms:** wildcard domain, `tenant_domains` lookup, thin proxy, cached tenant pages with tag invalidation, custom-domain onboarding via the Domains API.
5. **Admin app:** introduce a data-access layer and server actions; split the big client components; one auth model with org roles; atomic org creation.
6. **Billing:** Stripe (via the Vercel Marketplace or direct) as the single source for plans; enforce limits server-side; delete mock plan copies.
7. **Content/product refresh:** decide the real feature set per plan, rewrite marketing to match, replace or retire the blog, and make the tour use a real demo tenant instead of `mock-data.ts`.

## Open questions for you
- Are there clubs on custom domains today, or should custom domains be a net-new feature? (Nothing in the code supports them.)
- Do you want to keep the Supabase project, or is a fresh project plus data migration acceptable? (This determines whether the schema changes are in-place migrations.)
- Which is the canonical root domain: `joinclubpack.com` or `clubpack.com`?
- Is "100+ clubs" a real number from somewhere other than this database?
