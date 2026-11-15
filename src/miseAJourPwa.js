// Vérification des mises à jour du service worker.
// Partagé entre le bandeau UpdatePrompt (qui enregistre le service worker) et les boutons
// « Vérifier les mises à jour » (Navbar, page Installation).
//
// Quand une nouvelle version est trouvée, le service worker passe en attente ; workbox-window
// prévient alors UpdatePrompt, qui affiche « Nouvelle version disponible — Mettre à jour ».

const INTERVALLE_VERIFICATION = 60 * 60 * 1000 // une heure

let enregistrement = null
let verificationsPlanifiees = false

export const MESSAGES_MISE_A_JOUR = {
  disponible: "Nouvelle version trouvée : utilisez le bandeau « Mettre à jour » en bas de l'écran.",
  'a-jour': 'Vous avez déjà la dernière version.',
  indisponible: 'Vérification impossible ici (navigateur sans service worker ou mode développement).',
  erreur: 'Vérification impossible pour le moment. Réessayez plus tard.',
}

export function memoriserEnregistrement(registration) {
  enregistrement = registration
}

async function obtenirEnregistrement() {
  if (enregistrement) return enregistrement
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  enregistrement = (await navigator.serviceWorker.getRegistration()) ?? null
  return enregistrement
}

/**
 * Demande au navigateur de chercher une nouvelle version.
 * @returns {Promise<'disponible' | 'a-jour' | 'indisponible' | 'erreur'>}
 */
export async function verifierMiseAJour() {
  const registration = await obtenirEnregistrement()
  if (!registration) return 'indisponible'
  if (registration.waiting) return 'disponible'
  try {
    await registration.update()
  } catch (erreur) {
    console.error('Vérification des mises à jour impossible :', erreur)
    return 'erreur'
  }
  return registration.installing || registration.waiting ? 'disponible' : 'a-jour'
}

/** Vérifie régulièrement, au retour sur l'onglet et au retour du réseau. */
export function planifierVerifications(registration) {
  memoriserEnregistrement(registration)
  if (verificationsPlanifiees) return
  verificationsPlanifiees = true

  const verifier = () => {
    if (navigator.onLine === false) return
    registration.update().catch(() => {})
  }
  setInterval(verifier, INTERVALLE_VERIFICATION)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') verifier()
  })
  window.addEventListener('online', verifier)
}
