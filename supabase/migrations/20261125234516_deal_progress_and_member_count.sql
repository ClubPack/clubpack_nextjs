-- Hand-matched deals (before Stripe Connect): the club admin confirms payment and completion.
--   accepted -> active     club admin ("payment received")
--   accepted -> completed  club admin (one-off deals delivered on the spot)
--   active   -> cancelled  either party's admin
create or replace function private.enforce_deal_rules()
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

  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if not (
       (old.status = 'proposed' and new.status in ('accepted', 'declined') and private.is_admin(v_other_org))
    or (old.status = 'proposed' and new.status = 'cancelled' and private.is_admin(old.proposed_by_org))
    or (old.status = 'accepted' and new.status = 'cancelled')
    or (old.status = 'accepted' and new.status in ('active', 'completed') and private.is_admin(old.club_id))
    or (old.status = 'active' and new.status = 'completed' and private.is_admin(old.club_id))
    or (old.status = 'active' and new.status = 'cancelled')
  ) then
    raise exception 'deal cannot move from % to %', old.status, new.status using errcode = '42501';
  end if;

  if new.status in ('accepted', 'declined') then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

-- Public member count for club sites that choose to show it (clubs.show_member_count).
create function public.get_club_member_count(p_club uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.clubs c
      where c.organization_id = p_club
        and (c.show_member_count or private.is_member(p_club))
        and private.can_view_org(p_club)
    )
    then (select count(*)::integer from public.organization_members m where m.organization_id = p_club and m.status = 'active')
    else null
  end;
$$;

revoke all on function public.get_club_member_count(uuid) from public, anon, authenticated;
grant execute on function public.get_club_member_count(uuid) to anon, authenticated;
