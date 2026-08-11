import { useEffect, useState } from 'react'

export function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installe, setInstalle] = useState(false)

  useEffect(() => {
    function gererPrompt(e) {
      e.preventDefault()
      setPromptEvent(e)
    }
    window.addEventListener('beforeinstallprompt', gererPrompt)

    function gererInstalle() {
      setInstalle(true)
      setPromptEvent(null)
    }
    window.addEventListener('appinstalled', gererInstalle)

    return () => {
      window.removeEventListener('beforeinstallprompt', gererPrompt)
      window.removeEventListener('appinstalled', gererInstalle)
    }
  }, [])

  async function lancerInstallation() {
    if (!promptEvent) return
    promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  return { peutInstaller: !!promptEvent, installe, lancerInstallation }
}