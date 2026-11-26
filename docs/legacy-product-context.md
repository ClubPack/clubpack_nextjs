# Legacy ClubPack: what the product was (snapshot 2026-11-25)

Read-only snapshot of the production Supabase project, kept as context for the restructure. Aggregates only; no personal data.

## What it was
A self-serve "club in a box" for student/community clubs: a branded subdomain site (`<club>.joinclubpack.com`), member sign-up, events with RSVPs and map locations, FAQs, contact form, optional liability waivers, a club policy page, basic analytics, and a sponsor-facing profile. Admin lived at `my.<root>`. Plans (starter/free, growth, premium) were never really billed.

## The 8 clubs
| Club | Created | Members | Events | RSVPs | Page views | Notes |
|---|---|---|---|---|---|---|
| BC Paddle Club (`bcpaddleclub`) | 2025-09 | 271 | 9 | 32 | 2,827 | The real product-market fit: ~95% of all members and ~98% of traffic. Capacity-limited sessions, waivers, 3 admins. |
| Happy Mile Run Club | 2025-06 | 9 | 6 | 7 | 50 | Founder's own club; only subscription row, status `canceled`. |
| BC Rebuilding Together Boston | 2025-07 | 1 | 5 | 51 | 22 | RSVP-heavy (guest RSVPs without accounts). |
| Phi Delta Phi, SWE BC | 2025-07 | 0 | 3 each | 0 | ~1 | Created, seeded events, abandoned. |
| Afghan Student Club, PSMA, La Onda | 2026-01/02 | 0-4 | 0 | 0 | ~0 | Signed up, never set up. |

## Usage facts
- 285 memberships, all linked to an auth user (so there was no guest membership concept); 309 auth users, only 4 active in the last 30 days.
- Member joins by month track the Paddle Club's semester cycles (spike of 127 in Sep 2026); the biggest month of site traffic was Sep 2026.
- Events: 26 total, 25 with images, 12 with map coordinates, 3 with capacity limits. The `status` column was never used (all `upcoming`); 1 of 90 RSVPs ever marked attended, so check-in was effectively unused.
- 38 of 90 RSVPs were tied to a membership; the rest were guest RSVPs with name/email only.
- Waivers: enabled for 2 of 8 clubs; 82 members have a waiver on file; 408 files in the `waiver-submissions` bucket.
- Settings: `require_login_to_rsvp` on for 7/8; `show_explore_page` on for 3/8 (explore never shipped as a page); one club opted in to sponsorships.
- Traffic by path: home 1,167; `/login` 419 and `/signup` 418 (members sign in/up constantly); events 254; about 249; contact 239; account 109; policy 5. Event detail pages get little traffic.
- Admin activity: 296 member joins, 48 events created, 17 deleted (event creation stopped being logged after 2026-02-20, so the log is incomplete).
- Event templates (9, trending flag, category/tags): running-themed (Sunrise 5K, Night Run, Charity Fun Run, Coffee Crawl...) inherited from the first club.
- Contact form (platform-level): 2 submissions ever.
- Leads: 15 from the tour page.

## Legacy storage buckets
Private: `club-assets` (49), `club-events` (60), `club-waivers` (1), `member-avatars` (70). Public: `default-bg`, `event-templates`, `mock-event-images`, `mock-hero-image`, and **`waiver-submissions` (408 objects, PUBLIC)**. Signed waivers and photos in a public bucket must not be carried into the new system, and the URLs are stored in table columns, so moving them needs a data migration.

## Takeaways for the restructure
- One club carries the product. Design for that shape (large membership, recurring sessions with capacity, waivers, check-in) before generic multi-club features.
- Most signups never complete setup; the activation path (first event, first member) is the real funnel problem.
- Members authenticate on every club site separately and repeatedly (login/signup are ~25% of page views); a single identity across clubs would remove that.
- Guest RSVP (no account) was already common at the one RSVP-heavy club.
- Billing, explore, sponsorships, notifications (0 rows) and analytics-sessions are unproven or unused.
