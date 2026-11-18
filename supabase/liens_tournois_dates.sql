-- Dates et cadence des liens de tournois (frise « Parcours temporel » de la page Tournois).
-- À exécuter une fois dans Supabase : SQL Editor > New query > coller > Run. Rejouable sans erreur.
--
-- Les colonnes restent facultatives en base pour ne pas casser les liens déjà saisis ;
-- le formulaire administrateur les rend obligatoires pour tout nouvel ajout ou modification.

alter table public.liens_tournois add column if not exists date_debut date;
alter table public.liens_tournois add column if not exists date_fin   date;
alter table public.liens_tournois add column if not exists cadence    text;

-- Cadences autorisées (une image par cadence dans public/image/cadences/).
alter table public.liens_tournois drop constraint if exists liens_tournois_cadence_valide;
alter table public.liens_tournois add constraint liens_tournois_cadence_valide
  check (cadence is null or cadence in ('bullet', 'blitz', 'rapide', 'lent'));

-- La fin ne peut pas précéder le début.
alter table public.liens_tournois drop constraint if exists liens_tournois_dates_ordonnees;
alter table public.liens_tournois add constraint liens_tournois_dates_ordonnees
  check (date_debut is null or date_fin is null or date_fin >= date_debut);

-- La modification d'un lien (bouton crayon) a besoin du droit update pour les administrateurs.
grant update on public.liens_tournois to authenticated;

drop policy if exists "liens_tournois_modif_admin" on public.liens_tournois;
create policy "liens_tournois_modif_admin"
  on public.liens_tournois for update to authenticated
  using (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin))
  with check (exists (select 1 from public.profils p where p.id = auth.uid() and p.est_admin));
