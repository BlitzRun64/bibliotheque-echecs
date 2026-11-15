// Page /ressources/:categorie : fiches d'une catégorie (voir src/config/ressources.js).
import { Navigate, useParams } from 'react-router-dom'
import SectionRessource from '../components/SectionRessource'
import { trouverCategorie } from '../config/ressources'

export default function CategorieRessources() {
  const { categorie } = useParams()
  const config = trouverCategorie(categorie)

  if (!config) return <Navigate to="/ressources" replace />

  // La clé force un nouvel état (liste, formulaire) quand on passe d'une catégorie à l'autre.
  return <SectionRessource key={config.id} categorie={config} />
}
