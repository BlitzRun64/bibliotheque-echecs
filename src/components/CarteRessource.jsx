// Fiche d'une ressource : logo, nom (lien https ouvert dans un nouvel onglet), auteur,
// description dépliable. La description est affichée en texte simple, jamais injectée en HTML.
// La couleur de la catégorie vient de la variable CSS --couleur-categorie posée par SectionRessource.
import { useId, useState } from 'react'

/** @typedef {import('../types/ressources').Ressource} Ressource */

function nomDeDomaine(lien) {
  try {
    return new URL(lien).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * @param {{
 *   ressource: Ressource, estAdmin: boolean,
 *   onModifier: (r: Ressource) => void, onSupprimer: (r: Ressource) => void,
 *   dossiers?: import('../types/ressources').DossierRessource[],
 *   onDeplacer?: (r: Ressource, dossierId: number | null) => void,
 *   poignee?: import('react').ReactNode
 * }} props
 */
export default function CarteRessource({ ressource, estAdmin, onModifier, onSupprimer, dossiers = [], onDeplacer, poignee }) {
  const [ouvert, setOuvert] = useState(false)
  const idDescription = useId()
  const idDossier = useId()
  const description = (ressource.description ?? '').trim()
  const initiale = (ressource.titre || '?').trim().charAt(0).toUpperCase()
  const domaine = nomDeDomaine(ressource.lien)

  return (
    <article className="carte-ressource h-full p-4 flex gap-4">
      {poignee && <div className="-ml-2 -mr-2 self-start">{poignee}</div>}
      <div className="w-16 h-16 shrink-0 rounded-xl border-2 border-black/80 bg-surface-alt overflow-hidden flex items-center justify-center">
        {ressource.image_url ? (
          <img
            src={ressource.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-display font-bold text-(--couleur-categorie)" aria-hidden="true">
            {initiale}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-display font-semibold text-lg leading-tight">
          <a
            href={ressource.lien}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--couleur-categorie)"
          >
            {ressource.titre}
            <span aria-hidden="true" className="text-sm ml-1">↗</span>
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </h3>
        {ressource.auteur && <p className="text-sm text-text-muted">par {ressource.auteur}</p>}
        {domaine && <p className="text-xs text-text-muted/80 truncate">{domaine}</p>}

        {description && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2 -ml-2"
              aria-expanded={ouvert}
              aria-controls={idDescription}
              onClick={() => setOuvert((valeur) => !valeur)}
            >
              {ouvert ? 'Réduire' : 'Voir la description'}
              <span aria-hidden="true" className={`transition-transform ${ouvert ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <div id={idDescription} className="pliable" data-ouvert={ouvert} aria-hidden={!ouvert}>
              <div>
                <p className="text-sm text-text whitespace-pre-line pt-2">{description}</p>
              </div>
            </div>
          </>
        )}

        {estAdmin && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onModifier(ressource)}>
              ✏️ Modifier
            </button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onSupprimer(ressource)}>
              🗑️ Supprimer
            </button>
            {onDeplacer && (dossiers.length > 0 || ressource.dossier_id) && (
              <span className="inline-flex items-center gap-1 text-sm">
                <label htmlFor={idDossier}>📁</label>
                <select
                  id={idDossier}
                  className="rounded-lg border border-secondary-light bg-surface px-2 py-1 text-sm"
                  value={ressource.dossier_id ?? ''}
                  onChange={(e) => onDeplacer(ressource, e.target.value === '' ? null : Number(e.target.value))}
                  aria-label="Ranger dans un dossier"
                >
                  <option value="">Hors dossier</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
