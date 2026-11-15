// Bouton « Installer l'application » :
//  - invite native (Android, Chrome, Edge) quand le navigateur la propose ;
//  - lien vers le guide illustré de la page Installation sur iPhone / iPad ;
//  - rien du tout si l'application est déjà installée (mode standalone).
import { Link } from 'react-router-dom'
import { usePwaInstall } from '../usePwaInstall'

export default function BoutonInstaller({ taille, className = '' }) {
  const { installe, peutInstaller, lancerInstallation, estIOS } = usePwaInstall()

  if (installe) return null

  const classes = ['btn', 'btn-primary', taille ? `btn-${taille}` : '', className]
    .filter(Boolean)
    .join(' ')

  if (peutInstaller) {
    return (
      <button type="button" onClick={lancerInstallation} className={classes}>
        📲 Installer l'application
      </button>
    )
  }

  if (estIOS) {
    return (
      <Link to="/installation" className={classes}>
        📲 Installer sur iPhone / iPad
      </Link>
    )
  }

  return null
}
