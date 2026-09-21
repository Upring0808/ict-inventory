-- ==============================================================================
-- ICT Asset & PMS Inventory - Supabase PostgreSQL Schema
-- Run this in Supabase Dashboard -> SQL Editor
-- ==============================================================================

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

  -- Hardware & Software Specifications
  processor text,
  ram text,
  gpu text,
  range_category text,
  os_installed text,
  office_productivity_product text,
  endpoint_protection text,
  computer_name text,

  -- Operational Condition
  date_pms_conducted text,
  status text not null default 'Serviceable',
  status_category text not null default 'Serviceable',
  remarks text,

  -- QR verification audit (each confirmation is retained as JSON)
  last_verified_at timestamp with time zone,
  last_verified_by text,
  verification_count integer not null default 0,
  verification_history jsonb not null default '[]'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Migration-safe for projects that already created the equipment table.
alter table public.equipment add column if not exists last_verified_at timestamp with time zone;
alter table public.equipment add column if not exists last_verified_by text;
alter table public.equipment add column if not exists verification_count integer not null default 0;
alter table public.equipment add column if not exists verification_history jsonb not null default '[]'::jsonb;

-- Performance Indexes
create index if not exists idx_equipment_prop_num on public.equipment (property_number);
create index if not exists idx_equipment_type on public.equipment (equipment_type);
create index if not exists idx_equipment_location on public.equipment (location);
create index if not exists idx_equipment_shelf_life on public.equipment (shelf_life);
create index if not exists idx_equipment_status_cat on public.equipment (status_category);
create index if not exists idx_equipment_last_verified on public.equipment (last_verified_at);

-- Enable Row Level Security (RLS)
alter table public.equipment enable row level security;

-- Policy to allow all operations with your Publishable/Anon API Key
create policy "Allow all operations for authenticated and anon" on public.equipment
  for all using (true) with check (true);

-- Auto-update updated_at timestamp trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at
  before update on public.equipment
  for each row
  execute function public.handle_updated_at();
