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

/** @param {ValeursRessource} valeurs */
export function ajouterRessource(valeurs) {
  return supabase.from('ressources').insert(nettoyer(valeurs)).select().single()
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
