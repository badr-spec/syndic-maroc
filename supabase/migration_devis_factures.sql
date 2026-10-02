-- =====================================================================
-- DEVIS & FACTURES des sociétés -> syndic
-- Copier-coller dans Supabase > SQL Editor > Run (peut être relancé sans risque)
-- =====================================================================

alter table public.virements add column if not exists kind text not null default 'virement';
alter table public.virements add column if not exists doc_status text not null default 'en_attente';
alter table public.virements add column if not exists payment_proof_path text;
alter table public.virements add column if not exists payment_reference text;
alter table public.virements add column if not exists paid_at timestamptz;
alter table public.virements add column if not exists paid_by uuid references auth.users(id);

alter table public.virements drop constraint if exists virements_kind_check;
alter table public.virements add constraint virements_kind_check
  check (kind in ('virement','devis','facture'));

alter table public.virements drop constraint if exists virements_doc_status_check;
alter table public.virements add constraint virements_doc_status_check
  check (doc_status in ('en_attente','accepte','refuse','paye'));

create index if not exists virements_residence_kind_idx on public.virements (residence_id, kind, created_at desc);

alter table public.virements enable row level security;

-- La société (ou le résident) envoie ses propres documents dans sa résidence
drop policy if exists "envoyer devis facture" on public.virements;
create policy "envoyer devis facture"
  on public.virements for insert
  with check (
    resident_id = auth.uid()
    and residence_id = public.my_residence()
    and (
      (kind = 'virement')
      or (kind in ('devis','facture') and public.my_role() in ('societe','societe_externe','responsable_immeuble'))
    )
  );

-- Chacun voit ses envois ; le syndic voit tout ce qui concerne sa résidence
drop policy if exists "voir devis facture" on public.virements;
create policy "voir devis facture"
  on public.virements for select
  using (
    resident_id = auth.uid()
    or (public.my_role() = 'syndic' and residence_id = public.my_residence())
  );

-- Seul le syndic de la résidence accepte / refuse / marque payé
drop policy if exists "syndic traite devis facture" on public.virements;
create policy "syndic traite devis facture"
  on public.virements for update
  using (public.my_role() = 'syndic' and residence_id = public.my_residence())
  with check (public.my_role() = 'syndic' and residence_id = public.my_residence());

-- Storage "preuves" : dossier = <residence_id>/<user_id>/fichier
insert into storage.buckets (id, name, public)
values ('preuves', 'preuves', false)
on conflict (id) do nothing;

drop policy if exists "preuves upload dans sa residence" on storage.objects;
create policy "preuves upload dans sa residence"
  on storage.objects for insert
  with check (
    bucket_id = 'preuves'
    and (storage.foldername(name))[1] = public.my_residence()::text
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "preuves lecture" on storage.objects;
create policy "preuves lecture"
  on storage.objects for select
  using (
    bucket_id = 'preuves'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or (public.my_role() = 'syndic' and (storage.foldername(name))[1] = public.my_residence()::text)
      or exists (
        select 1 from public.virements v
        where v.payment_proof_path = storage.objects.name
          and v.resident_id = auth.uid()
      )
    )
  );
