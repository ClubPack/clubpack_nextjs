-- ClubPack: initial schema (clean rebuild, 2026-11-25)
--
-- Model:
--   people        profiles (1:1 with auth.users)
--   tenants       organizations (kind = club | sponsor) + clubs / sponsors subtype rows
--   access        organization_members (role + status) is the only source of authorization
--   ops           events -> event_rsvps -> check_ins, waivers -> waiver_signatures
--   money         sponsorship_packages (offered by clubs) -> sponsorship_deals -> deal_deliverables
--
-- Conventions:
--   * every tenant-owned row carries organization_id; child rows use composite FKs
--     (id, organization_id) so a row can never point at another tenant's data
--   * all times are timestamptz; the org's IANA timezone lives on organizations.timezone
--   * RLS on every table; helper predicates live in the unexposed `private` schema
--   * writes with business rules (join, RSVP, check-in, org creation) go through RPCs
--   * stats are derived from check_ins, never typed in

-------------------------------------------------------------------------------
-- 0. Schemas and types
-------------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public;

create type public.org_kind as enum ('club', 'sponsor');
create type public.member_role as enum ('owner', 'admin', 'staff', 'member');
create type public.member_status as enum ('pending', 'active', 'removed');
create type public.join_policy as enum ('open', 'approval', 'invite_only');
create type public.event_visibility as enum ('public', 'members');
create type public.event_status as enum ('scheduled', 'cancelled');
create type public.rsvp_status as enum ('going', 'waitlisted', 'cancelled');
create type public.checkin_method as enum ('qr', 'manual', 'walk_in');
create type public.billing_period as enum ('one_time', 'per_event', 'per_semester', 'per_year');
create type public.deal_status as enum ('proposed', 'accepted', 'declined', 'active', 'completed', 'cancelled');
create type public.broadcast_status as enum ('draft', 'queued', 'sent', 'failed');

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- 1. People
-------------------------------------------------------------------------------

create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  full_name        text not null default '' check (char_length(full_name) <= 120),
  avatar_path      text,
  school           text check (char_length(school) <= 120),
  graduation_year  smallint check (graduation_year between 1950 and 2100),
  phone            text check (char_length(phone) <= 32),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.profiles is 'One row per person, shared across every club and sponsor they belong to.';

-------------------------------------------------------------------------------
-- 2. Tenants
-------------------------------------------------------------------------------

create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  kind              public.org_kind not null,
  slug              text not null unique
                    check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$')
                    check (slug not in (
                      'www', 'app', 'api', 'admin', 'my', 'auth', 'mail', 'email', 'blog', 'help',
                      'support', 'docs', 'status', 'static', 'assets', 'cdn', 'dashboard',
                      'sponsor', 'sponsors', 'club', 'clubs', 'join', 'login', 'signup', 'account'
                    )),
  name              text not null check (char_length(name) between 2 and 120),
  tagline           text check (char_length(tagline) <= 160),
  description       text check (char_length(description) <= 5000),
  logo_path         text,
  cover_path        text,
  brand_color       text check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  school            text check (char_length(school) <= 120),
  city              text check (char_length(city) <= 120),
  region            text check (char_length(region) <= 120),
  country_code      text not null default 'US' check (country_code ~ '^[A-Z]{2}$'),
  timezone          text not null default 'America/New_York',
  website_url       text,
  instagram_handle  text check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  contact_email     text,
  is_public         boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  archived_at       timestamptz,
  unique (id, kind)
);
comment on table public.organizations is 'A tenant: a club or a sponsor. Served at <slug>.<root domain> or a verified custom domain.';

create table public.clubs (
  organization_id    uuid primary key,
  kind               public.org_kind not null default 'club' check (kind = 'club'),
  category           text check (char_length(category) <= 60),
  join_policy        public.join_policy not null default 'open',
  allow_guest_rsvp   boolean not null default false,
  require_waiver     boolean not null default false,
  open_to_sponsors   boolean not null default false,
  show_member_count  boolean not null default true,
  founded_year       smallint check (founded_year between 1800 and 2100),
  updated_at         timestamptz not null default now(),
  foreign key (organization_id, kind) references public.organizations (id, kind) on delete cascade
);

create table public.sponsors (
  organization_id  uuid primary key,
  kind             public.org_kind not null default 'sponsor' check (kind = 'sponsor'),
  industry         text check (char_length(industry) <= 60),
  service_area     text check (char_length(service_area) <= 200),
  updated_at       timestamptz not null default now(),
  foreign key (organization_id, kind) references public.organizations (id, kind) on delete cascade
);

-- Custom domains only. Subdomains are derived from organizations.slug.
create table public.organization_domains (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  hostname         text not null unique
                   check (hostname = lower(hostname) and hostname ~ '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$'),
  is_primary       boolean not null default false,
  verified_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index organization_domains_organization_id_idx on public.organization_domains (organization_id);
create unique index organization_domains_one_primary_idx on public.organization_domains (organization_id) where is_primary;

create table public.organization_members (
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  role             public.member_role not null default 'member',
  status           public.member_status not null default 'active',
  joined_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);

create table public.organization_invitations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  email            text not null check (email = lower(email) and position('@' in email) > 1),
  role             public.member_role not null default 'member' check (role <> 'owner'),
  token_hash       text not null unique,
  invited_by       uuid references public.profiles (id) on delete set null,
  expires_at       timestamptz not null default now() + interval '14 days',
  accepted_at      timestamptz,
  created_at       timestamptz not null default now()
);
create unique index organization_invitations_open_idx
  on public.organization_invitations (organization_id, email) where accepted_at is null;

