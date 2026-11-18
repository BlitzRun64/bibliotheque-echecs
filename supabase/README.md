# Migrations SQL Supabase

Tout le SQL du projet vit ici, versionné. Chaque fichier s'exécute **à la main, une fois, dans l'ordre**,
dans le tableau de bord Supabase : *SQL Editor → New query → coller le fichier → Run*.
Les scripts sont rejouables sans erreur (`if not exists`, `drop policy if exists`, `on conflict`).

| Ordre | Fichier | Contenu | État |
|-------|---------|---------|------|
| 1 | `evenements.sql` | Table `evenements` (onglet Événements, comptes à rebours) | déjà exécuté |
| 2 | `ressources.sql` | Enum `categorie_ressource`, table `ressources`, bucket Storage `ressources`, reprise des 3 études Lichess | **à exécuter** |
| 3 | `dossiers_ressources.sql` | Table `dossiers_ressources`, colonne `ressources.dossier_id` (dossiers et ordre par glisser-déposer) | **à exécuter** |
| 4 | `liens_tournois_dates.sql` | Colonnes `date_debut`, `date_fin`, `cadence` de `liens_tournois` (frise « Parcours temporel »), droit de modification admin | **à exécuter** |

## Vérifier après `ressources.sql`

- *Table Editor → ressources* : 3 lignes (études 2025, 2026, 2027).
- *Storage → ressources* : bucket public, 2 Mo maximum, types `image/png`, `image/jpeg`, `image/webp`.
- *Authentication → Policies* : lecture publique, écriture (insert / update / delete) réservée aux administrateurs,
  sur la table `ressources` et sur `storage.objects` pour ce bucket.

## Règles communes à toutes les tables

- RLS activée : lecture publique, écriture réservée aux comptes dont `profils.est_admin` est vrai.
- Toujours accorder les droits de base, sinon Supabase répond « permission denied for table … » :
  `grant select … to anon, authenticated`, `grant insert, update, delete … to authenticated`
  et `grant usage, select on sequence … to authenticated`.
- Aucune clé `service_role` côté client : l'application n'utilise que `VITE_SUPABASE_ANON_KEY`
  (voir `src/supabaseClient.js`). La clé `service_role` reste dans le tableau de bord Supabase.

## Types issus du schéma (référence)

Le projet est en JavaScript : les objets manipulés sont documentés en JSDoc dans `src/types/ressources.js`.
Pour obtenir un fichier de types complet généré depuis la base (autocomplétion dans l'éditeur) :

```bash
npx supabase login
npx supabase link --project-ref <référence du projet>   # une seule fois
npm run types:supabase                                    # écrit src/types/supabase.d.ts
```

La référence du projet se lit dans l'URL du tableau de bord (`https://supabase.com/dashboard/project/<référence>`).
