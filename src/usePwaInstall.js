import { useEffect, useState } from 'react'

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installe, setInstalle] = useState(false)

  useEffect(() => {
    // Vérifie si l'application est déjà lancée en mode installé
    const estInstallee =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    setInstalle(estInstallee)

    function gererPrompt(e) {
      e.preventDefault()
      setPromptEvent(e)
    }

    function gererInstalle() {
      setInstalle(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', gererPrompt)
    window.addEventListener('appinstalled', gererInstalle)

    return () => {
      window.removeEventListener('beforeinstallprompt', gererPrompt)
      window.removeEventListener('appinstalled', gererInstalle)
    }
  }, [])

  async function lancerInstallation() {
    if (!promptEvent) return

    promptEvent.prompt()

    const { outcome } = await promptEvent.userChoice

    if (outcome === 'accepted') {
      setInstalle(true)
    }

    setPromptEvent(null)
  }

  return {
    peutInstaller: !!promptEvent,
    installe,
    lancerInstallation,
  }
}