create table public.club_faqs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.clubs (organization_id) on delete cascade,
  question         text not null check (char_length(question) between 1 and 300),
  answer           text not null check (char_length(answer) between 1 and 3000),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index club_faqs_org_position_idx on public.club_faqs (organization_id, position);

-------------------------------------------------------------------------------
-- 3. Waivers (versioned text, e-signed in the app; no uploaded PDFs)
-------------------------------------------------------------------------------

create table public.waivers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.clubs (organization_id) on delete cascade,
  version          integer not null check (version > 0),
  title            text not null check (char_length(title) between 1 and 200),
  body             text not null check (char_length(body) between 1 and 50000),
  is_active        boolean not null default true,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (organization_id, version),
  unique (id, organization_id)
);
create unique index waivers_one_active_idx on public.waivers (organization_id) where is_active;

create table public.waiver_signatures (
  id               uuid primary key default gen_random_uuid(),
  waiver_id        uuid not null,
  organization_id  uuid not null,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  signed_name      text not null check (char_length(signed_name) between 2 and 120),
  signed_at        timestamptz not null default now(),
  user_agent       text check (char_length(user_agent) <= 500),
  foreign key (waiver_id, organization_id) references public.waivers (id, organization_id) on delete restrict,
  unique (waiver_id, user_id)
);
create index waiver_signatures_org_user_idx on public.waiver_signatures (organization_id, user_id);

-------------------------------------------------------------------------------
-- 4. Events, RSVPs, check-ins
-------------------------------------------------------------------------------

create table public.event_series (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.clubs (organization_id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 200),
  recurrence_rule  text not null check (recurrence_rule like 'FREQ=%'),  -- RFC 5545 RRULE body
  starts_on        date not null,
  ends_on          date,
  defaults         jsonb not null default '{}'::jsonb,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on),
  unique (id, organization_id)
);

create table public.events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.clubs (organization_id) on delete cascade,
  series_id         uuid,
  title             text not null check (char_length(title) between 1 and 200),
  description       text check (char_length(description) <= 10000),
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  location_name     text check (char_length(location_name) <= 200),
  location_address  text check (char_length(location_address) <= 300),
  latitude          double precision check (latitude between -90 and 90),
  longitude         double precision check (longitude between -180 and 180),
  capacity          integer check (capacity > 0),
  rsvp_opens_at     timestamptz,
  rsvp_closes_at    timestamptz,
  visibility        public.event_visibility not null default 'public',
  status            public.event_status not null default 'scheduled',
  cover_path        text,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (rsvp_opens_at is null or rsvp_closes_at is null or rsvp_closes_at > rsvp_opens_at),
  foreign key (series_id, organization_id)
    references public.event_series (id, organization_id) on delete set null (series_id),
  unique (id, organization_id)
);
create index events_org_starts_at_idx on public.events (organization_id, starts_at);
create index events_series_id_idx on public.events (series_id) where series_id is not null;

-- Rotating code behind the event QR. Separate table so it is never readable by members.
create table public.event_checkin_codes (
  event_id         uuid primary key,
  organization_id  uuid not null,
  code             text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  rotated_at       timestamptz not null default now(),
  foreign key (event_id, organization_id) references public.events (id, organization_id) on delete cascade
);

create table public.event_rsvps (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null,
  organization_id  uuid not null,
  user_id          uuid references public.profiles (id) on delete cascade,
  guest_name       text check (char_length(guest_name) between 1 and 120),
  guest_email      text check (guest_email = lower(guest_email) and position('@' in guest_email) > 1),
  status           public.rsvp_status not null default 'going',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (event_id, organization_id) references public.events (id, organization_id) on delete cascade,
  check (
    (user_id is not null and guest_name is null and guest_email is null)
    or (user_id is null and guest_name is not null and guest_email is not null)
  ),
  unique (id, event_id)
);
create unique index event_rsvps_event_user_idx on public.event_rsvps (event_id, user_id) where user_id is not null;
create unique index event_rsvps_event_guest_idx on public.event_rsvps (event_id, guest_email) where guest_email is not null;
create index event_rsvps_event_status_idx on public.event_rsvps (event_id, status, created_at);
create index event_rsvps_user_id_idx on public.event_rsvps (user_id) where user_id is not null;
create index event_rsvps_org_idx on public.event_rsvps (organization_id);

create table public.check_ins (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null,
  organization_id  uuid not null,
  rsvp_id          uuid,
  user_id          uuid references public.profiles (id) on delete set null,
  guest_name       text check (char_length(guest_name) between 1 and 120),
  method           public.checkin_method not null,
  checked_in_at    timestamptz not null default now(),
  checked_in_by    uuid references public.profiles (id) on delete set null,
  foreign key (event_id, organization_id) references public.events (id, organization_id) on delete cascade,
  foreign key (rsvp_id, event_id) references public.event_rsvps (id, event_id) on delete set null (rsvp_id)
);
create unique index check_ins_event_user_idx on public.check_ins (event_id, user_id) where user_id is not null;
create unique index check_ins_rsvp_idx on public.check_ins (rsvp_id) where rsvp_id is not null;
create index check_ins_org_time_idx on public.check_ins (organization_id, checked_in_at);
create index check_ins_user_id_idx on public.check_ins (user_id) where user_id is not null;

