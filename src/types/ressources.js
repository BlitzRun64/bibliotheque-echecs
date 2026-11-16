// Types de la table Supabase `ressources` (voir supabase/ressources.sql), en JSDoc.
// Le projet est en JavaScript : ces définitions documentent les objets manipulés et alimentent
// l'autocomplétion des éditeurs. Pour un fichier complet généré depuis le schéma, voir
// supabase/README.md (npm run types:supabase).

/** @typedef {'youtube' | 'sites' | 'etudes' | 'specialites'} CategorieRessource */

/**
 * Ligne de la table `ressources`.
 * @typedef {Object} Ressource
 * @property {number} id
 * @property {CategorieRessource} categorie
 * @property {string} titre
 * @property {string | null} auteur
 * @property {string} lien                 toujours en https://
 * @property {string | null} image_url     logo (bucket Storage « ressources » ou URL https)
 * @property {string | null} description   texte simple, affiché sans HTML
 * @property {number} ordre               position dans son dossier (ou hors dossier)
 * @property {number | null} dossier_id    dossier qui la contient, null si elle est à la racine
 * @property {string} created_at           ISO 8601
 * @property {string} updated_at           ISO 8601
 */

/**
 * Ligne de la table `dossiers_ressources` (voir supabase/dossiers_ressources.sql).
 * @typedef {Object} DossierRessource
 * @property {number} id
 * @property {CategorieRessource} categorie
 * @property {string} nom
 * @property {number} ordre
 * @property {string} created_at           ISO 8601
 */

/**
 * Valeurs saisies dans le formulaire d'ajout / de modification.
 * @typedef {Pick<Ressource, 'categorie' | 'titre' | 'auteur' | 'lien' | 'image_url' | 'description'>} ValeursRessource
 */

export {}
