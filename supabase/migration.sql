-- PDQ Scope Tracker — Supabase Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'technician' check (role in ('technician', 'estimator', 'admin')),
  company_id uuid,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'technician');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  address text not null default '',
  job_type text not null default 'Water Mitigation' check (job_type in ('Water Mitigation', 'Fire & Smoke', 'General')),
  water_category text check (water_category in ('cat2', 'cat3')),
  status text not null default 'active' check (status in ('active', 'complete', 'archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;

-- For now, all authenticated users can read/write all projects (same company)
create policy "Authenticated users can read projects"
  on projects for select to authenticated using (true);

create policy "Authenticated users can insert projects"
  on projects for insert to authenticated with check (true);

create policy "Authenticated users can update projects"
  on projects for update to authenticated using (true);

-- Also allow anon access for prototype (no auth enforced yet)
create policy "Anon can read projects"
  on projects for select to anon using (true);

create policy "Anon can insert projects"
  on projects for insert to anon with check (true);

create policy "Anon can update projects"
  on projects for update to anon using (true);

-- ─── Sheets ──────────────────────────────────────────────────────────────────
create table if not exists sheets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  tech_name text,
  hours_type text not null default 'regular' check (hours_type in ('regular', 'after')),
  contents_status text check (contents_status in ('yes', 'no', 'not_sure')),
  contents_boxes int,
  contents_hours numeric,
  submitted boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  date date not null default current_date
);

alter table sheets enable row level security;

create policy "Authenticated users can read sheets"
  on sheets for select to authenticated using (true);

create policy "Authenticated users can insert sheets"
  on sheets for insert to authenticated with check (true);

create policy "Authenticated users can update sheets"
  on sheets for update to authenticated using (true);

create policy "Anon can read sheets"
  on sheets for select to anon using (true);

create policy "Anon can insert sheets"
  on sheets for insert to anon with check (true);

create policy "Anon can update sheets"
  on sheets for update to anon using (true);

-- ─── Rooms ───────────────────────────────────────────────────────────────────
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references sheets(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  walls_data jsonb,
  ceiling_data jsonb,
  flooring_data jsonb,
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;

create policy "Authenticated users can read rooms"
  on rooms for select to authenticated using (true);

create policy "Authenticated users can insert rooms"
  on rooms for insert to authenticated with check (true);

create policy "Authenticated users can update rooms"
  on rooms for update to authenticated using (true);

create policy "Authenticated users can delete rooms"
  on rooms for delete to authenticated using (true);

create policy "Anon can read rooms"
  on rooms for select to anon using (true);

create policy "Anon can insert rooms"
  on rooms for insert to anon with check (true);

create policy "Anon can update rooms"
  on rooms for update to anon using (true);

create policy "Anon can delete rooms"
  on rooms for delete to anon using (true);

-- ─── Items ───────────────────────────────────────────────────────────────────
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  scope_item_id text not null,
  label text not null,
  phase text not null default '1',
  subsection text not null default '',
  child_sub text,
  input_type text,
  drop_options jsonb,
  no_hours boolean not null default false,
  mandatory boolean not null default false,
  has_note boolean,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'done', 'not_needed')),
  hours numeric,
  hours_type text not null default 'regular' check (hours_type in ('regular', 'after')),
  note text,
  created_at timestamptz not null default now()
);

alter table items enable row level security;

create policy "Authenticated users can read items"
  on items for select to authenticated using (true);

create policy "Authenticated users can insert items"
  on items for insert to authenticated with check (true);

create policy "Authenticated users can update items"
  on items for update to authenticated using (true);

create policy "Authenticated users can delete items"
  on items for delete to authenticated using (true);

create policy "Anon can read items"
  on items for select to anon using (true);

create policy "Anon can insert items"
  on items for insert to anon with check (true);

create policy "Anon can update items"
  on items for update to anon using (true);

create policy "Anon can delete items"
  on items for delete to anon using (true);

-- ─── Photos ──────────────────────────────────────────────────────────────────
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  project_id uuid not null references projects(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table photos enable row level security;

create policy "Authenticated users can read photos"
  on photos for select to authenticated using (true);

create policy "Authenticated users can insert photos"
  on photos for insert to authenticated with check (true);

create policy "Authenticated users can delete photos"
  on photos for delete to authenticated using (true);

create policy "Anon can read photos"
  on photos for select to anon using (true);

create policy "Anon can insert photos"
  on photos for insert to anon with check (true);

create policy "Anon can delete photos"
  on photos for delete to anon using (true);

-- ─── Storage Bucket for Photos ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Anyone can read photos"
  on storage.objects for select using (bucket_id = 'photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert to authenticated with check (bucket_id = 'photos');

create policy "Authenticated users can delete photos"
  on storage.objects for delete to authenticated using (bucket_id = 'photos');

-- Also allow anon uploads for prototype
create policy "Anon can upload photos"
  on storage.objects for insert to anon with check (bucket_id = 'photos');

create policy "Anon can delete photos"
  on storage.objects for delete to anon using (bucket_id = 'photos');

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_sheets_project_id on sheets(project_id);
create index if not exists idx_rooms_sheet_id on rooms(sheet_id);
create index if not exists idx_items_room_id on items(room_id);
create index if not exists idx_photos_item_id on photos(item_id);
create index if not exists idx_photos_project_id on photos(project_id);

-- ─── Updated_at trigger for projects ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on projects;
create trigger set_updated_at
  before update on projects
  for each row execute function update_updated_at();