-------------------------------------------------------------------------------
-- 5. Sponsorship
-------------------------------------------------------------------------------

create table public.sponsorship_packages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.clubs (organization_id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 120),
  description      text check (char_length(description) <= 3000),
  deliverables     text[] not null default '{}',
  price_cents      integer not null check (price_cents >= 0),
  currency         text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  billing_period   public.billing_period not null default 'one_time',
  is_active        boolean not null default true,
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index sponsorship_packages_org_idx on public.sponsorship_packages (organization_id, position);

create table public.sponsorship_deals (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null references public.clubs (organization_id) on delete restrict,
  sponsor_id          uuid not null references public.sponsors (organization_id) on delete restrict,
  package_id          uuid references public.sponsorship_packages (id) on delete set null,
  proposed_by_org     uuid not null,
  proposed_by         uuid references public.profiles (id) on delete set null,
  title               text not null check (char_length(title) between 1 and 200),
  terms               text check (char_length(terms) <= 10000),
  amount_cents        integer not null check (amount_cents >= 0),
  platform_fee_cents  integer not null default 0,
  currency            text not null default 'usd' check (currency ~ '^[a-z]{3}$'),
  status              public.deal_status not null default 'proposed',
  starts_on           date,
  ends_on             date,
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (proposed_by_org in (club_id, sponsor_id)),
  check (platform_fee_cents between 0 and amount_cents),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create index sponsorship_deals_club_idx on public.sponsorship_deals (club_id, status);
create index sponsorship_deals_sponsor_idx on public.sponsorship_deals (sponsor_id, status);
create index sponsorship_deals_package_idx on public.sponsorship_deals (package_id) where package_id is not null;

create table public.deal_deliverables (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references public.sponsorship_deals (id) on delete cascade,
  description   text not null check (char_length(description) between 1 and 500),
  event_id      uuid references public.events (id) on delete set null,
  due_at        timestamptz,
  completed_at  timestamptz,
  proof_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index deal_deliverables_deal_idx on public.deal_deliverables (deal_id);
create index deal_deliverables_event_idx on public.deal_deliverables (event_id) where event_id is not null;

-------------------------------------------------------------------------------
-- 6. Communication
-------------------------------------------------------------------------------

create table public.broadcasts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  author_id        uuid references public.profiles (id) on delete set null,
  subject          text not null check (char_length(subject) between 1 and 200),
  body             text not null check (char_length(body) between 1 and 20000),
  audience         jsonb not null default '{"type": "all_members"}'::jsonb,
  status           public.broadcast_status not null default 'draft',
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index broadcasts_org_idx on public.broadcasts (organization_id, created_at desc);

-------------------------------------------------------------------------------
-- 7. Authorization helpers (private schema: not exposed through the Data API)
-------------------------------------------------------------------------------

create function private.has_org_role(p_org uuid, p_roles public.member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$$;

create function private.is_member(p_org uuid) returns boolean
language sql stable set search_path = ''
as $$ select private.has_org_role(p_org, '{owner,admin,staff,member}'); $$;

create function private.is_staff(p_org uuid) returns boolean
language sql stable set search_path = ''
as $$ select private.has_org_role(p_org, '{owner,admin,staff}'); $$;

create function private.is_admin(p_org uuid) returns boolean
language sql stable set search_path = ''
as $$ select private.has_org_role(p_org, '{owner,admin}'); $$;

create function private.is_owner(p_org uuid) returns boolean
language sql stable set search_path = ''
as $$ select private.has_org_role(p_org, '{owner}'); $$;

-- Public, live org OR the caller belongs to it.
create function private.can_view_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
    where o.id = p_org
      and o.archived_at is null
      and (o.is_public or private.is_member(o.id))
  );
$$;

create function private.can_view_event(p_org uuid, p_visibility public.event_visibility)
returns boolean
language sql stable set search_path = ''
as $$
  select private.is_member(p_org)
      or (p_visibility = 'public' and private.can_view_org(p_org));
$$;

create function private.club_open_to_sponsors(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clubs c
    join public.organizations o on o.id = c.organization_id
    where c.organization_id = p_org and c.open_to_sponsors and o.is_public and o.archived_at is null
  );
$$;

create function private.is_deal_party(p_deal uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sponsorship_deals d
    where d.id = p_deal and (private.is_admin(d.club_id) or private.is_admin(d.sponsor_id))
  );
$$;

-- Staff may see the profiles of people in orgs they run.
create function private.can_view_profile(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user = (select auth.uid())
      or exists (
        select 1
        from public.organization_members target
        join public.organization_members me
          on me.organization_id = target.organization_id
        where target.user_id = p_user
          and me.user_id = (select auth.uid())
          and me.status = 'active'
          and me.role in ('owner', 'admin', 'staff')
      );
$$;

create function private.try_uuid(p_text text)
returns uuid
language plpgsql immutable set search_path = ''
as $$
begin
  return p_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-------------------------------------------------------------------------------
-- 8. Triggers
-------------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'clubs', 'sponsors', 'organization_members', 'club_faqs',
    'event_series', 'events', 'event_rsvps', 'sponsorship_packages', 'sponsorship_deals',
    'deal_deliverables', 'broadcasts'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function private.set_updated_at()', t);
  end loop;
end;
$$;

-- New auth user -> profile. full_name from sign-up metadata is display-only, never used for authz.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- New event -> check-in code.
create function private.create_event_checkin_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.event_checkin_codes (event_id, organization_id)
  values (new.id, new.organization_id);
  return new;
end;
$$;

create trigger on_event_created
  after insert on public.events
  for each row execute function private.create_event_checkin_code();

-- Signatures are stamped by the server clock.
create function private.stamp_waiver_signature()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.signed_at := now();
  return new;
end;
$$;

create trigger stamp_signed_at
  before insert on public.waiver_signatures
  for each row execute function private.stamp_waiver_signature();

-- Deal state machine. Terms are frozen once a deal leaves `proposed`.
create function private.enforce_deal_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_other_org uuid := case when old.proposed_by_org = old.club_id then old.sponsor_id else old.club_id end;
begin
  if new.club_id <> old.club_id or new.sponsor_id <> old.sponsor_id
     or new.proposed_by_org <> old.proposed_by_org then
    raise exception 'deal parties cannot change' using errcode = '42501';
  end if;

  if old.status <> 'proposed' and (
       new.amount_cents <> old.amount_cents or new.currency <> old.currency
       or new.terms is distinct from old.terms or new.package_id is distinct from old.package_id) then
    raise exception 'deal terms are locked after the proposal is answered' using errcode = '42501';
  end if;

  if new.status = old.status then
    return new;
  end if;

  -- service_role / postgres (webhooks, payouts) may move any state.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if not (
       (old.status = 'proposed' and new.status in ('accepted', 'declined') and private.is_admin(v_other_org))
    or (old.status = 'proposed' and new.status = 'cancelled' and private.is_admin(old.proposed_by_org))
    or (old.status = 'accepted' and new.status = 'cancelled')
    or (old.status = 'active' and new.status = 'completed' and private.is_admin(old.club_id))
  ) then
    raise exception 'deal cannot move from % to %', old.status, new.status using errcode = '42501';
  end if;

  if new.status in ('accepted', 'declined') then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

create trigger enforce_deal_rules
  before update on public.sponsorship_deals
  for each row execute function private.enforce_deal_rules();

-------------------------------------------------------------------------------
-- 9. Row level security
-------------------------------------------------------------------------------

alter table public.profiles                 enable row level security;
alter table public.organizations            enable row level security;
alter table public.clubs                    enable row level security;
alter table public.sponsors                 enable row level security;
alter table public.organization_domains     enable row level security;
alter table public.organization_members     enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.club_faqs                enable row level security;
alter table public.waivers                  enable row level security;
alter table public.waiver_signatures        enable row level security;
alter table public.event_series             enable row level security;
alter table public.events                   enable row level security;
alter table public.event_checkin_codes      enable row level security;
alter table public.event_rsvps              enable row level security;
alter table public.check_ins                enable row level security;
alter table public.sponsorship_packages     enable row level security;
alter table public.sponsorship_deals        enable row level security;
alter table public.deal_deliverables        enable row level security;
alter table public.broadcasts               enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using ((select private.can_view_profile(id)));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- organizations (created only through create_organization())
create policy organizations_select_public on public.organizations for select to anon, authenticated
  using (is_public and archived_at is null);
create policy organizations_select_member on public.organizations for select to authenticated
  using ((select private.is_member(id)));
create policy organizations_update_admin on public.organizations for update to authenticated
  using ((select private.is_admin(id))) with check ((select private.is_admin(id)));

-- clubs / sponsors subtype rows
create policy clubs_select on public.clubs for select to anon, authenticated
  using ((select private.can_view_org(organization_id)));
create policy clubs_update_admin on public.clubs for update to authenticated
  using ((select private.is_admin(organization_id))) with check ((select private.is_admin(organization_id)));
create policy sponsors_select on public.sponsors for select to anon, authenticated
  using ((select private.can_view_org(organization_id)));
create policy sponsors_update_admin on public.sponsors for update to authenticated
  using ((select private.is_admin(organization_id))) with check ((select private.is_admin(organization_id)));

-- custom domains: verified ones are public (host routing); writes happen server-side with the secret key
create policy organization_domains_select_verified on public.organization_domains for select to anon, authenticated
  using (verified_at is not null);
create policy organization_domains_select_admin on public.organization_domains for select to authenticated
  using ((select private.is_admin(organization_id)));

-- memberships (joining goes through join_club() / accept_invitation())
create policy organization_members_select on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff(organization_id)));
create policy organization_members_update_admin on public.organization_members for update to authenticated
  using ((select private.is_admin(organization_id)) and (role <> 'owner' or (select private.is_owner(organization_id))))
  with check ((select private.is_admin(organization_id)) and (role <> 'owner' or (select private.is_owner(organization_id))));
create policy organization_members_delete on public.organization_members for delete to authenticated
  using (
    role <> 'owner'
    and (user_id = (select auth.uid()) or (select private.is_admin(organization_id)))
  );

-- invitations
create policy organization_invitations_admin on public.organization_invitations for all to authenticated
  using ((select private.is_admin(organization_id)))
  with check ((select private.is_admin(organization_id)) and invited_by = (select auth.uid()));

-- FAQs
create policy club_faqs_select on public.club_faqs for select to anon, authenticated
  using ((select private.can_view_org(organization_id)));
create policy club_faqs_insert on public.club_faqs for insert to authenticated
  with check ((select private.is_admin(organization_id)));
create policy club_faqs_update on public.club_faqs for update to authenticated
  using ((select private.is_admin(organization_id))) with check ((select private.is_admin(organization_id)));
create policy club_faqs_delete on public.club_faqs for delete to authenticated
  using ((select private.is_admin(organization_id)));

-- waivers: readable wherever the club is, so people can read before signing
create policy waivers_select on public.waivers for select to anon, authenticated
  using ((select private.can_view_org(organization_id)));
create policy waivers_insert on public.waivers for insert to authenticated
  with check ((select private.is_admin(organization_id)) and created_by = (select auth.uid()));
create policy waivers_update on public.waivers for update to authenticated
  using ((select private.is_admin(organization_id))) with check ((select private.is_admin(organization_id)));

create policy waiver_signatures_select on public.waiver_signatures for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff(organization_id)));
-- Signing happens during the join flow, before membership exists, so only visibility is required.
create policy waiver_signatures_insert_own on public.waiver_signatures for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.can_view_org(organization_id))
    and exists (select 1 from public.waivers w where w.id = waiver_id and w.is_active)
  );

