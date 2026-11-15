// src/components/UpdatePrompt.jsx
// Enregistre le service worker et affiche « Nouvelle version disponible — Mettre à jour »
// quand une nouvelle version attend. Au clic : skipWaiting, puis rechargement de la page
// dès que le nouveau service worker prend le contrôle (événement « controlling »).
import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { planifierVerifications } from '../miseAJourPwa'

const DELAI_RECHARGEMENT_SECOURS = 5000

export default function UpdatePrompt() {
  const [miseAJourEnCours, setMiseAJourEnCours] = useState(false)
  const {
    needRefresh: [nouvelleVersion, setNouvelleVersion],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) planifierVerifications(registration)
    },
    onRegisterError(erreur) {
      console.error('Service worker : enregistrement impossible', erreur)
    },
  })

  // Filet de sécurité : si la page ne s'est pas rechargée d'elle-même, on force le rechargement
  // pour ne jamais rester bloqué sur l'ancien cache.
  useEffect(() => {
    if (!miseAJourEnCours) return
    const id = setTimeout(() => window.location.reload(), DELAI_RECHARGEMENT_SECOURS)
    return () => clearTimeout(id)
  }, [miseAJourEnCours])

  if (!nouvelleVersion) return null

  function mettreAJour() {
    setMiseAJourEnCours(true)
    updateServiceWorker(true)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:w-auto bg-primary text-text-inverse rounded-xl shadow-carte-survol px-4 py-3 flex flex-wrap items-center justify-center gap-3 z-50 border border-nav-text/30"
    >
      <span className="text-sm font-semibold">Nouvelle version disponible</span>
      <button
        type="button"
        onClick={mettreAJour}
        disabled={miseAJourEnCours}
        className="btn btn-secondary btn-sm"
      >
        {miseAJourEnCours ? 'Mise à jour…' : 'Mettre à jour'}
      </button>
      <button
        type="button"
        onClick={() => setNouvelleVersion(false)}
        className="btn btn-ghost btn-sm btn-icone"
        aria-label="Plus tard"
        title="Plus tard"
      >
        ✕
      </button>
    </div>
  )
}
