// Accès aux données de la table `ressources` et au bucket Storage `ressources`.
// Les règles de sécurité (RLS, limites du bucket) sont dans supabase/ressources.sql ;
// les vérifications faites ici évitent simplement des allers-retours inutiles.
import { supabase } from '../supabaseClient'

/** @typedef {import('../types/ressources').Ressource} Ressource */
/** @typedef {import('../types/ressources').ValeursRessource} ValeursRessource */

export const BUCKET_IMAGES = 'ressources'
export const TYPES_IMAGE_ACCEPTES = ['image/png', 'image/jpeg', 'image/webp']
export const TAILLE_MAX_IMAGE = 2 * 1024 * 1024 // 2 Mo, identique à la limite du bucket

const EXTENSIONS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/** Seuls les liens https:// sont acceptés. */
export function estLienSur(url) {
  if (typeof url !== 'string') return false
  try {
    return new URL(url.trim()).protocol === 'https:'
  } catch {
    return false
  }
}

/** Vérifie le type et la taille d'une image avant envoi. Renvoie un message d'erreur, ou null. */
export function verifierImage(fichier) {
  if (!TYPES_IMAGE_ACCEPTES.includes(fichier.type)) {
    return 'Image refusée : formats acceptés png, jpg ou webp.'
  }
  if (fichier.size > TAILLE_MAX_IMAGE) {
    return 'Image trop lourde : 2 Mo maximum.'
  }
  return null
}

/** @param {string} categorie */
export function chargerRessources(categorie) {
  return supabase
    .from('ressources')
    .select('*')
    .eq('categorie', categorie)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })
}

/**
 * @param {ValeursRessource} valeurs
 * @param {{ dossier_id?: number | null, ordre?: number }} [placement] dossier et position de la nouvelle fiche
 */
export function ajouterRessource(valeurs, placement = {}) {
  return supabase.from('ressources').insert({ ...nettoyer(valeurs), ...placement }).select().single()
}

/** Range une fiche dans un dossier (null = la sortir) à la position donnée. */
export function deplacerRessource(id, dossierId, ordre) {
  return supabase
    .from('ressources')
    .update({ dossier_id: dossierId, ordre, updated_at: new Date().toISOString() })
    .eq('id', id)
}

// ----- Dossiers -----

/** @param {string} categorie */
export function chargerDossiers(categorie) {
  return supabase
    .from('dossiers_ressources')
    .select('*')
    .eq('categorie', categorie)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true })
}

export function ajouterDossier(categorie, nom, ordre) {
  return supabase.from('dossiers_ressources').insert({ categorie, nom: nom.trim(), ordre }).select().single()
}

export function renommerDossier(id, nom) {
  return supabase.from('dossiers_ressources').update({ nom: nom.trim() }).eq('id', id)
}

/** Supprime le dossier ; ses fiches en ressortent (on delete set null côté base). */
export function supprimerDossier(id) {
  return supabase.from('dossiers_ressources').delete().eq('id', id)
}

/**
 * Enregistre l'ordre d'une liste déjà triée (positions 1, 2, 3…), en ne touchant
 * qu'aux lignes dont la position a changé.
 * @param {'ressources' | 'dossiers_ressources'} table
 * @param {{ id: number, ordre: number }[]} elements dans le nouvel ordre, avec leur ancienne position
 */
export async function enregistrerOrdre(table, elements) {
  const changements = elements
    .map((element, index) => ({ id: element.id, ordre: index + 1, avant: element.ordre }))
    .filter((c) => c.ordre !== c.avant)
  const resultats = await Promise.all(
    changements.map((c) => supabase.from(table).update({ ordre: c.ordre }).eq('id', c.id)),
  )
  return { error: resultats.find((r) => r.error)?.error ?? null }
}

/** @param {number} id @param {ValeursRessource} valeurs */
export function modifierRessource(id, valeurs) {
  return supabase
    .from('ressources')
    .update({ ...nettoyer(valeurs), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

/** Supprime la fiche, puis son image si elle est dans le bucket. @param {Ressource} ressource */
export async function supprimerRessource(ressource) {
  const { error } = await supabase.from('ressources').delete().eq('id', ressource.id)
  if (!error) await supprimerImage(ressource.image_url)
  return { error }
}

/**
 * Envoie une image dans le bucket et renvoie son URL publique. Lève une erreur en cas d'échec.
 * @param {File} fichier @param {string} categorie
 */
export async function televerserImage(fichier, categorie) {
  const probleme = verifierImage(fichier)
  if (probleme) throw new Error(probleme)

  const chemin = `${categorie}/${crypto.randomUUID()}.${EXTENSIONS[fichier.type]}`
  const { error } = await supabase.storage
    .from(BUCKET_IMAGES)
    .upload(chemin, fichier, { contentType: fichier.type, cacheControl: '3600' })
  if (error) throw new Error(`Envoi de l'image impossible : ${error.message}`)

  return supabase.storage.from(BUCKET_IMAGES).getPublicUrl(chemin).data.publicUrl
}

/** Supprime une image du bucket si l'URL pointe dedans (les URL externes sont ignorées). */
export async function supprimerImage(url) {
  const chemin = cheminDansBucket(url)
  if (!chemin) return
  const { error } = await supabase.storage.from(BUCKET_IMAGES).remove([chemin])
  if (error) console.warn('Image non supprimée du bucket :', error.message)
}

function cheminDansBucket(url) {
  if (!url) return null
  const marqueur = `/storage/v1/object/public/${BUCKET_IMAGES}/`
  const position = url.indexOf(marqueur)
  return position === -1 ? null : decodeURIComponent(url.slice(position + marqueur.length))
}

/** Normalise les valeurs du formulaire : chaînes vides → null, espaces superflus retirés. */
function nettoyer(valeurs) {
  const texteOuNull = (valeur) => {
    const texte = (valeur ?? '').toString().trim()
    return texte === '' ? null : texte
  }
  return {
    categorie: valeurs.categorie,
    titre: (valeurs.titre ?? '').trim(),
    auteur: texteOuNull(valeurs.auteur),
    lien: (valeurs.lien ?? '').trim(),
    image_url: texteOuNull(valeurs.image_url),
    description: texteOuNull(valeurs.description),
  }
}