-- event series
create policy event_series_select on public.event_series for select to authenticated
  using ((select private.is_member(organization_id)));
create policy event_series_insert on public.event_series for insert to authenticated
  with check ((select private.is_staff(organization_id)));
create policy event_series_update on public.event_series for update to authenticated
  using ((select private.is_staff(organization_id))) with check ((select private.is_staff(organization_id)));
create policy event_series_delete on public.event_series for delete to authenticated
  using ((select private.is_staff(organization_id)));

-- events
create policy events_select on public.events for select to anon, authenticated
  using ((select private.can_view_event(organization_id, visibility)));
create policy events_insert on public.events for insert to authenticated
  with check ((select private.is_staff(organization_id)));
create policy events_update on public.events for update to authenticated
  using ((select private.is_staff(organization_id))) with check ((select private.is_staff(organization_id)));
create policy events_delete on public.events for delete to authenticated
  using ((select private.is_staff(organization_id)));

-- check-in codes: staff only (shown on the door screen)
create policy event_checkin_codes_select on public.event_checkin_codes for select to authenticated
  using ((select private.is_staff(organization_id)));
create policy event_checkin_codes_update on public.event_checkin_codes for update to authenticated
  using ((select private.is_staff(organization_id))) with check ((select private.is_staff(organization_id)));

