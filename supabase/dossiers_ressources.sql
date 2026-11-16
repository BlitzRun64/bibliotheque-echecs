-- Dossiers de ressources et ordre d'affichage choisi par les administrateurs.
-- À exécuter une fois dans Supabase, après ressources.sql : SQL Editor > New query > coller > Run.
-- Le script peut être rejoué sans erreur (if not exists / drop policy if exists).

-- ---------------------------------------------------------------------------
-- 1. Table des dossiers : un dossier appartient à une catégorie (YouTube, Sites…).
--    `ordre` place les dossiers les uns par rapport aux autres (glisser-déposer).
-- ---------------------------------------------------------------------------
create table if not exists public.dossiers_ressources (
  id         bigint generated always as identity primary key,
  categorie  public.categorie_ressource not null,
  nom        text not null check (char_length(nom) between 1 and 60),
  ordre      integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists dossiers_ressources_categorie_idx
  on public.dossiers_ressources (categorie, ordre);

alter table public.dossiers_ressources enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Rattachement d'une ressource à un dossier (null = hors dossier).
--    Supprimer un dossier ne supprime pas ses ressources : elles en ressortent.
--    La colonne `ordre` de ressources existe déjà : elle sert à l'ordre dans chaque dossier.
-- ---------------------------------------------------------------------------
alter table public.ressources
  add column if not exists dossier_id bigint
  references public.dossiers_ressources (id) on delete set null;

create index if not exists ressources_dossier_idx
  on public.ressources (dossier_id, ordre);

-- ---------------------------------------------------------------------------
-- 3. Droits de base (sans eux : "permission denied for table dossiers_ressources").
-- ---------------------------------------------------------------------------
grant select on public.dossiers_ressources to anon, authenticated;
grant insert, update, delete on public.dossiers_ressources to authenticated;
grant usage, select on sequence public.dossiers_ressources_id_seq to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Policies : lecture publique, écriture réservée aux administrateurs.
-- ---------------------------------------------------------------------------
drop policy if exists "dossiers_ressources_lecture_publique" on public.dossiers_ressources;
create policy "dossiers_ressources_lecture_publique"
  on public.dossiers_ressources for select
  using (true);

drop policy if exists "dossiers_ressources_ajout_admin" on public.dossiers_ressources;
create policy "dossiers_ressources_ajout_admin"
  on public.dossiers_ressources for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

drop policy if exists "dossiers_ressources_modif_admin" on public.dossiers_ressources;
create policy "dossiers_ressources_modif_admin"
  on public.dossiers_ressources for update to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin))
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

drop policy if exists "dossiers_ressources_suppression_admin" on public.dossiers_ressources;
create policy "dossiers_ressources_suppression_admin"
  on public.dossiers_ressources for delete to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));
