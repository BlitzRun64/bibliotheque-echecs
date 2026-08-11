import { usePwaInstall } from '../usePwaInstall'

export default function Installation() {
  const { peutInstaller, installe, lancerInstallation } = usePwaInstall()
  const urlSite = window.location.origin
  const urlQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(urlSite)}`

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-heading mb-6">Installer l'application</h1>

      {installe && (
        <p className="admin-message mb-6">L'application est déjà installée sur cet appareil !</p>
      )}

      {peutInstaller && !installe && (
        <div className="mb-8 text-center">
          <button onClick={lancerInstallation} className="bg-primary hover:bg-primary-light text-white rounded-lg px-6 py-3 font-semibold">
            📲 Installer l'application maintenant
          </button>
        </div>
      )}

      <div className="mb-8 text-center">
        <p className="text-sm text-text-muted mb-3">Ou scanne ce QR code depuis ton téléphone :</p>
        <img src={urlQrCode} alt="QR code d'installation" className="mx-auto rounded border border-secondary-light" />
        <p className="text-xs text-text-muted mt-2">{urlSite}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="font-semibold text-text mb-2">📱 Sur Android (Chrome)</h2>
          <p className="text-sm text-text-muted">
            Utilise le bouton ci-dessus, ou dans Chrome : ⋮ (menu) → "Installer l'application".
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-text mb-2">🍎 Sur iPhone / iPad (Safari uniquement)</h2>
          <p className="text-sm text-text-muted">
            Ouvre ce lien dans <strong>Safari</strong> (pas Chrome), appuie sur l'icône de partage
            (carré avec une flèche vers le haut), puis "Sur l'écran d'accueil".
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-text mb-2">💻 Sur ordinateur (Chrome/Edge)</h2>
          <p className="text-sm text-text-muted">
            Utilise le bouton ci-dessus, ou clique sur l'icône d'installation dans la barre d'adresse
            (à droite, petite icône ⊕ ou écran avec flèche).
          </p>
        </div>
      </div>
    </div>
  )
}