-- =====================================================================
-- SYNDIC MAROC — Schéma Supabase complet
-- Copier-coller ce fichier entier dans Supabase > SQL Editor > Run
-- =====================================================================

-- 1) EXTENSION nécessaire pour les UUID
create extension if not exists "pgcrypto";

-- =====================================================================
-- 2) TABLE: residences (une copropriété / immeuble géré par un syndic)
-- =====================================================================
create table if not exists public.residences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  syndic_id uuid references auth.users(id) on delete set null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 3) TABLE: profiles (étend auth.users avec rôle + infos)
--    role: 'resident' | 'syndic' | 'societe'
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('resident','syndic','societe')),
  phone text,
  residence_id uuid references public.residences(id) on delete set null,
  apartment_number text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 4) TABLE: charges (appels de fonds créés par le syndic)
-- =====================================================================
create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  title text not null,
  description text,
  amount numeric(10,2) not null,
  due_date date not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 5) TABLE: payments (paiement d'une charge par un résident)
--    status: 'pending' | 'paid' | 'late'
-- =====================================================================
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

-- =====================================================================
-- 6) TABLE: announcements (annonces / communication)
-- =====================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 7) TABLE: documents (métadonnées des fichiers, fichiers réels dans Storage)
-- =====================================================================
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  residence_id uuid not null references public.residences(id) on delete cascade,
  name text not null,
  category text default 'general',
  file_path text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 8) FONCTION HELPER: récupérer le rôle + résidence de l'utilisateur connecté
--    (security definer pour éviter les boucles infinies dans les policies RLS)
-- =====================================================================
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

-- =====================================================================
-- 9) ACTIVER RLS (Row Level Security) sur toutes les tables
-- =====================================================================
alter table public.residences enable row level security;
alter table public.profiles enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.documents enable row level security;

-- =====================================================================
-- 10) POLICIES: residences
-- =====================================================================
create policy "voir sa propre residence"
  on public.residences for select
  using ( id = public.my_residence() or syndic_id = auth.uid() );

create policy "syndic peut creer une residence"
  on public.residences for insert
  with check ( auth.uid() = syndic_id );

create policy "syndic peut modifier sa residence"
  on public.residences for update
  using ( syndic_id = auth.uid() );

-- tout utilisateur authentifié peut LIRE une résidence par invite_code pour rejoindre
create policy "chercher par invite code"
  on public.residences for select
  using ( true );

-- =====================================================================
-- 11) POLICIES: profiles
-- =====================================================================
create policy "voir son propre profil"
  on public.profiles for select
  using ( id = auth.uid() );

create policy "voir profils de sa residence"
  on public.profiles for select
  using ( residence_id = public.my_residence() );

create policy "creer son profil a l'inscription"
  on public.profiles for insert
  with check ( id = auth.uid() );

create policy "modifier son propre profil"
  on public.profiles for update
  using ( id = auth.uid() );

-- =====================================================================
-- 12) POLICIES: charges
-- =====================================================================
create policy "voir charges de sa residence"
  on public.charges for select
  using ( residence_id = public.my_residence() );

create policy "syndic cree des charges"
  on public.charges for insert
  with check ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

create policy "syndic modifie des charges"
  on public.charges for update
  using ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

create policy "syndic supprime des charges"
  on public.charges for delete
  using ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

-- =====================================================================
-- 13) POLICIES: payments
-- =====================================================================
create policy "resident voit ses paiements"
  on public.payments for select
  using ( resident_id = auth.uid() or public.my_role() in ('syndic','societe') );

create policy "syndic cree des paiements"
  on public.payments for insert
  with check ( public.my_role() in ('syndic','societe') );

create policy "resident ou syndic met a jour un paiement"
  on public.payments for update
  using ( resident_id = auth.uid() or public.my_role() in ('syndic','societe') );

-- =====================================================================
-- 14) POLICIES: announcements
-- =====================================================================
create policy "voir annonces de sa residence"
  on public.announcements for select
  using ( residence_id = public.my_residence() );

create policy "syndic cree des annonces"
  on public.announcements for insert
  with check ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

create policy "syndic supprime des annonces"
  on public.announcements for delete
  using ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

-- =====================================================================
-- 15) POLICIES: documents
-- =====================================================================
create policy "voir documents de sa residence"
  on public.documents for select
  using ( residence_id = public.my_residence() );

create policy "syndic ajoute des documents"
  on public.documents for insert
  with check ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

create policy "syndic supprime des documents"
  on public.documents for delete
  using ( public.my_role() in ('syndic','societe') and residence_id = public.my_residence() );

-- =====================================================================
-- 16) STORAGE: bucket pour les documents
--     (à faire aussi manuellement dans Storage > New bucket si besoin,
--      mais cette commande le crée automatiquement)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "lire ses documents storage"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

create policy "uploader des documents storage"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- =====================================================================
-- FIN DU SCHEMA — c'est tout, ton backend est prêt.
-- =====================================================================
