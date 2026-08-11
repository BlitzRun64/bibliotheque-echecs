import { usePwaInstall } from '../usePwaInstall'


export default function Installation() {
  const { peutInstaller, installe, lancerInstallation } = usePwaInstall()

  return (
    <div className="max-w-2xl mx-auto p-4">

      <h1 className="text-2xl font-bold text-black mb-6">
        Installer l'application
      </h1>

      {installe && (
        <div className="bg-black/10 text-black border border-gray-300 rounded p-4 mb-6">
          ✓ L'application est déjà installée sur cet appareil.
        </div>
      )}

      {!installe && peutInstaller && (
        <div className="mb-8 text-center">
          <button
            onClick={lancerInstallation}
            className="bg-primary hover:bg-primary-light text-white rounded-lg px-6 py-3 font-semibold"
          >
            📲 Installer l'application
          </button>
        </div>
      )}

      {!installe && !peutInstaller && (
        <div className="bg-gray-100 rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-2">
            Installation manuelle
          </h2>

          <p className="text-sm text-gray-700 mb-4">
            L'installation automatique n'est pas disponible actuellement
            sur ce navigateur.
          </p>

          <p className="text-sm text-gray-700">
            Sur Chrome ou Edge, ouvre le menu du navigateur puis recherche
            l'option <strong>Installer l'application</strong> ou
            <strong> Ajouter à l'écran d'accueil</strong>.
          </p>
        </div>
      )}

    </div>
  )
}