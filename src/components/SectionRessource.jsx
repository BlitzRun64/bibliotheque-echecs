// Page d'une catégorie de ressources : titre illustré, liste des fiches et, pour les
// administrateurs, ajout / modification / suppression. Même structure pour les quatre
// catégories : seule la couleur change (variable CSS --couleur-categorie).
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BandeauTitre from './BandeauTitre'
import CarteRessource from './CarteRessource'
import FormulaireRessource from './FormulaireRessource'
import { useProfil } from '../useProfil'
import {
  ajouterRessource,
  chargerRessources,
  modifierRessource,
  supprimerImage,
  supprimerRessource,
  televerserImage,
} from '../services/ressources'

/** @param {{ categorie: import('../config/ressources').ConfigCategorie }} props */
export default function SectionRessource({ categorie }) {
  const { estAdmin } = useProfil()
  const [ressources, setRessources] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  // null : aucun formulaire ; 'ajout' : nouvelle fiche ; sinon la fiche en cours de modification.
  const [formulaire, setFormulaire] = useState(null)

  const charger = useCallback(
    () =>
      chargerRessources(categorie.id).then(({ data, error }) => {
        setErreur(error ? `Chargement impossible : ${error.message}` : '')
        setRessources(data ?? [])
        setChargement(false)
      }),
    [categorie.id],
  )

  useEffect(() => {
    charger()
  }, [charger])

  // Renvoie un message d'erreur à afficher dans le formulaire, ou rien si tout s'est bien passé.
  async function valider(valeurs, fichier) {
    setEnCours(true)
    try {
      let imageUrl = valeurs.image_url
      if (fichier) imageUrl = await televerserImage(fichier, categorie.id)

      const { error } =
        formulaire === 'ajout'
          ? await ajouterRessource({ ...valeurs, image_url: imageUrl })
          : await modifierRessource(formulaire.id, { ...valeurs, image_url: imageUrl })
      if (error) return `Enregistrement impossible : ${error.message}`

      // L'ancienne image devient inutile quand une nouvelle a été envoyée.
      if (formulaire !== 'ajout' && fichier && formulaire.image_url && formulaire.image_url !== imageUrl) {
        await supprimerImage(formulaire.image_url)
      }

      setMessage(formulaire === 'ajout' ? 'Ressource ajoutée.' : 'Ressource modifiée.')
      setFormulaire(null)
      charger()
    } catch (e) {
      return e.message
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(ressource) {
    if (!confirm(`Supprimer « ${ressource.titre} » ?`)) return
    const { error } = await supprimerRessource(ressource)
    if (error) {
      setMessage(`Suppression impossible : ${error.message}`)
      return
    }
    setMessage('Ressource supprimée.')
    charger()
  }

  return (
    <div className="bg-bg min-h-screen">
      <div className="bibliochess" style={{ '--couleur-categorie': `var(--color-${categorie.couleur})` }}>
        <BandeauTitre titre={categorie.libelle} image={categorie.image} />
        <p className="text-text-inverse/80 text-center mb-6">{categorie.description}</p>

        {estAdmin && formulaire === null && (
          <div className="mb-6 flex justify-end">
            <button type="button" className={`btn btn-${categorie.couleur}`} onClick={() => setFormulaire('ajout')}>
              ➕ Ajouter une ressource
            </button>
          </div>
        )}

        {estAdmin && formulaire === 'ajout' && (
          <div className="mb-6">
            <FormulaireRessource
              key="ajout"
              categorie={categorie}
              onValider={valider}
              onAnnuler={() => setFormulaire(null)}
              enCours={enCours}
            />
          </div>
        )}

        {message && (
          <p role="status" className="mb-4 text-sm bg-surface text-primary border border-primary rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        {chargement ? (
          <p className="text-text-inverse/70">Chargement…</p>
        ) : erreur ? (
          <p role="alert" className="text-danger-light font-medium">{erreur}</p>
        ) : ressources.length === 0 ? (
          <p className="text-text-inverse/70">Aucune ressource pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ressources.map((ressource) =>
              formulaire !== null && formulaire !== 'ajout' && formulaire.id === ressource.id ? (
                <div key={ressource.id} className="md:col-span-2">
                  <FormulaireRessource
                    key={ressource.id}
                    categorie={categorie}
                    initial={ressource}
                    onValider={valider}
                    onAnnuler={() => setFormulaire(null)}
                    enCours={enCours}
                  />
                </div>
              ) : (
                <CarteRessource
                  key={ressource.id}
                  ressource={ressource}
                  estAdmin={estAdmin}
                  onModifier={setFormulaire}
                  onSupprimer={supprimer}
                />
              ),
            )}
          </div>
        )}

        <p className="mt-8 text-center">
          <Link to="/ressources" className="btn btn-ghost text-text-inverse">
            ← Toutes les catégories
          </Link>
        </p>
      </div>
    </div>
  )
}
