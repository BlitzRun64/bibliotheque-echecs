-- Ressources du club (chaînes YouTube, sites, études, spécialités) : table, droits, bucket d'images.
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être rejoué sans erreur (if not exists / drop policy if exists / on conflict).

-- ---------------------------------------------------------------------------
-- 1. Catégories : une seule table avec une colonne enum plutôt que quatre tables.
--    Les valeurs correspondent aux identifiants de src/config/ressources.js.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'categorie_ressource' and n.nspname = 'public'
  ) then
    create type public.categorie_ressource as enum ('youtube', 'sites', 'etudes', 'specialites');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. Table
-- ---------------------------------------------------------------------------
create table if not exists public.ressources (
  id          bigint generated always as identity primary key,
  categorie   public.categorie_ressource not null,
  titre       text not null check (char_length(titre) between 1 and 120),
  auteur      text check (auteur is null or char_length(auteur) <= 120),
  -- Seuls les liens https:// sont acceptés (vérifié aussi côté client).
  lien        text not null unique check (lien ~* '^https://[^[:space:]]+$'),
  -- Logo : image du bucket « ressources » ou URL https.
  image_url   text check (image_url is null or image_url ~* '^https://[^[:space:]]+$'),
  -- Texte simple, affiché tel quel (jamais interprété comme du HTML).
  description text check (description is null or char_length(description) <= 2000),
  ordre       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ressources_categorie_idx
  on public.ressources (categorie, ordre, created_at desc);

alter table public.ressources enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Droits d'accès de base (sans eux : "permission denied for table ressources").
--    Les policies ci-dessous restreignent ensuite qui peut faire quoi.
-- ---------------------------------------------------------------------------
grant select on public.ressources to anon, authenticated;
grant insert, update, delete on public.ressources to authenticated;
grant usage, select on sequence public.ressources_id_seq to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Policies : lecture publique, écriture réservée aux administrateurs (profils.est_admin).
-- ---------------------------------------------------------------------------
drop policy if exists "ressources_lecture_publique" on public.ressources;
create policy "ressources_lecture_publique"
  on public.ressources for select
  using (true);

drop policy if exists "ressources_ajout_admin" on public.ressources;
create policy "ressources_ajout_admin"
  on public.ressources for insert to authenticated
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

drop policy if exists "ressources_modif_admin" on public.ressources;
create policy "ressources_modif_admin"
  on public.ressources for update to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin))
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

drop policy if exists "ressources_suppression_admin" on public.ressources;
create policy "ressources_suppression_admin"
  on public.ressources for delete to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));

-- ---------------------------------------------------------------------------
-- 5. Bucket d'images dédié : public en lecture, 2 Mo maximum, png / jpg / webp uniquement.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ressources', 'ressources', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Policies du Storage : lecture publique, écriture réservée aux administrateurs, dans ce bucket seulement.
drop policy if exists "ressources_images_lecture_publique" on storage.objects;
create policy "ressources_images_lecture_publique"
  on storage.objects for select
  using (bucket_id = 'ressources');

drop policy if exists "ressources_images_ajout_admin" on storage.objects;
create policy "ressources_images_ajout_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ressources'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

drop policy if exists "ressources_images_modif_admin" on storage.objects;
create policy "ressources_images_modif_admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ressources'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

drop policy if exists "ressources_images_suppression_admin" on storage.objects;
create policy "ressources_images_suppression_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ressources'
    and exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin)
  );

-- ---------------------------------------------------------------------------
-- 6. Reprise des études qui étaient codées en dur dans l'ancienne page Inter-club.
-- ---------------------------------------------------------------------------
insert into public.ressources (categorie, titre, auteur, lien, description, ordre) values
  ('etudes', 'Étude d''équipe 2027', 'Club d''échecs d''Orbec',
   'https://lichess.org/study/gl7K2Vbx/boP8mLBY',
   'Étude Lichess des parties de l''équipe pour la saison 2027.', 1),
  ('etudes', 'Étude d''équipe 2026', 'Club d''échecs d''Orbec',
   'https://lichess.org/study/FDeDrUUt',
   'Étude Lichess des parties de l''équipe pour la saison 2026.', 2),
  ('etudes', 'Étude d''équipe 2025', 'Club d''échecs d''Orbec',
   'https://lichess.org/study/kBVhjsKp',
   'Étude Lichess des parties de l''équipe pour la saison 2025.', 3)
on conflict (lien) do nothing;
