-- Table des événements affichés dans l'onglet Horloge (compte à rebours).
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.

create table if not exists public.evenements (
  id          bigint generated always as identity primary key,
  nom         text not null,
  date_cible  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.evenements enable row level security;

-- Droits d'accès de base (sans eux : "permission denied for table evenements").
-- Les policies ci-dessous restreignent ensuite qui peut faire quoi.
grant select on public.evenements to anon, authenticated;
grant insert, update, delete on public.evenements to authenticated;
grant usage, select on sequence public.evenements_id_seq to authenticated;

-- Tout le monde (même non connecté) peut voir les événements.
create policy "evenements_lecture_publique"
  on public.evenements for select
  using (true);

-- Seuls les administrateurs (profils.est_admin) peuvent ajouter, modifier, supprimer.
create policy "evenements_ajout_admin"
  on public.evenements for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

create policy "evenements_modif_admin"
  on public.evenements for update to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin))
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

create policy "evenements_suppression_admin"
  on public.evenements for delete to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));
