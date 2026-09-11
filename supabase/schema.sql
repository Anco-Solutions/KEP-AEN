-- KEP-AEN / SeaService Calculator
-- Initial shared database schema.
-- Run this in the Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  role text not null default 'teacher' check (role in ('admin','teacher')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.examinations (
  id uuid primary key default gen_random_uuid(),
  registry_number text not null,
  full_name text not null,
  kep smallint not null check (kep in (1,2)),
  rank text,
  examiner_id uuid references public.profiles(id),
  documents_status text not null default 'Δεν έχουν ελεγχθεί',
  examination_status text not null default 'Εκκρεμεί',
  grade numeric(4,2) check (grade is null or (grade >= 0 and grade <= 10)),
  grade_classification text,
  final_decision text,
  service_months integer not null default 0 check (service_months >= 0),
  service_days integer not null default 0 check (service_days between 0 and 29),
  result_text text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create index if not exists examinations_registry_idx on public.examinations(registry_number);
create index if not exists examinations_updated_idx on public.examinations(updated_at desc);

create table if not exists public.service_trips (
  id uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations(id) on delete cascade,
  embark_date date not null,
  discharge_date date not null,
  service_months integer not null default 0 check (service_months >= 0),
  service_days integer not null default 0 check (service_days between 0 and 29),
  created_at timestamptz not null default now(),
  check (discharge_date >= embark_date)
);

create index if not exists service_trips_exam_idx on public.service_trips(examination_id);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  examination_id uuid references public.examinations(id) on delete set null,
  action text not null,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_exam_idx on public.audit_log(examination_id, occurred_at desc);
create index if not exists audit_log_user_idx on public.audit_log(user_id, occurred_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.active = true
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.examinations enable row level security;
alter table public.service_trips enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users can read active profiles; only admins can manage access/roles.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (public.is_active_user());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.is_admin());

-- Examinations: all active teachers/admins share the same records.
drop policy if exists examinations_select on public.examinations;
create policy examinations_select on public.examinations
for select to authenticated
using (public.is_active_user());

drop policy if exists examinations_insert on public.examinations;
create policy examinations_insert on public.examinations
for insert to authenticated
with check (public.is_active_user() and created_by = auth.uid());

drop policy if exists examinations_update on public.examinations;
create policy examinations_update on public.examinations
for update to authenticated
using (public.is_active_user())
with check (public.is_active_user());

drop policy if exists examinations_delete on public.examinations;
create policy examinations_delete on public.examinations
for delete to authenticated
using (public.is_admin());

-- Trips follow the visibility of their examination.
drop policy if exists service_trips_select on public.service_trips;
create policy service_trips_select on public.service_trips
for select to authenticated
using (exists (select 1 from public.examinations e where e.id = examination_id and public.is_active_user()));

drop policy if exists service_trips_insert on public.service_trips;
create policy service_trips_insert on public.service_trips
for insert to authenticated
with check (exists (select 1 from public.examinations e where e.id = examination_id and public.is_active_user()));

drop policy if exists service_trips_update on public.service_trips;
create policy service_trips_update on public.service_trips
for update to authenticated
using (exists (select 1 from public.examinations e where e.id = examination_id and public.is_active_user()))
with check (exists (select 1 from public.examinations e where e.id = examination_id and public.is_active_user()));

drop policy if exists service_trips_delete on public.service_trips;
create policy service_trips_delete on public.service_trips
for delete to authenticated
using (public.is_admin());

-- Audit log: visible to active users, but immutable from the client.
drop policy if exists audit_select on public.audit_log;
create policy audit_select on public.audit_log
for select to authenticated
using (public.is_active_user());

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
for insert to authenticated
with check (user_id = auth.uid() and public.is_active_user());

-- No UPDATE/DELETE policies are intentionally created for audit_log.
-- Before production, application actions should write audit rows through
-- trusted database functions/triggers so clients cannot forge event details.

-- First-admin bootstrap (run once, manually, after the first account exists):
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';
