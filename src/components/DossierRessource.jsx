// Vignette d'un dossier de ressources : illustration pixel art (IMAGE_DOSSIER), nom et
// nombre de fiches. Un clic l'ouvre. Pour les administrateurs : poignée ⠿ pour le déplacer,
// et il s'illumine quand on y glisse une fiche.
import { IMAGE_DOSSIER } from '../config/ressources'

/**
 * @param {{
 *   dossier: import('../types/ressources').DossierRessource, nombre: number,
 *   poignee: import('react').ReactNode, survole: boolean, onOuvrir: () => void
 * }} props
 */
export default function DossierRessource({ dossier, nombre, poignee, survole, onOuvrir }) {
  return (
    <div
      className={`relative h-full rounded-xl p-2 transition-transform ${
        survole ? 'scale-110 bg-(--couleur-categorie)/25 ring-2 ring-(--couleur-categorie)' : ''
      }`}
    >
      {poignee && <div className="absolute top-1 right-1 z-10 rounded bg-surface/90">{poignee}</div>}
      <button
        type="button"
        onClick={onOuvrir}
        className="group flex w-full flex-col items-center gap-1 rounded-lg p-1 text-center focus-visible:outline-2 focus-visible:outline-(--couleur-categorie)"
      >
        <img
          src={IMAGE_DOSSIER}
          alt=""
          draggable="false"
          className="h-20 w-20 transition-transform group-hover:-translate-y-1"
          style={{ imageRendering: 'pixelated' }}
        />
        <span className="font-display font-semibold leading-tight text-text-inverse break-words w-full">
          {dossier.nom}
        </span>
        <span className="text-xs text-text-inverse/70">
          {nombre} ressource{nombre > 1 ? 's' : ''}
        </span>
      </button>
    </div>
  )
}
