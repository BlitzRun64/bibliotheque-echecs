// src/components/UpdatePrompt.jsx
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Vérifie s'il y a une nouvelle version toutes les heures
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 z-50">
      <span className="text-sm">Nouvelle version disponible</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-3 py-1"
      >
        Actualiser
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-gray-400 text-sm"
      >
        ✕
      </button>
    </div>
  )
}