-- RSVPs (created through rsvp_to_event() / guest_rsvp(); staff can adjust)
create policy event_rsvps_select on public.event_rsvps for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff(organization_id)));
create policy event_rsvps_update_staff on public.event_rsvps for update to authenticated
  using ((select private.is_staff(organization_id))) with check ((select private.is_staff(organization_id)));
create policy event_rsvps_delete_staff on public.event_rsvps for delete to authenticated
  using ((select private.is_staff(organization_id)));

-- check-ins: staff at the door, or self_check_in()
create policy check_ins_select on public.check_ins for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff(organization_id)));
create policy check_ins_insert_staff on public.check_ins for insert to authenticated
  with check ((select private.is_staff(organization_id)) and checked_in_by = (select auth.uid()));
create policy check_ins_delete_staff on public.check_ins for delete to authenticated
  using ((select private.is_staff(organization_id)));

-- sponsorship packages: public on clubs open to sponsors
create policy sponsorship_packages_select_public on public.sponsorship_packages for select to anon, authenticated
  using (is_active and (select private.club_open_to_sponsors(organization_id)));
create policy sponsorship_packages_select_admin on public.sponsorship_packages for select to authenticated
  using ((select private.is_admin(organization_id)));
create policy sponsorship_packages_insert on public.sponsorship_packages for insert to authenticated
  with check ((select private.is_admin(organization_id)));
create policy sponsorship_packages_update on public.sponsorship_packages for update to authenticated
  using ((select private.is_admin(organization_id))) with check ((select private.is_admin(organization_id)));
create policy sponsorship_packages_delete on public.sponsorship_packages for delete to authenticated
  using ((select private.is_admin(organization_id)));

-- deals
create policy sponsorship_deals_select on public.sponsorship_deals for select to authenticated
  using ((select private.is_admin(club_id)) or (select private.is_admin(sponsor_id)));
create policy sponsorship_deals_insert on public.sponsorship_deals for insert to authenticated
  with check (
    status = 'proposed'
    and proposed_by = (select auth.uid())
    and (
      (proposed_by_org = sponsor_id and (select private.is_admin(sponsor_id)) and (select private.club_open_to_sponsors(club_id)))
      or (proposed_by_org = club_id and (select private.is_admin(club_id)))
    )
  );
create policy sponsorship_deals_update on public.sponsorship_deals for update to authenticated
  using ((select private.is_admin(club_id)) or (select private.is_admin(sponsor_id)))
  with check ((select private.is_admin(club_id)) or (select private.is_admin(sponsor_id)));

create policy deal_deliverables_all on public.deal_deliverables for all to authenticated
  using ((select private.is_deal_party(deal_id)))
  with check ((select private.is_deal_party(deal_id)));

