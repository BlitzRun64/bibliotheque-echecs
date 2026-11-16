// Détection de cible pendant le glisser-déposer des ressources (voir Triable.jsx) :
// une fiche lâchée SUR un dossier (ou sur la zone « Sortir du dossier ») y va ; sinon on
// réordonne uniquement parmi les éléments du même type (fiches entre elles, dossiers entre eux).
import { closestCenter, pointerWithin } from '@dnd-kit/core'

const CIBLES_DE_FICHE = ['dossier', 'sortie']

export function detecterCollision(args) {
  const type = args.active.data.current?.type
  if (type === 'ressource') {
    const cibles = args.droppableContainers.filter((c) => CIBLES_DE_FICHE.includes(c.data.current?.type))
    const sousPointeur = pointerWithin({ ...args, droppableContainers: cibles })
    if (sousPointeur.length > 0) return sousPointeur
  }
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === type),
  })
}
