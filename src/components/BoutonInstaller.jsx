import { useEffect, useState } from 'react'
export default function BoutonInstaller() {
  const [evenementInstall, setEvenementInstall] = useState(null)
  const [installee, setInstallee] = useState(false)

  const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallee(true)
    }

    const onPrompt = (e) => {
      e.preventDefault()
      setEvenementInstall(e)
    }
    const onInstalled = () => {
      setInstallee(true)
      setEvenementInstall(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function installer() {
    evenementInstall.prompt()
    await evenementInstall.userChoice
    setEvenementInstall(null)
  }

  if (installee) return null

  if (evenementInstall) {
    return (
      <button
        onClick={installer}
        className="bg-primary text-white text-sm px-3 py-2 rounded"
      >
        📲 Installer l'application
      </button>
    )
  }

  if (estIOS) {
    return (
      <p className="text-xs text-text-muted">
        Pour installer : bouton Partager, puis « Sur l'écran d'accueil ».
      </p>
    )
  }

  return null
}