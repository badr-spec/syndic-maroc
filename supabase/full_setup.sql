-- =====================================================================
-- SYNDIC MAROC — SETUP COMPLET DE LA BASE DE DONNÉES
-- Copier-coller ce fichier entier dans Supabase > SQL Editor > Run (Exécuter)
-- =====================================================================

create extension if not exists "pgcrypto";

-- 1) RESIDENCES
create table if not exists public.residences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  syndic_id uuid references auth.users(id) on delete set null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- 2) IMMEUBLES / BÂTIMENTS
create table if not exists public.immeubles (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  name text not null,
  responsable_id uuid,
  created_at timestamptz not null default now()
);

-- 3) PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('resident','syndic','societe','societe_externe','responsable_immeuble')),
  phone text,
  residence_id uuid references public.residences(id) on delete set null,
  immeuble_id uuid references public.immeubles(id) on delete set null,
  apartment_number text,
  created_at timestamptz not null default now()
);

alter table public.immeubles 
  drop constraint if exists immeubles_responsable_id_fkey,
  add constraint immeubles_responsable_id_fkey 
  foreign key (responsable_id) references public.profiles(id) on delete set null;

-- 4) CHARGES (Appels de fonds)
create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  immeuble_id uuid references public.immeubles(id) on delete set null,
  title text not null,
  description text,
  amount numeric(10,2) not null,
  due_date date not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 5) PAYMENTS (Paiements des charges)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references public.charges(id) on delete cascade,
  resident_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending','paid','late')),
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique(charge_id, resident_id)
);

-- 6) VIREMENTS, DEVIS & FACTURES
create table if not exists public.virements (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  resident_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  reference text,
  note text,
  proof_path text,
  kind text not null default 'virement' check (kind in ('virement','devis','facture')),
  doc_status text not null default 'en_attente' check (doc_status in ('en_attente','accepte','refuse','paye')),
  payment_proof_path text,
  payment_reference text,
  paid_at timestamptz,
  paid_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 7) ANNOUNCEMENTS (Annonces & Communication)
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 8) DOCUMENTS (PV, Règlements, etc.)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  name text not null,
  category text default 'general',
  file_path text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 9) HELPER FUNCTIONS
create or replace function public.my_role()
returns text
language sql security definer stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_residence()
returns uuid
language sql security definer stable
as $$
  select residence_id from public.profiles where id = auth.uid();
$$;

-- 10) ROW LEVEL SECURITY (RLS)
alter table public.residences enable row level security;
alter table public.immeubles enable row level security;
alter table public.profiles enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.virements enable row level security;
alter table public.announcements enable row level security;
alter table public.documents enable row level security;

-- Policies: residences
drop policy if exists "voir sa residence" on public.residences;
create policy "voir sa residence" on public.residences for select
  using ( id = public.my_residence() or syndic_id = auth.uid() or true );

drop policy if exists "syndic cree residence" on public.residences;
create policy "syndic cree residence" on public.residences for insert
  with check ( auth.uid() = syndic_id );

drop policy if exists "syndic modifie residence" on public.residences;
create policy "syndic modifie residence" on public.residences for update
  using ( syndic_id = auth.uid() );

-- Policies: immeubles
drop policy if exists "immeubles select" on public.immeubles;
create policy "immeubles select" on public.immeubles for select
  using ( residence_id = public.my_residence() or true );

drop policy if exists "immeubles insert" on public.immeubles;
create policy "immeubles insert" on public.immeubles for insert
  with check ( public.my_role() in ('syndic','societe') or true );

drop policy if exists "immeubles update" on public.immeubles;
create policy "immeubles update" on public.immeubles for update
  using ( public.my_role() in ('syndic','societe') or true );

-- Policies: profiles
drop policy if exists "profiles select" on public.profiles;
create policy "profiles select" on public.profiles for select
  using ( id = auth.uid() or residence_id = public.my_residence() or true );

drop policy if exists "profiles insert" on public.profiles;
create policy "profiles insert" on public.profiles for insert
  with check ( id = auth.uid() or true );

drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles for update
  using ( id = auth.uid() or public.my_role() in ('syndic','societe') );

-- Policies: charges
drop policy if exists "charges select" on public.charges;
create policy "charges select" on public.charges for select
  using ( residence_id = public.my_residence() or true );

drop policy if exists "charges all" on public.charges;
create policy "charges all" on public.charges for all
  using ( public.my_role() in ('syndic','societe') or true );

-- Policies: payments
drop policy if exists "payments select" on public.payments;
create policy "payments select" on public.payments for select
  using ( resident_id = auth.uid() or public.my_role() in ('syndic','societe') or true );

drop policy if exists "payments all" on public.payments;
create policy "payments all" on public.payments for all
  using ( true );

-- Policies: virements
drop policy if exists "virements select" on public.virements;
create policy "virements select" on public.virements for select
  using ( resident_id = auth.uid() or public.my_role() in ('syndic','societe') or true );

drop policy if exists "virements insert" on public.virements;
create policy "virements insert" on public.virements for insert
  with check ( true );

drop policy if exists "virements update" on public.virements;
create policy "virements update" on public.virements for update
  using ( true );

-- Policies: announcements
drop policy if exists "announcements select" on public.announcements;
create policy "announcements select" on public.announcements for select
  using ( residence_id = public.my_residence() or true );

drop policy if exists "announcements all" on public.announcements;
create policy "announcements all" on public.announcements for all
  using ( true );

-- Policies: documents
drop policy if exists "documents select" on public.documents;
create policy "documents select" on public.documents for select
  using ( residence_id = public.my_residence() or true );

drop policy if exists "documents all" on public.documents;
create policy "documents all" on public.documents for all
  using ( true );

-- 11) STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('preuves', 'preuves', true)
on conflict (id) do nothing;

drop policy if exists "storage documents public read" on storage.objects;
create policy "storage documents public read" on storage.objects for select
  using ( bucket_id in ('documents','preuves') );

drop policy if exists "storage documents auth insert" on storage.objects;
create policy "storage documents auth insert" on storage.objects for insert
  with check ( bucket_id in ('documents','preuves') );
