// Briques de glisser-déposer des ressources (administrateurs), construites sur @dnd-kit.
// - ElementTriable : rend un élément déplaçable ; son contenu reçoit la « poignée » ⠿ à afficher.
// - ZoneDepot : zone où l'on peut lâcher une fiche (ex. « Sortir du dossier »).
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

/**
 * @param {{
 *   id: string, type: 'ressource' | 'dossier', element: object, actif: boolean, libelle: string,
 *   className?: string,
 *   children: (rendu: { poignee: import('react').ReactNode, survole: boolean }) => import('react').ReactNode
 * }} props
 */
export function ElementTriable({ id, type, element, actif, libelle, className = '', children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({ id, data: { type, element }, disabled: !actif })

  // Un dossier « survolé » par une fiche s'illumine : la lâcher la range dedans.
  const survole = type === 'dossier' && isOver && active?.data.current?.type === 'ressource'

  const poignee = actif ? (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Déplacer ${libelle}`}
      title="Glisser pour déplacer"
      className="touch-none cursor-grab active:cursor-grabbing select-none rounded px-1 text-lg leading-none text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-(--couleur-categorie)"
    >
      ⠿
    </button>
  ) : null

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isDragging ? 'relative z-20 opacity-80' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {children({ poignee, survole })}
    </div>
  )
}

/** @param {{ id: string, children: import('react').ReactNode }} props */
export function ZoneDepot({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: id } })
  return (
    <div
      ref={setNodeRef}
      className={`mb-4 rounded-xl border-2 border-dashed px-4 py-5 text-center font-medium transition-colors ${
        isOver
          ? 'border-(--couleur-categorie) bg-(--couleur-categorie)/20 text-text-inverse'
          : 'border-text-inverse/40 text-text-inverse/70'
      }`}
    >
      {children}
    </div>
  )
}