-- broadcasts
create policy broadcasts_select on public.broadcasts for select to authenticated
  using ((select private.is_staff(organization_id)));
create policy broadcasts_insert on public.broadcasts for insert to authenticated
  with check ((select private.is_staff(organization_id)) and author_id = (select auth.uid()));
create policy broadcasts_update on public.broadcasts for update to authenticated
  using ((select private.is_staff(organization_id))) with check ((select private.is_staff(organization_id)));
create policy broadcasts_delete on public.broadcasts for delete to authenticated
  using ((select private.is_staff(organization_id)) and status = 'draft');

-------------------------------------------------------------------------------
-- 10. RPCs (public API with business rules)
-------------------------------------------------------------------------------

-- Atomic tenant creation: org + subtype row + owner membership.
create function public.create_organization(p_kind public.org_kind, p_slug text, p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_org public.organizations;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  insert into public.organizations (kind, slug, name, created_by)
  values (p_kind, lower(trim(p_slug)), trim(p_name), v_uid)
  returning * into v_org;

  if p_kind = 'club' then
    insert into public.clubs (organization_id) values (v_org.id);
  else
    insert into public.sponsors (organization_id) values (v_org.id);
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org.id, v_uid, 'owner', 'active');

  return v_org;
end;
$$;

-- Join a club according to its join policy. Returns the resulting membership status.
create function public.join_club(p_club uuid)
returns public.member_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_policy public.join_policy;
  v_status public.member_status;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select c.join_policy into v_policy
  from public.clubs c
  join public.organizations o on o.id = c.organization_id
  where c.organization_id = p_club and o.archived_at is null and o.is_public;

  if not found then
    raise exception 'club not found' using errcode = 'P0002';
  end if;

  select m.status into v_status
  from public.organization_members m
  where m.organization_id = p_club and m.user_id = v_uid;

  if found then
    if v_status = 'removed' then
      raise exception 'membership was removed by the club' using errcode = '42501';
    end if;
    return v_status;
  end if;

  if v_policy = 'invite_only' then
    raise exception 'this club is invite only' using errcode = '42501';
  end if;

  v_status := case when v_policy = 'open' then 'active' else 'pending' end;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (p_club, v_uid, 'member', v_status);

  return v_status;
end;
$$;

create function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_inv public.organization_invitations;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;

  select * into v_inv
  from public.organization_invitations i
  where i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and i.accepted_at is null
    and i.expires_at > now()
  for update;

  if not found or v_inv.email <> v_email then
    raise exception 'invitation is invalid or expired' using errcode = '42501';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_inv.organization_id, v_uid, v_inv.role, 'active')
  on conflict (organization_id, user_id)
  do update set role = excluded.role, status = 'active'
  where public.organization_members.role = 'member';

  update public.organization_invitations set accepted_at = now() where id = v_inv.id;
  return v_inv.organization_id;
end;
$$;

-- Shared RSVP window / capacity logic. Locks the event row so capacity is never oversold.
create function private.next_rsvp_status(p_event public.events)
returns public.rsvp_status
language plpgsql
set search_path = ''
as $$
declare
  v_going integer;
begin
  if p_event.status <> 'scheduled' then
    raise exception 'event is cancelled' using errcode = '22023';
  end if;
  if p_event.starts_at <= now() then
    raise exception 'event has already started' using errcode = '22023';
  end if;
  if p_event.rsvp_opens_at is not null and now() < p_event.rsvp_opens_at then
    raise exception 'RSVPs are not open yet' using errcode = '22023';
  end if;
  if p_event.rsvp_closes_at is not null and now() >= p_event.rsvp_closes_at then
    raise exception 'RSVPs are closed' using errcode = '22023';
  end if;

  if p_event.capacity is null then
    return 'going';
  end if;

  select count(*) into v_going
  from public.event_rsvps r
  where r.event_id = p_event.id and r.status = 'going';

  return case when v_going < p_event.capacity then 'going' else 'waitlisted' end;
end;
$$;

create function public.rsvp_to_event(p_event uuid)
returns public.rsvp_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
  v_club public.clubs;
  v_existing public.rsvp_status;
  v_status public.rsvp_status;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_event from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  select * into v_club from public.clubs c where c.organization_id = v_event.organization_id;

  -- Public events at open clubs auto-join the member; everything else needs an active membership.
  if not private.is_member(v_event.organization_id) then
    if v_event.visibility = 'public' and v_club.join_policy = 'open' and private.can_view_org(v_event.organization_id) then
      perform public.join_club(v_event.organization_id);
    else
      raise exception 'join the club to RSVP' using errcode = '42501';
    end if;
  end if;

  if v_club.require_waiver and not exists (
    select 1
    from public.waiver_signatures s
    join public.waivers w on w.id = s.waiver_id
    where s.user_id = v_uid and w.organization_id = v_event.organization_id and w.is_active
  ) then
    raise exception 'sign the club waiver first' using errcode = '42501', hint = 'waiver_required';
  end if;

  select r.status into v_existing
  from public.event_rsvps r
  where r.event_id = p_event and r.user_id = v_uid;

  if v_existing in ('going', 'waitlisted') then
    return v_existing;
  end if;

  v_status := private.next_rsvp_status(v_event);

  insert into public.event_rsvps (event_id, organization_id, user_id, status)
  values (p_event, v_event.organization_id, v_uid, v_status)
  on conflict (event_id, user_id) where user_id is not null
  do update set status = excluded.status, created_at = now();

  return v_status;
