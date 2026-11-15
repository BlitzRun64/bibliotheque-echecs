// Menu des quatre catégories de ressources : grands boutons colorés.
// Page /ressources, surtout utilisée sur mobile (sur ordinateur, le sous-menu de la barre
// de navigation mène directement à chaque catégorie).
import { Link } from 'react-router-dom'
import { CATEGORIES, cheminCategorie } from '../config/ressources'

export default function MenuCategories() {
  return (
    <nav aria-label="Catégories de ressources" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CATEGORIES.map((categorie) => (
        <Link
          key={categorie.id}
          to={cheminCategorie(categorie.id)}
          className={`btn btn-${categorie.couleur} btn-lg w-full min-h-28 sm:min-h-36 flex-col gap-2 whitespace-normal text-lg rounded-2xl`}
        >
          <img
            src={categorie.image}
            alt=""
            aria-hidden="true"
            className="w-14 h-14 rounded-xl border-[3px] border-black object-cover bg-surface"
          />
          <span>{categorie.libelle}</span>
        </Link>
      ))}
    </nav>
  )
}
