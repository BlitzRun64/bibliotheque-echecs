// Page /ressources : menu des quatre catégories (grands boutons colorés).
import BandeauTitre from '../components/BandeauTitre'
import MenuCategories from '../components/MenuCategories'

export default function Ressources() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="bibliochess">
        <BandeauTitre titre="Ressources" />
        <p className="text-text-inverse/80 text-center mb-6">
          Chaînes, sites, études et spécialités sélectionnés par le club.
        </p>
        <MenuCategories />
      </div>
    </div>
  )
}