end;
$$;

create function public.guest_rsvp(p_event uuid, p_name text, p_email text)
returns public.rsvp_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.events;
  v_email text := lower(trim(p_email));
  v_existing public.rsvp_status;
  v_status public.rsvp_status;
begin
  select * into v_event from public.events e where e.id = p_event for update;
  if not found
     or v_event.visibility <> 'public'
     or not private.can_view_org(v_event.organization_id)
     or not exists (
       select 1 from public.clubs c
       where c.organization_id = v_event.organization_id and c.allow_guest_rsvp and not c.require_waiver
     ) then
    raise exception 'guest RSVPs are not available for this event' using errcode = '42501';
  end if;

  select r.status into v_existing
  from public.event_rsvps r
  where r.event_id = p_event and r.guest_email = v_email;

  if v_existing in ('going', 'waitlisted') then
    return v_existing;
  end if;

  v_status := private.next_rsvp_status(v_event);

  insert into public.event_rsvps (event_id, organization_id, guest_name, guest_email, status)
  values (p_event, v_event.organization_id, trim(p_name), v_email, v_status)
  on conflict (event_id, guest_email) where guest_email is not null
  do update set status = excluded.status, guest_name = excluded.guest_name, created_at = now();

  return v_status;
end;
$$;

-- Cancel my RSVP and promote the oldest waitlisted person if a spot opened.
create function public.cancel_rsvp(p_event uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_event from public.events e where e.id = p_event for update;
  if not found then
    raise exception 'event not found' using errcode = 'P0002';
  end if;

  update public.event_rsvps r
  set status = 'cancelled'
  where r.event_id = p_event and r.user_id = v_uid and r.status <> 'cancelled';

  if v_event.status = 'scheduled' and v_event.starts_at > now() then
    perform private.promote_waitlist(v_event);
  end if;
end;
$$;

create function private.promote_waitlist(p_event public.events)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_going integer;
begin
  if p_event.capacity is null then
    update public.event_rsvps set status = 'going'
    where event_id = p_event.id and status = 'waitlisted';
    return;
  end if;

  select count(*) into v_going from public.event_rsvps
  where event_id = p_event.id and status = 'going';

  update public.event_rsvps r set status = 'going'
  where r.id in (
    select w.id from public.event_rsvps w
    where w.event_id = p_event.id and w.status = 'waitlisted'
    order by w.created_at
    limit greatest(p_event.capacity - v_going, 0)
  );
end;
$$;

-- Member scans the QR at the door.
create function public.self_check_in(p_event uuid, p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_event public.events;
  v_rsvp uuid;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select e.* into v_event
  from public.events e
  join public.event_checkin_codes c on c.event_id = e.id
  where e.id = p_event and c.code = p_code and e.status = 'scheduled';

  if not found then
    raise exception 'invalid check-in code' using errcode = '42501';
  end if;

  if now() < v_event.starts_at - interval '1 hour'
     or now() > coalesce(v_event.ends_at, v_event.starts_at + interval '4 hours') + interval '1 hour' then
    raise exception 'check-in is not open for this event' using errcode = '22023';
  end if;

  if not private.is_member(v_event.organization_id) then
    raise exception 'join the club to check in' using errcode = '42501';
  end if;

  select r.id into v_rsvp from public.event_rsvps r
  where r.event_id = p_event and r.user_id = v_uid and r.status = 'going';

  insert into public.check_ins (event_id, organization_id, rsvp_id, user_id, method, checked_in_by)
  values (p_event, v_event.organization_id, v_rsvp, v_uid, (case when v_rsvp is null then 'walk_in' else 'qr' end)::public.checkin_method, v_uid)
  on conflict (event_id, user_id) where user_id is not null do nothing
  returning id into v_id;

  if v_id is null then
    select c.id into v_id from public.check_ins c where c.event_id = p_event and c.user_id = v_uid;
  end if;
  return v_id;
end;
$$;

-- Spots left for events the caller can see (counts only, no names).
create function public.get_event_availability(p_events uuid[])
returns table (event_id uuid, capacity integer, going integer, waitlisted integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
         e.capacity,
         count(r.id) filter (where r.status = 'going')::integer,
         count(r.id) filter (where r.status = 'waitlisted')::integer
  from public.events e
  left join public.event_rsvps r on r.event_id = e.id
  where e.id = any (p_events)
    and private.can_view_event(e.organization_id, e.visibility)
  group by e.id, e.capacity;
$$;

-- Verified reach for the sponsor kit and the club's own insights. Aggregates only.
create function public.get_club_stats(p_club uuid, p_days integer default 90)
returns table (
  active_members      integer,
  events_held         integer,
  total_check_ins     integer,
  unique_attendees    integer,
  avg_attendance      numeric,
  window_days         integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_since timestamptz := now() - make_interval(days => least(greatest(p_days, 7), 365));
begin
  if not (private.is_member(p_club) or private.club_open_to_sponsors(p_club)) then
    raise exception 'stats are not available for this club' using errcode = '42501';
  end if;

  return query
  with held as (
    select e.id from public.events e
    where e.organization_id = p_club and e.status = 'scheduled'
      and e.starts_at >= v_since and e.starts_at < now()
  ),
  ci as (
    select c.event_id, c.user_id from public.check_ins c
    where c.organization_id = p_club and c.event_id in (select id from held)
  )
  select
    (select count(*) from public.organization_members m
       where m.organization_id = p_club and m.status = 'active')::integer,
    (select count(*) from held)::integer,
    (select count(*) from ci)::integer,
    (select count(distinct user_id) from ci)::integer,
    round(coalesce((select count(*) from ci)::numeric / nullif((select count(*) from held), 0), 0), 1),
    least(greatest(p_days, 7), 365);
end;
$$;

-------------------------------------------------------------------------------
-- 11. Privileges
-------------------------------------------------------------------------------

-- Tables: start from nothing, grant only what each role needs. RLS then filters rows.
revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.organizations, public.clubs, public.sponsors, public.organization_domains,
  public.club_faqs, public.waivers, public.events, public.sponsorship_packages
to anon;

grant select on all tables in schema public to authenticated;

grant update (full_name, avatar_path, school, graduation_year, phone) on public.profiles to authenticated;

grant update (
  name, tagline, description, logo_path, cover_path, brand_color, school, city, region,
  country_code, timezone, website_url, instagram_handle, contact_email, is_public, archived_at
) on public.organizations to authenticated;

grant update (
  category, join_policy, allow_guest_rsvp, require_waiver, open_to_sponsors, show_member_count, founded_year
) on public.clubs to authenticated;
grant update (industry, service_area) on public.sponsors to authenticated;

grant update (role, status) on public.organization_members to authenticated;
grant delete on public.organization_members to authenticated;

grant insert, update, delete on public.organization_invitations to authenticated;
grant insert, update, delete on public.club_faqs to authenticated;

grant insert on public.waivers to authenticated;
grant update (is_active) on public.waivers to authenticated;
grant insert (waiver_id, organization_id, user_id, signed_name, user_agent) on public.waiver_signatures to authenticated;

grant insert, delete on public.event_series to authenticated;
grant update (title, recurrence_rule, starts_on, ends_on, defaults) on public.event_series to authenticated;

grant insert, delete on public.events to authenticated;
grant update (
  series_id, title, description, starts_at, ends_at, location_name, location_address, latitude,
  longitude, capacity, rsvp_opens_at, rsvp_closes_at, visibility, status, cover_path
) on public.events to authenticated;

grant update (code, rotated_at) on public.event_checkin_codes to authenticated;

grant update (status) on public.event_rsvps to authenticated;
grant delete on public.event_rsvps to authenticated;

grant insert (event_id, organization_id, rsvp_id, user_id, guest_name, method, checked_in_by)
  on public.check_ins to authenticated;
grant delete on public.check_ins to authenticated;

grant insert, update, delete on public.sponsorship_packages to authenticated;

grant insert (club_id, sponsor_id, package_id, proposed_by_org, proposed_by, title, terms, amount_cents, currency, starts_on, ends_on)
  on public.sponsorship_deals to authenticated;
grant update (title, terms, amount_cents, currency, package_id, status, starts_on, ends_on)
  on public.sponsorship_deals to authenticated;

grant insert, update, delete on public.deal_deliverables to authenticated;
grant insert, update, delete on public.broadcasts to authenticated;

-- Private helpers: callable inside policies, but the schema is not exposed over HTTP.
grant usage on schema private to anon, authenticated;
revoke all on all functions in schema private from public;
grant execute on function
  private.has_org_role(uuid, public.member_role[]),
  private.is_member(uuid), private.is_staff(uuid), private.is_admin(uuid), private.is_owner(uuid),
  private.can_view_org(uuid), private.can_view_event(uuid, public.event_visibility),
  private.club_open_to_sponsors(uuid), private.is_deal_party(uuid), private.can_view_profile(uuid),
  private.try_uuid(text)
to anon, authenticated;

-- Public RPCs: explicit allow-list.
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function public.create_organization(public.org_kind, text, text) to authenticated;
grant execute on function public.join_club(uuid) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.rsvp_to_event(uuid) to authenticated;
grant execute on function public.cancel_rsvp(uuid) to authenticated;
grant execute on function public.self_check_in(uuid, text) to authenticated;
grant execute on function public.guest_rsvp(uuid, text, text) to anon, authenticated;
grant execute on function public.get_event_availability(uuid[]) to anon, authenticated;
grant execute on function public.get_club_stats(uuid, integer) to anon, authenticated;

-------------------------------------------------------------------------------
-- 12. Storage
--   org-media/<organization_id>/...  logos, covers, event images (public read)
--   avatars/<user_id>/...            profile photos (public read)
-------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('org-media', 'org-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('avatars',   'avatars',   true,  5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy org_media_select on storage.objects for select to authenticated
  using (bucket_id = 'org-media' and (select private.is_staff(private.try_uuid((storage.foldername(name))[1]))));
create policy org_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'org-media' and (select private.is_staff(private.try_uuid((storage.foldername(name))[1]))));
create policy org_media_update on storage.objects for update to authenticated
  using (bucket_id = 'org-media' and (select private.is_staff(private.try_uuid((storage.foldername(name))[1]))))
  with check (bucket_id = 'org-media' and (select private.is_staff(private.try_uuid((storage.foldername(name))[1]))));
create policy org_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'org-media' and (select private.is_staff(private.try_uuid((storage.foldername(name))[1]))));

create policy avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
