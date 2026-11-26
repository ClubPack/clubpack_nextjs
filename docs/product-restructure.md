# ClubPack restructure: product spec (draft, 2026-11-25)

**One line:** ClubPack runs the day-to-day of active clubs (sign-ups, waivers, sessions, check-in). It turns that activity into verified reach that sponsors pay for.

Context: [legacy-product-context.md](legacy-product-context.md) (what the old product was) and [../AUDIT.md](../AUDIT.md) (what's wrong technically).

---

## 1. Who it's for

| Side | Who | Job to be done | What they pay |
|---|---|---|---|
| **Club admins** | Officers of active, recurring clubs: club sports, run/fitness, outdoor, service orgs. The BC Paddle Club shape. | "Get people signed up, waivered, into capped sessions and checked in without spreadsheets and Google Forms." | Free core. Possibly a small Pro tier later. |
| **Members** | Students/community members | "Join, sign the waiver once, grab a spot, show up." | Nothing |
| **Sponsors** | Local businesses first (cafés, gyms, gear shops, food), later student-facing brands | "Reach real, active students in my area with proof it worked." | Pay per package; ClubPack takes a cut |

Out of scope for now: large Greek orgs with dues and complex finances, school-wide student government tooling, national sponsor sales.

---

## 2. The three loops

```
  OPS LOOP (clubs)                 GROWTH LOOP (site)              MONEY LOOP (sponsors)
  create session ──► members       club page ──► join / grab spot   verified stats ──► sponsor kit
       ▲               sign up           ▲             │                  ▲                 │
       │                 │               │             ▼                  │                 ▼
  check-in data ◄── attend          shared link ◄── member invites   attendance ◄── sponsor perk at session
```

Every loop feeds the attendance data. **Check-in is the most important feature in the product.** It must be the easiest thing in the product, because it's what makes sponsor reach "verified".

---

## 3. Product surfaces

### A. Club admin app (`app.joinclubpack.com`)
Ordered by priority:
1. **Sessions**: create one-off or **recurring** sessions with capacity, waitlist, location, RSVP open time. Duplicate last week's session in one click.
2. **Check-in**: on the session day, a full-screen roster with tap-to-check-in, a **QR code members scan**, and walk-in add. Works on a phone at the door.
3. **Members**: roster with join date, waiver status, attendance count and streak; filters (active this semester, no waiver, at risk); CSV export.
4. **Waivers**: upload a waiver once; members e-sign in the join flow (typed name + checkbox + timestamp; no PDF uploads). Stored privately.
5. **Messages**: email (later SMS) to all, a session's RSVPs, or a filter ("didn't show last 3 weeks").
6. **Club page editor**: logo, colours, hero, about, FAQs, links. Deliberately small.
7. **Sponsors tab** (phase 2): your sponsor kit, incoming offers, active deals, deliverables checklist.
8. **Insights**: attendance over time, retention by semester, top members. These are the same numbers sponsors see.

Multi-admin with roles (owner, admin, check-in only), and **officer handoff**: transfer ownership at semester end without losing history.

### B. Member experience (club subdomain + shared account)
- **One ClubPack account across all clubs**: sign in once, see "My clubs" and "My upcoming sessions".
- **Join flow in one screen**: name, email/OTP, waiver e-sign, done. Guest RSVP allowed per club setting, then converts to a member on second visit.
- **Session page**: spots left, RSVP, add to calendar, waitlist; QR ticket on the day.
- Member profile is shared; club-specific data (waiver, attendance) is per club.

### C. Public club site (`<club>.joinclubpack.com` or custom domain)
A fast, cached conversion page: hero, next 3 sessions with spots left, join CTA, about, FAQs, sponsor logos ("Supported by…", which is also a deliverable sponsors get). No blog or page builder. Per-club OG image so links shared in group chats look good.

### D. Sponsor side (phase 2 → 3)
- **Sponsor kit** (public, per club, opt-in): verified stats (active members, average attendance, retention, school), audience tags, past sponsors, **packages with prices** (e.g. "Logo on site + session shout-out: $150/semester", "Host a session at your venue", "Student discount code").
- **Discovery** (phase 3): sponsors browse/filter clubs by school, area, size, interest and send offers.
- **Deal flow**: offer → club accepts → payment held (Stripe Connect) → deliverables checked off (logo live, perk at session X, post) → payout to club minus ClubPack fee.
- **Proof report** after each deal: attendance at sponsored sessions, perk redemptions, page impressions. This is what makes sponsors come back.

### E. Marketing site (`joinclubpack.com`)
Two audiences, two paths: "Run your club" (main) and "Sponsor student clubs". Real numbers only. Replace the 2025 SEO blog with a few useful pieces (sponsorship guide for clubs, officer handoff checklist).

---

## 4. What we cut or defer
| Cut | Why |
|---|---|
| Event-ideas templates (running-themed) | 1 club's leftovers, not a job anyone hires us for |
| Explore page | Never shipped; sponsor discovery replaces it |
| Plan tiers (Free/Growth/Premium) and the fake billing page | No billing exists; monetise via sponsorship first |
| "AI insights", "mobile app", "API access", "white-label" claims | Not built |
| Bespoke page-view analytics table | Use Vercel Web Analytics with per-tenant custom events |
| PDF waiver uploads to a public bucket | Replace with in-app e-sign stored privately |
| Separate admin and member auth systems | One account, org-scoped roles |
| Tour with mock data | Replace with a real demo club |

---

## 5. Data model (new Supabase project)

```
people            (id = auth.users.id, name, avatar_url, school, grad_year, phone)
orgs              (id, slug, name, kind: club|sponsor, school, city, timezone, branding jsonb, status)
org_domains       (org_id, hostname UNIQUE, kind: subdomain|custom, verified_at, is_primary)
org_members       (org_id, person_id, role: owner|admin|checkin|member, joined_at, left_at, PK(org_id, person_id))

sessions          (id, org_id, series_id?, title, starts_at timestamptz, ends_at, location jsonb,
                   capacity, rsvp_opens_at, visibility, sponsor_deal_id?)
session_series    (id, org_id, rrule, defaults jsonb)          -- recurring sessions
rsvps             (session_id, person_id, org_id, status: going|waitlist|cancelled, created_at,
                   PK(session_id, person_id), FK(session_id, org_id) -> sessions(id, org_id))
guest_rsvps       (session_id, org_id, name, email, claimed_by_person_id?)
checkins          (session_id, person_id?, guest_rsvp_id?, org_id, method: qr|tap|walkin, at, by_person_id)

waiver_versions   (id, org_id, body_md | file_path, created_at, active)
waiver_signatures (org_id, person_id, waiver_version_id, signed_name, signed_at, ip, UNIQUE(org_id, person_id, waiver_version_id))

sponsor_profiles  (org_id[kind=sponsor], categories, area, website)
club_packages     (id, org_id, title, deliverables jsonb, price_cents, per: semester|event, active)
deals             (id, club_org_id, sponsor_org_id, package_id?, terms jsonb, amount_cents, fee_cents,
                   status: offered|accepted|paid|delivering|completed|cancelled, stripe_*)
deal_deliverables (deal_id, kind, session_id?, due_at, done_at, proof jsonb)

org_stats_daily   (org_id, day, active_members, checkins, new_members, retention_30d)  -- materialised; powers kit + insights
messages          (id, org_id, audience jsonb, channel, subject, body, sent_at, sent_by)
```

Principles: one person identity; every tenant row carries `org_id` and RLS is written once against `org_members`; times are `timestamptz` with org timezone; stats are derived from `checkins`, never typed in; composite FKs stop cross-tenant references. Sponsors are orgs too, so they reuse auth, roles and domains.

---

## 6. Architecture (Vercel for Platforms)
- One Next.js app, three surfaces by host: `joinclubpack.com` (marketing), `app.` (admin + sponsor dashboard), `<slug>.` / custom domains (club sites).
- Thin `proxy.ts`: `host → org` via `org_domains` (cached in Runtime Cache / Global Config) → rewrite to `/_sites/[org]`. No hard-coded route lists.
- Club sites cached with `use cache` + `cacheTag('org:<id>')`, revalidated from admin mutations; RSVP state and "signed in as" are client islands.
- Auth: Supabase, cookie scoped to `.joinclubpack.com` so one sign-in works across club subdomains; custom domains use a handoff redirect.
- Payments: Stripe Connect (clubs as connected accounts) for sponsor deals only.
- Email: transactional + broadcasts via a Marketplace provider (e.g. Resend).
- Custom domains via the Vercel Domains API.

---

## 7. Phases

| Phase | Goal | Ship | Done when |
|---|---|---|---|
| **0. Foundation** (2–3 wks) | New project you can trust | New Supabase project + migrations in repo, generated types, tenancy proxy, one auth, CI | Paddle Club data migrated to staging; RLS tests pass |
| **1. Ops core** (4–6 wks) | Paddle Club switches over and prefers it | Sessions (recurring, capacity, waitlist), QR/tap check-in, e-sign waivers, members, messages, cached club site | Paddle Club runs a full week of sessions on it; >80% of attendees checked in |
| **2. Sponsor kit + hand matching** (parallel with 1's tail) | Prove sponsors pay | Insights + public sponsor kit generated from check-ins; packages; you close deals by hand (invoice manually) | 3 paid sponsor deals across 2+ clubs |
| **3. Grow clubs** | 10 active clubs | Officer handoff, onboarding that gets to "first session + first check-in" in one sitting, referrals from members ("start a club") | 10 clubs with weekly check-ins |
| **4. Marketplace** | Self-serve deals | Sponsor accounts, discovery, offers, Stripe Connect escrow + payouts, deliverables, proof reports | Deals close without you in the loop |

Key metrics: **weekly active clubs (≥1 session with check-ins)**, check-in rate (checked in ÷ going), member retention across semesters, sponsor deals closed and repeat rate, take-rate revenue.

---

## 8. Open decisions
1. Canonical domain: `joinclubpack.com` (assumed here) vs `clubpack.com`.
2. Migrate Paddle Club members into the new DB (accounts, waivers) or start fresh with re-onboarding? Recommend migrating people and waiver status, not old events.
3. ClubPack's fee on sponsor deals (e.g. 10–15%) and whether clubs ever pay.
4. Who are the first 3 sponsors to approach by hand for the Paddle Club?
5. School focus: double down on BC/Boston first (recommended) or stay geography-agnostic?
