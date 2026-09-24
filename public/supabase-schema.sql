-- ICT Asset & PMS Inventory - secure Supabase schema
-- Run this complete script in Supabase Dashboard -> SQL Editor.

create table if not exists public.equipment (
  id uuid default gen_random_uuid() primary key,
  property_number text not null unique,
  serial_number text,
  equipment_type text not null,
  model text not null,
  brand text not null,
  location text not null,
  accountable_personnel text not null,
  accountable_sex text,
  accountable_status text,
  year_acquired text,
  shelf_life text default 'WITHIN 5 YEARS',
  processor text,
  ram text,
  gpu text,
  range_category text,
  os_installed text,
  office_productivity_product text,
  endpoint_protection text,
  computer_name text,
  date_pms_conducted text,
  status text not null default 'Serviceable',
  status_category text not null default 'Serviceable',
  remarks text,
  last_verified_at timestamptz,
  last_verified_by text,
  verification_count integer not null default 0,
  verification_history jsonb not null default '[]'::jsonb,
  ownership_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Migration-safe additions for existing inventory tables.
alter table public.equipment add column if not exists last_verified_at timestamptz;
alter table public.equipment add column if not exists last_verified_by text;
alter table public.equipment add column if not exists verification_count integer not null default 0;
alter table public.equipment add column if not exists verification_history jsonb not null default '[]'::jsonb;
alter table public.equipment add column if not exists ownership_history jsonb not null default '[]'::jsonb;

create index if not exists idx_equipment_prop_num on public.equipment (property_number);
create index if not exists idx_equipment_type on public.equipment (equipment_type);
create index if not exists idx_equipment_location on public.equipment (location);
create index if not exists idx_equipment_shelf_life on public.equipment (shelf_life);
create index if not exists idx_equipment_status_cat on public.equipment (status_category);
create index if not exists idx_equipment_last_verified on public.equipment (last_verified_at);

create table if not exists public.authorized_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  username text,
  full_name text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  password_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists idx_authorized_accounts_email_lower
  on public.authorized_accounts (lower(email));
create unique index if not exists idx_authorized_accounts_username_lower
  on public.authorized_accounts (lower(username)) where username is not null;

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  actor_name text not null,
  actor_email text not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  target_label text not null,
  equipment_property_number text,
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_activity_log_occurred_at on public.activity_log (occurred_at desc);
create index if not exists idx_activity_log_equipment on public.activity_log (equipment_property_number, occurred_at desc);

alter table public.authorized_accounts enable row level security;
alter table public.activity_log enable row level security;
revoke all on public.authorized_accounts from anon, authenticated;
revoke all on public.activity_log from anon, authenticated;
grant all on public.authorized_accounts to service_role;
grant all on public.activity_log to service_role;

create or replace function public.is_authorized_inventory_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.authorized_accounts as account
    where account.auth_user_id = auth.uid()
      and lower(account.email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_authorized_inventory_user() from public, anon;
grant execute on function public.is_authorized_inventory_user() to authenticated;

create or replace function public.enforce_authorized_account_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(706091202);
  if (select count(*) from public.authorized_accounts) >= 2 then
    raise exception using errcode = '23514', message = 'Authorized accounts already have the maximum of two users.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_authorized_account_limit on public.authorized_accounts;
create trigger enforce_authorized_account_limit
  before insert on public.authorized_accounts
  for each row execute function public.enforce_authorized_account_limit();

create or replace function public.audit_authorized_account_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id text := nullif(current_setting('app.actor_user_id', true), '');
  v_actor_name text := coalesce(nullif(current_setting('app.actor_name', true), ''), 'System');
  v_actor_email text := coalesce(nullif(current_setting('app.actor_email', true), ''), 'system');
  v_action text;
  v_target_id uuid;
  v_target_label text;
  v_details jsonb := '{}'::jsonb;
  v_old jsonb;
  v_new jsonb;
  v_key text;
  v_value jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'account.created';
    v_target_id := new.id;
    v_target_label := new.email;
    v_details := jsonb_build_object('name', new.full_name, 'username', new.username);
  elsif tg_op = 'UPDATE' then
    v_action := 'account.updated';
    v_target_id := new.id;
    v_target_label := new.email;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    for v_key, v_value in select key, value from jsonb_each(v_new) loop
      if v_key not in ('id', 'auth_user_id', 'created_at', 'updated_at', 'password_updated_at')
        and v_value is distinct from (v_old -> v_key) then
        v_details := v_details || jsonb_build_object(
          v_key,
          jsonb_build_object('from', v_old -> v_key, 'to', v_value)
        );
      end if;
    end loop;
    if new.password_updated_at is distinct from old.password_updated_at then
      v_details := v_details || jsonb_build_object('password_reset', true);
    end if;
  else
    v_action := 'account.deleted';
    v_target_id := old.id;
    v_target_label := old.email;
    v_details := jsonb_build_object('name', old.full_name, 'username', old.username);
  end if;

  insert into public.activity_log (
    actor_user_id, actor_name, actor_email, action, target_type,
    target_id, target_label, details
  ) values (
    case when v_actor_id ~* '^[0-9a-f-]{36}$' then v_actor_id::uuid else null end,
    v_actor_name,
    lower(v_actor_email),
    v_action,
    'account',
    v_target_id,
    v_target_label,
    v_details
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_authorized_account_change on public.authorized_accounts;
create trigger audit_authorized_account_change
  after insert or update or delete on public.authorized_accounts
  for each row execute function public.audit_authorized_account_change();

create or replace function public.manage_authorized_account(
  p_operation text,
  p_id uuid,
  p_email text,
  p_username text,
  p_full_name text,
  p_auth_user_id uuid,
  p_actor_user_id uuid,
  p_actor_email text,
  p_actor_name text,
  p_password_updated boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_email text;
begin
  perform set_config('app.actor_user_id', coalesce(p_actor_user_id::text, ''), true);
  perform set_config('app.actor_email', coalesce(p_actor_email, ''), true);
  perform set_config('app.actor_name', coalesce(p_actor_name, ''), true);

  if p_operation = 'create' then
    insert into public.authorized_accounts (
      email, username, full_name, auth_user_id, password_updated_at
    ) values (
      lower(trim(p_email)),
      nullif(lower(trim(coalesce(p_username, ''))), ''),
      trim(p_full_name),
      p_auth_user_id,
      case when p_password_updated then timezone('utc'::text, now()) else null end
    ) returning id into v_id;
    return v_id;
  elsif p_operation = 'update' then
    update public.authorized_accounts
    set email = lower(trim(p_email)),
        username = nullif(lower(trim(coalesce(p_username, ''))), ''),
        full_name = trim(p_full_name),
        password_updated_at = case
          when p_password_updated then timezone('utc'::text, now())
          else password_updated_at
        end,
        updated_at = timezone('utc'::text, now())
    where id = p_id
    returning id into v_id;
    if v_id is null then raise exception using errcode = 'P0002', message = 'Authorized account not found.'; end if;
    return v_id;
  elsif p_operation = 'delete' then
    select id, email into v_id, v_email
      from public.authorized_accounts where id = p_id for update;
    if v_id is null then raise exception using errcode = 'P0002', message = 'Authorized account not found.'; end if;
    if (select count(*) from public.authorized_accounts) <= 1 then
      raise exception using errcode = '23514', message = 'At least one authorized account must remain.';
    end if;
    delete from public.authorized_accounts where id = p_id;
    return v_id;
  end if;

  raise exception using errcode = '22023', message = 'Unsupported account operation.';
end;
$$;

revoke all on function public.manage_authorized_account(text, uuid, text, text, text, uuid, uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.manage_authorized_account(text, uuid, text, text, text, uuid, uuid, text, text, boolean) to service_role;

-- Custody is changed only by the transfer function below. Direct updates must
-- not silently rewrite the custodian or the receipt history.
create or replace function public.guard_equipment_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.accountable_personnel is distinct from old.accountable_personnel
    or new.location is distinct from old.location
    or new.ownership_history is distinct from old.ownership_history then
    if current_setting('app.ownership_transfer', true) is distinct from 'true' then
      raise exception using errcode = '23514', message = 'Use Transfer ownership to change the accountable officer or office.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_equipment_ownership on public.equipment;
create trigger guard_equipment_ownership
  before update on public.equipment
  for each row execute function public.guard_equipment_ownership();

-- Row lock, old-custodian check, audit receipt, and custody update are atomic.
-- The actor and time are supplied by Supabase Auth and PostgreSQL, not the UI.
create or replace function public.transfer_equipment_ownership(
  p_equipment_id uuid,
  p_expected_personnel text,
  p_expected_location text,
  p_new_personnel text,
  p_new_location text,
  p_reason text
)
returns public.equipment
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_equipment public.equipment;
  v_actor_name text;
  v_actor_email text;
  v_new_personnel text := trim(coalesce(p_new_personnel, ''));
  v_new_location text := upper(trim(coalesce(p_new_location, '')));
  v_reason text := trim(coalesce(p_reason, ''));
  v_receipt jsonb;
begin
  if not public.is_authorized_inventory_user() then
    raise exception using errcode = '42501', message = 'You are not authorized to transfer equipment.';
  end if;
  if v_new_personnel = '' or v_new_location = '' or v_reason = '' then
    raise exception using errcode = '22023', message = 'New custodian, office, and transfer reason are required.';
  end if;
  if length(v_new_personnel) > 180 or length(v_new_location) > 180 or length(v_reason) > 1000 then
    raise exception using errcode = '22023', message = 'Transfer details are too long.';
  end if;

  select * into v_equipment
  from public.equipment
  where id = p_equipment_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Equipment was not found.';
  end if;
  if v_equipment.accountable_personnel is distinct from p_expected_personnel
    or v_equipment.location is distinct from p_expected_location then
    raise exception using errcode = '40001', message = 'Custody changed since you opened this equipment. Refresh and try again.';
  end if;
  if lower(trim(v_equipment.accountable_personnel)) = lower(v_new_personnel)
    and upper(trim(v_equipment.location)) = v_new_location then
    raise exception using errcode = '22023', message = 'The new custodian and office are unchanged.';
  end if;

  v_actor_email := lower(auth.jwt() ->> 'email');
  select account.full_name into v_actor_name
  from public.authorized_accounts as account
  where account.auth_user_id = auth.uid() and lower(account.email) = v_actor_email
  limit 1;
  v_receipt := jsonb_build_object(
    'id', gen_random_uuid()::text,
    'transferredAt', clock_timestamp(),
    'fromPersonnel', v_equipment.accountable_personnel,
    'toPersonnel', v_new_personnel,
    'fromLocation', v_equipment.location,
    'toLocation', v_new_location,
    'reason', v_reason,
    'actorName', coalesce(v_actor_name, v_actor_email),
    'actorEmail', v_actor_email,
    'actorUserId', auth.uid()::text
  );

  perform set_config('app.ownership_transfer', 'true', true);
  update public.equipment
  set accountable_personnel = v_new_personnel,
      location = v_new_location,
      ownership_history = jsonb_build_array(v_receipt) || coalesce(v_equipment.ownership_history, '[]'::jsonb)
  where id = p_equipment_id
  returning * into v_equipment;
  perform set_config('app.ownership_transfer', '', true);
  return v_equipment;
end;
$$;

revoke all on function public.transfer_equipment_ownership(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.transfer_equipment_ownership(uuid, text, text, text, text, text) to authenticated;

create or replace function public.audit_equipment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_email text := coalesce(nullif(lower(auth.jwt() ->> 'email'), ''), 'system');
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_action text;
  v_target_id uuid;
  v_property_number text;
  v_details jsonb := '{}'::jsonb;
  v_old jsonb;
  v_new jsonb;
  v_key text;
  v_value jsonb;
begin
  select account.full_name into v_actor_name
  from public.authorized_accounts as account
  where account.auth_user_id = v_actor_id and lower(account.email) = v_actor_email
  limit 1;
  v_actor_name := coalesce(v_actor_name, nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), v_actor_email);

  if tg_op = 'INSERT' then
    v_action := 'equipment.created';
    v_target_id := new.id;
    v_property_number := new.property_number;
    v_details := jsonb_build_object('record', 'Equipment added to inventory');
  elsif tg_op = 'UPDATE' then
    v_target_id := new.id;
    v_property_number := new.property_number;
    if new.ownership_history is distinct from old.ownership_history then
      v_action := 'equipment.transferred';
      v_details := jsonb_build_object('transfer', new.ownership_history -> 0);
    elsif new.last_verified_at is distinct from old.last_verified_at then
      v_action := 'equipment.verified';
      v_details := jsonb_build_object('verification', new.verification_history -> 0);
    else
      v_action := 'equipment.updated';
    end if;
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);
    for v_key, v_value in select key, value from jsonb_each(v_new) loop
      if v_key not in ('id', 'created_at', 'updated_at', 'verification_history', 'ownership_history')
        and v_value is distinct from (v_old -> v_key) then
        v_details := v_details || jsonb_build_object(
          v_key,
          jsonb_build_object('from', v_old -> v_key, 'to', v_value)
        );
      end if;
    end loop;
  else
    v_action := 'equipment.deleted';
    v_target_id := old.id;
    v_property_number := old.property_number;
    v_details := jsonb_build_object('record', 'Equipment removed from inventory');
  end if;

  insert into public.activity_log (
    actor_user_id, actor_name, actor_email, action, target_type,
    target_id, target_label, equipment_property_number, details
  ) values (
    v_actor_id,
    v_actor_name,
    v_actor_email,
    v_action,
    'equipment',
    v_target_id,
    v_property_number,
    v_property_number,
    v_details
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_equipment_change on public.equipment;
create trigger audit_equipment_change
  after insert or update or delete on public.equipment
  for each row execute function public.audit_equipment_change();

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Preserve the existing behavior: updated_at is the official QR check-in time.
  if new.last_verified_at is distinct from old.last_verified_at then
    new.updated_at = timezone('utc'::text, now());
  else
    new.updated_at = old.updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at
  before update on public.equipment
  for each row execute function public.handle_updated_at();

-- Remove older permissive policies and grant account access only to the two
-- records that exist in authorized_accounts. Public detail reads go through a
-- server route that returns a single requested asset; the table itself is not public.
do $$
declare
  v_policy record;
begin
  for v_policy in
    select polname from pg_policy where polrelid = 'public.equipment'::regclass
  loop
    execute format('drop policy %I on public.equipment', v_policy.polname);
  end loop;
end;
$$;

alter table public.equipment enable row level security;
revoke all on public.equipment from anon;
grant select, insert, update, delete on public.equipment to authenticated, service_role;

create policy equipment_read_for_authorized_users
  on public.equipment for select to authenticated
  using ((select public.is_authorized_inventory_user()));
create policy equipment_insert_for_authorized_users
  on public.equipment for insert to authenticated
  with check ((select public.is_authorized_inventory_user()));
create policy equipment_update_for_authorized_users
  on public.equipment for update to authenticated
  using ((select public.is_authorized_inventory_user()))
  with check ((select public.is_authorized_inventory_user()));
create policy equipment_delete_for_authorized_users
  on public.equipment for delete to authenticated
  using ((select public.is_authorized_inventory_user()));

-- Enable Supabase Realtime refresh for the dashboard.
do $$
begin
  alter publication supabase_realtime add table public.equipment;
exception
  when duplicate_object or undefined_object then null;
end;
$$;

-- Make newly created RPC signatures available to PostgREST immediately.
notify pgrst, 'reload schema';
