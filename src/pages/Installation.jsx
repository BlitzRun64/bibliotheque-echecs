// Page Installation : bouton d'installation (invite native), guide illustré pour iPhone / iPad,
// instructions manuelles pour les autres navigateurs, et vérification des mises à jour.
import { useState } from 'react'
import BandeauTitre from '../components/BandeauTitre'
import BoutonInstaller from '../components/BoutonInstaller'
import { usePwaInstall } from '../usePwaInstall'
import { MESSAGES_MISE_A_JOUR, verifierMiseAJour } from '../miseAJourPwa'

const PROPRIETES_ICONE = {
  viewBox: '0 0 24 24',
  width: 28,
  height: 28,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

function IconeSafari() {
  return (
    <svg {...PROPRIETES_ICONE}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </svg>
  )
}

function IconePartager() {
  return (
    <svg {...PROPRIETES_ICONE}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
    </svg>
  )
}

function IconeAjouter() {
  return (
    <svg {...PROPRIETES_ICONE}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function IconeValide() {
  return (
    <svg {...PROPRIETES_ICONE}>
      <path d="M5 12l5 5 9-10" />
    </svg>
  )
}

function Etape({ numero, icone, titre, children }) {
  return (
    <li className="flex gap-4 items-start bg-surface-alt rounded-xl p-3">
      <span className="w-12 h-12 shrink-0 rounded-xl bg-primary text-text-inverse flex items-center justify-center">
        {icone}
      </span>
      <div>
        <p className="font-semibold">
          {numero}. {titre}
        </p>
        <p className="text-sm text-text-muted">{children}</p>
      </div>
    </li>
  )
}

// Guide illustré « Partager » → « Sur l'écran d'accueil » (Safari n'a pas de bouton d'installation).
function GuideIOS({ estSafari }) {
  const etapes = [
    ...(estSafari
      ? []
      : [
          {
            icone: <IconeSafari />,
            titre: 'Ouvrez cette page dans Safari',
            texte: "Sur iPhone et iPad, l'installation n'est possible que depuis Safari.",
          },
        ]),
    {
      icone: <IconePartager />,
      titre: 'Touchez le bouton Partager',
      texte: "Le carré avec une flèche vers le haut, en bas de l'écran (en haut à droite sur iPad).",
    },
    {
      icone: <IconeAjouter />,
      titre: "Choisissez « Sur l'écran d'accueil »",
      texte: 'Faites défiler la liste des actions si vous ne la voyez pas tout de suite.',
    },
    {
      icone: <IconeValide />,
      titre: 'Touchez « Ajouter »',
      texte: "BiblioChess apparaît sur votre écran d'accueil et s'ouvre en plein écran, comme une application.",
    },
  ]

  return (
    <ol className="grid gap-3">
      {etapes.map((etape, index) => (
        <Etape key={etape.titre} numero={index + 1} icone={etape.icone} titre={etape.titre}>
          {etape.texte}
        </Etape>
      ))}
    </ol>
  )
}

export default function Installation() {
  const { installe, peutInstaller, estIOS, estSafari } = usePwaInstall()
  const [etatMiseAJour, setEtatMiseAJour] = useState('')
  const [verificationEnCours, setVerificationEnCours] = useState(false)

  async function verifier() {
    setVerificationEnCours(true)
    setEtatMiseAJour('')
    const resultat = await verifierMiseAJour()
    setEtatMiseAJour(MESSAGES_MISE_A_JOUR[resultat])
    setVerificationEnCours(false)
  }

  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-2xl mx-auto p-4">
        <BandeauTitre titre="Installer l'application" />

        <section className="bg-surface text-text rounded-xl shadow-carte p-5 mb-6">
          {installe ? (
            <>
              <h2 className="font-display font-semibold text-xl mb-2">✓ L'application est installée</h2>
              <p className="text-sm text-text-muted">
                Vous utilisez BiblioChess en plein écran. Les nouvelles versions vous sont proposées
                automatiquement.
              </p>
            </>
          ) : peutInstaller ? (
            <>
              <h2 className="font-display font-semibold text-xl mb-2">Installer en un clic</h2>
              <p className="text-sm text-text-muted mb-4">
                Votre navigateur propose l'installation : l'application s'ouvrira ensuite depuis
                l'écran d'accueil, en plein écran.
              </p>
              <BoutonInstaller taille="lg" />
            </>
          ) : estIOS ? (
            <>
              <h2 className="font-display font-semibold text-xl mb-2">Sur iPhone et iPad</h2>
              <p className="text-sm text-text-muted mb-4">
                Safari ne propose pas de bouton d'installation : suivez ces étapes.
              </p>
              <GuideIOS estSafari={estSafari} />
            </>
          ) : (
            <>
              <h2 className="font-display font-semibold text-xl mb-2">Installation manuelle</h2>
              <p className="text-sm text-text-muted mb-3">
                Votre navigateur ne propose pas l'installation automatique pour le moment (elle
                apparaît en général après une première visite, sur Chrome ou Edge).
              </p>
              <ul className="text-sm grid gap-2">
                <li>
                  <strong>Chrome, Edge (ordinateur)</strong> : icône d'installation à droite de la
                  barre d'adresse, ou menu ⋮ → « Installer BiblioChess ».
                </li>
                <li>
                  <strong>Chrome (Android)</strong> : menu ⋮ → « Ajouter à l'écran d'accueil » ou
                  « Installer l'application ».
                </li>
                <li>
                  <strong>Firefox (Android)</strong> : menu ⋮ → « Ajouter à l'écran d'accueil ».
                </li>
              </ul>
            </>
          )}
        </section>

        <section className="bg-surface text-text rounded-xl shadow-carte p-5">
          <h2 className="font-display font-semibold text-xl mb-2">Mises à jour</h2>
          <p className="text-sm text-text-muted mb-4">
            Quand une nouvelle version est publiée, un bandeau « Nouvelle version disponible »
            apparaît en bas de l'écran : touchez « Mettre à jour ». Vous pouvez aussi vérifier dès
            maintenant.
          </p>
          <button type="button" className="btn btn-secondary" onClick={verifier} disabled={verificationEnCours}>
            {verificationEnCours ? 'Vérification…' : '🔄 Vérifier les mises à jour'}
          </button>
          {etatMiseAJour && (
            <p role="status" className="mt-3 text-sm text-text-muted">
              {etatMiseAJour}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
