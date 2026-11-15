// Installation de la PWA (bouton « Installer l'application »).
//
// L'événement beforeinstallprompt n'est émis qu'une seule fois par chargement, en général
// bien avant que la page Installation ne soit affichée. Il est donc capturé ici, au chargement
// du module, puis partagé avec les composants via useSyncExternalStore.
import { useSyncExternalStore } from 'react'

function detecterInstallee() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function detecterPlateforme() {
  if (typeof navigator === 'undefined') return { estIOS: false, estSafari: false, estAndroid: false }
  const ua = navigator.userAgent
  const estIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPadOS se présente comme un Mac
  const estSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua)
  const estAndroid = /android/i.test(ua)
  return { estIOS, estSafari, estAndroid }
}

let evenementInstallation = null
let etat = { installe: detecterInstallee(), peutInstaller: false, ...detecterPlateforme() }
const abonnes = new Set()

function publier(changements) {
  etat = { ...etat, ...changements }
  abonnes.forEach((notifier) => notifier())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // on garde l'invite native pour la déclencher depuis notre bouton
    evenementInstallation = e
    publier({ peutInstaller: true })
  })
  window.addEventListener('appinstalled', () => {
    evenementInstallation = null
    publier({ installe: true, peutInstaller: false })
  })
  window
    .matchMedia?.('(display-mode: standalone)')
    .addEventListener?.('change', () => publier({ installe: detecterInstallee() }))
}

function sAbonner(notifier) {
  abonnes.add(notifier)
  return () => abonnes.delete(notifier)
}

function lireEtat() {
  return etat
}

/** Déclenche l'invite native. Renvoie 'accepted', 'dismissed' ou 'indisponible'. */
export async function lancerInstallation() {
  const evenement = evenementInstallation
  if (!evenement) return 'indisponible'
  evenementInstallation = null // prompt() ne peut être appelé qu'une fois par événement
  publier({ peutInstaller: false })
  evenement.prompt()
  const { outcome } = await evenement.userChoice
  if (outcome === 'accepted') publier({ installe: true })
  return outcome
}

/**
 * État d'installation de la PWA.
 * @returns {{ installe: boolean, peutInstaller: boolean, estIOS: boolean, estSafari: boolean, estAndroid: boolean, lancerInstallation: () => Promise<string> }}
 */
export function usePwaInstall() {
  const etatCourant = useSyncExternalStore(sAbonner, lireEtat, lireEtat)
  return { ...etatCourant, lancerInstallation }
}
