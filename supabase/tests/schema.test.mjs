import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

// Runs every migration in supabase/migrations against an in-memory Postgres (PGlite)
// with stand-ins for Supabase's auth and storage schemas, then checks the access rules.
// Usage: pnpm test:db
const dir = new URL("../migrations/", import.meta.url);
const migration = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()
  .map((f) => fs.readFileSync(new URL(f, dir), "utf8")).join("\n");
const db = new PGlite();

// Minimal stand-ins for what Supabase provides.
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
  alter table storage.objects enable row level security;
  grant select, insert, update, delete on storage.objects to authenticated; grant select on storage.objects to anon;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema storage to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`);

await db.exec(migration);
console.log("migration applied");

const U = {
  alice: "00000000-0000-0000-0000-00000000000a",
  bob: "00000000-0000-0000-0000-00000000000b",
  carol: "00000000-0000-0000-0000-00000000000c",
  dave: "00000000-0000-0000-0000-00000000000d",
  erin: "00000000-0000-0000-0000-00000000000e",
};
for (const [name, id] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id, `${name}@example.com`, { full_name: name },
  ]);
}

let failures = 0;
async function as(user, sql, params = []) {
  await db.exec("reset role");
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ? U[user] : ""]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
async function expectOk(label, user, sql, params, check) {
  try {
    const r = await as(user, sql, params);
    if (check && !check(r.rows)) {
      failures++;
      console.log(`FAIL ${label}: unexpected rows ${JSON.stringify(r.rows)}`);
    } else console.log(`ok   ${label}`);
    return r.rows;
  } catch (e) {
    failures++;
    console.log(`FAIL ${label}: ${e.message}`);
  }
}
async function expectErr(label, user, sql, params, pattern) {
  try {
    const r = await as(user, sql, params);
    failures++;
    console.log(`FAIL ${label}: expected error, got ${JSON.stringify(r.rows)}`);
  } catch (e) {
    if (pattern && !pattern.test(e.message)) {
      failures++;
      console.log(`FAIL ${label}: wrong error "${e.message}"`);
    } else console.log(`ok   ${label} (${e.message})`);
  }
}

// Profiles from trigger
const profiles = await db.query("select count(*)::int n from public.profiles");
console.log(profiles.rows[0].n === 5 ? "ok   profiles created by trigger" : (failures++, "FAIL profiles"));

// Org creation
const [club] = await expectOk("alice creates club", "alice",
  `select * from public.create_organization('club', 'paddle-club', 'Paddle Club')`, [], (r) => r.length === 1);
const [sponsor] = await expectOk("dave creates sponsor", "dave",
  `select * from public.create_organization('sponsor', 'bean-cafe', 'Bean Cafe')`, [], (r) => r.length === 1);
await expectErr("reserved slug rejected", "carol",
  `select * from public.create_organization('club', 'admin', 'Nope')`, [], /check constraint/);
await expectErr("anon cannot create org", null,
  `select * from public.create_organization('club', 'anon-club', 'Anon')`, [], /permission denied/);
await expectErr("no direct org insert", "carol",
  `insert into public.organizations (kind, slug, name) values ('club', 'sneaky', 'Sneaky')`, [], /permission denied/);

// Events
const future = new Date(Date.now() + 3 * 864e5).toISOString();
const soon = new Date(Date.now() + 30 * 60e3).toISOString();
const [ev] = await expectOk("owner creates capped event", "alice",
  `insert into public.events (organization_id, title, starts_at, capacity) values ($1, 'Open play', $2, 1) returning id`,
  [club.id, future], (r) => r.length === 1);
await expectErr("member-less user cannot create event", "carol",
  `insert into public.events (organization_id, title, starts_at) values ($1, 'x', $2)`, [club.id, future], /row-level security/);
await expectErr("sponsor owner cannot create event in club", "dave",
  `insert into public.events (organization_id, title, starts_at) values ($1, 'x', $2)`, [club.id, future], /row-level security/);
await expectOk("anon sees public event", null, `select id from public.events`, [], (r) => r.length === 1);
await expectErr("anon cannot read check-in codes", null, `select * from public.event_checkin_codes`, [], /permission denied/);

// RSVP + capacity + waitlist
await expectOk("bob RSVPs (auto-joins open club) -> going", "bob",
  `select public.rsvp_to_event($1) s`, [ev.id], (r) => r[0].s === "going");
await expectOk("carol RSVPs -> waitlisted", "carol",
  `select public.rsvp_to_event($1) s`, [ev.id], (r) => r[0].s === "waitlisted");
await expectOk("carol sees only her own RSVP", "carol",
  `select user_id from public.event_rsvps`, [], (r) => r.length === 1 && r[0].user_id === U.carol);
await expectOk("availability shows 1 going 1 waitlisted", null,
  `select * from public.get_event_availability(array[$1]::uuid[])`, [ev.id], (r) => r[0].going === 1 && r[0].waitlisted === 1);
await expectOk("bob cancels", "bob", `select public.cancel_rsvp($1)`, [ev.id]);
await expectOk("carol promoted to going", "alice",
  `select status from public.event_rsvps where user_id = $1`, [U.carol], (r) => r[0].status === "going");
await expectOk("member update affects 0 rows", "bob",
  `update public.events set title = 'hacked' where id = $1 returning id`, [ev.id], (r) => r.length === 0);
await expectOk("member self-promotion affects 0 rows", "bob",
  `update public.organization_members set role = 'admin' where user_id = $1 returning *`, [U.bob], (r) => r.length === 0);

// Guest RSVP off by default, on when allowed
await expectErr("guest RSVP blocked by default", null,
  `select public.guest_rsvp($1, 'Gus', 'gus@example.com')`, [ev.id], /not available/);
await expectOk("admin enables guest RSVPs", "alice",
  `update public.clubs set allow_guest_rsvp = true where organization_id = $1 returning 1`, [club.id], (r) => r.length === 1);
await expectOk("guest RSVP -> waitlisted (event full)", null,
  `select public.guest_rsvp($1, 'Gus', 'GUS@example.com') s`, [ev.id], (r) => r[0].s === "waitlisted");

// Waivers
await expectOk("admin publishes waiver", "alice",
  `insert into public.waivers (organization_id, version, title, body, created_by) values ($1, 1, 'Liability', 'I accept the risks.', $2) returning id`,
  [club.id, U.alice], (r) => r.length === 1);
await expectOk("admin requires waiver", "alice",
  `update public.clubs set require_waiver = true, allow_guest_rsvp = false where organization_id = $1 returning 1`, [club.id]);
const [ev2] = await expectOk("event 2", "alice",
  `insert into public.events (organization_id, title, starts_at) values ($1, 'Clinic', $2) returning id`, [club.id, future]);
await expectErr("erin RSVP without waiver fails", "erin", `select public.rsvp_to_event($1)`, [ev2.id], /waiver/);
const [w] = await as("erin", `select id from public.waivers where organization_id = $1 and is_active`, [club.id]).then((r) => r.rows);
await expectOk("erin signs waiver", "erin",
  `insert into public.waiver_signatures (waiver_id, organization_id, user_id, signed_name) values ($1, $2, $3, 'Erin E') returning signed_at`,
  [w.id, club.id, U.erin]);
await expectErr("erin cannot sign for bob", "erin",
  `insert into public.waiver_signatures (waiver_id, organization_id, user_id, signed_name) values ($1, $2, $3, 'Bob B')`,
  [w.id, club.id, U.bob], /row-level security/);
await expectOk("erin RSVP after signing -> going", "erin", `select public.rsvp_to_event($1) s`, [ev2.id], (r) => r[0].s === "going");

// Check-in
const [ev3] = await expectOk("event starting soon", "alice",
  `insert into public.events (organization_id, title, starts_at) values ($1, 'Tonight', $2) returning id`, [club.id, soon]);
const [code] = await expectOk("staff reads QR code", "alice",
  `select code from public.event_checkin_codes where event_id = $1`, [ev3.id], (r) => r.length === 1);
await expectOk("member cannot read QR code", "erin",
  `select code from public.event_checkin_codes`, [], (r) => r.length === 0);
await expectErr("wrong code rejected", "erin", `select public.self_check_in($1, 'nope')`, [ev3.id], /invalid/);
await expectOk("erin self checks in (walk-in)", "erin", `select public.self_check_in($1, $2) id`, [ev3.id, code.code], (r) => !!r[0].id);
await expectOk("second scan is idempotent", "erin", `select public.self_check_in($1, $2) id`, [ev3.id, code.code], (r) => !!r[0].id);
await expectOk("staff checks in bob manually", "alice",
  `insert into public.check_ins (event_id, organization_id, user_id, method, checked_in_by) values ($1, $2, $3, 'manual', $4) returning id`,
  [ev3.id, club.id, U.bob, U.alice]);
await expectErr("member cannot check others in", "erin",
  `insert into public.check_ins (event_id, organization_id, user_id, method, checked_in_by) values ($1, $2, $3, 'manual', $4)`,
  [ev3.id, club.id, U.carol, U.erin], /row-level security/);

await expectOk("anon sees member count (shown by default)", null, `select public.get_club_member_count($1) n`, [club.id], (r) => r[0].n === 4);
await expectOk("admin hides member count", "alice", `update public.clubs set show_member_count = false where organization_id = $1 returning 1`, [club.id]);
await expectOk("anon gets null when hidden", null, `select public.get_club_member_count($1) n`, [club.id], (r) => r[0].n === null);
await expectOk("member still sees count", "bob", `select public.get_club_member_count($1) n`, [club.id], (r) => r[0].n === 4);

// Stats + sponsorship
await expectErr("stats hidden while club closed to sponsors", "dave", `select * from public.get_club_stats($1)`, [club.id], /not available/);
await expectOk("member can see own club stats", "bob", `select * from public.get_club_stats($1)`, [club.id], (r) => r[0].active_members === 4);
await expectOk("club opens to sponsors", "alice",
  `update public.clubs set open_to_sponsors = true where organization_id = $1 returning 1`, [club.id]);
await expectOk("anon sees verified stats", null, `select * from public.get_club_stats($1)`, [club.id], (r) => r[0].active_members === 4);
const [pkg] = await expectOk("club publishes package", "alice",
  `insert into public.sponsorship_packages (organization_id, title, price_cents, deliverables) values ($1, 'Season sponsor', 50000, '{logo on site,shout-out at sessions}') returning id`,
  [club.id]);
await expectOk("anon sees package", null, `select id from public.sponsorship_packages`, [], (r) => r.length === 1);
const [deal] = await expectOk("sponsor proposes deal", "dave",
  `insert into public.sponsorship_deals (club_id, sponsor_id, package_id, proposed_by_org, proposed_by, title, amount_cents)
   values ($1, $2, $3, $2, $4, 'Bean Cafe x Paddle', 50000) returning id`,
  [club.id, sponsor.id, pkg.id, U.dave]);
await expectErr("sponsor cannot set platform fee", "dave",
  `update public.sponsorship_deals set platform_fee_cents = 0 where id = $1`, [deal.id], /permission denied/);
await expectErr("sponsor cannot accept own proposal", "dave",
  `update public.sponsorship_deals set status = 'accepted' where id = $1`, [deal.id], /cannot move/);
await expectOk("member (non-admin) cannot see deal", "bob", `select id from public.sponsorship_deals`, [], (r) => r.length === 0);
await expectOk("club admin accepts", "alice",
  `update public.sponsorship_deals set status = 'accepted' where id = $1 returning decided_at`, [deal.id], (r) => !!r[0].decided_at);
await expectErr("terms locked after acceptance", "dave",
  `update public.sponsorship_deals set amount_cents = 1 where id = $1`, [deal.id], /locked/);
await expectErr("sponsor cannot mark deal active", "dave",
  `update public.sponsorship_deals set status = 'active' where id = $1`, [deal.id], /cannot move/);
await expectOk("club admin marks payment received", "alice",
  `update public.sponsorship_deals set status = 'active' where id = $1 returning status`, [deal.id], (r) => r[0].status === "active");
await expectOk("club admin completes deal", "alice",
  `update public.sponsorship_deals set status = 'completed' where id = $1 returning status`, [deal.id], (r) => r[0].status === "completed");
await expectOk("both parties add deliverable", "dave",
  `insert into public.deal_deliverables (deal_id, description, event_id) values ($1, 'Logo on site', $2) returning id`, [deal.id, ev3.id]);
await expectErr("outsider cannot add deliverable", "carol",
  `insert into public.deal_deliverables (deal_id, description) values ($1, 'x')`, [deal.id], /row-level security/);

// Profiles privacy
await expectOk("staff sees member profiles", "alice", `select id from public.profiles`, [], (r) => r.length >= 4);
await expectOk("member sees only self", "bob", `select id from public.profiles`, [], (r) => r.length === 1);

// Storage
await expectOk("staff uploads club logo", "alice",
  `insert into storage.objects (bucket_id, name) values ('org-media', $1) returning id`, [`${club.id}/logo.png`]);
await expectErr("member cannot upload to club folder", "bob",
  `insert into storage.objects (bucket_id, name) values ('org-media', $1)`, [`${club.id}/x.png`], /row-level security/);
await expectErr("garbage folder rejected", "alice",
  `insert into storage.objects (bucket_id, name) values ('org-media', 'not-a-uuid/x.png')`, [], /row-level security/);
await expectOk("own avatar upload", "bob",
  `insert into storage.objects (bucket_id, name) values ('avatars', $1) returning id`, [`${U.bob}/me.png`]);

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
