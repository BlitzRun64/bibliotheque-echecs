// Configuration des catégories de ressources : couleur, libellé, image d'illustration, texte d'intro.
//
// - `id` est la valeur stockée dans ressources.categorie (enum SQL) et le segment d'URL /ressources/<id>.
// - `couleur` renvoie au token --color-<couleur> défini dans src/index.css (@theme) ;
//   la variante de bouton correspondante est btn-<couleur>.
// - `image` est l'illustration affichée à gauche du titre. Ce sont pour l'instant des images de
//   substitution : déposez les vôtres dans public/image/ressources/ et changez le chemin ici.

/** @typedef {import('../types/ressources').CategorieRessource} CategorieRessource */

/**
 * @typedef {Object} ConfigCategorie
 * @property {CategorieRessource} id
 * @property {string} libelle
 * @property {string} couleur        nom du token de couleur (--color-<couleur>) et de la variante btn-<couleur>
 * @property {string} image          illustration à gauche du titre
 * @property {string} description    phrase d'introduction de la page
 */

/** @type {ConfigCategorie[]} */
export const CATEGORIES = [
  {
    id: 'youtube',
    libelle: 'Chaînes YouTube',
    couleur: 'youtube',
    image: '/image/ressources/YouTubes.svg',
    description: 'Des chaînes pour progresser en vidéo : cours, analyses et parties commentées.',
  },
  {
    id: 'sites',
    libelle: 'Sites',
    couleur: 'sites',
    image: '/image/ressources/sites.svg',
    description: "Les sites utiles du club : jouer en ligne, s'entraîner, suivre les classements.",
  },
  {
    id: 'etudes',
    libelle: 'Études',
    couleur: 'etudes',
    image: '/image/ressources/etude.png',
    description: "Les études Lichess de l'équipe, saison par saison.",
  },
  {
    id: 'specialites',
    libelle: 'Spécialités',
    couleur: 'specialites',
    image: '/image/ressources/specialites.svg',
    description: 'Ouvertures, finales, tactique : les spécialités travaillées au club.',
  },
]

// Illustration des dossiers de ressources. C'est une image de substitution : exportez votre
// dessin en PNG (fond transparent, format carré), déposez-le dans public/image/ressources/
// et changez le chemin ici, par exemple '/image/ressources/dossier.png'.
export const IMAGE_DOSSIER = '/image/ressources/dossier-echiquier.svg'

/** @param {string} id */
export function trouverCategorie(id) {
  return CATEGORIES.find((categorie) => categorie.id === id) ?? null
}

/** @param {string} id */
export function cheminCategorie(id) {
  return `/ressources/${id}`
}
