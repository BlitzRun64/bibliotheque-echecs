// Page d'une catégorie de ressources : titre illustré, dossiers, liste des fiches et, pour les
// administrateurs, ajout / modification / suppression, dossiers (créer, renommer, supprimer,
// ranger, sortir) et ordre d'affichage par glisser-déposer (poignée ⠿).
// Même structure pour les quatre catégories : seule la couleur change (variable CSS --couleur-categorie).
// Le dossier ouvert est dans l'URL (?dossier=<id>) : le bouton « retour » du navigateur le referme.
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import BandeauTitre from './BandeauTitre'
import CarteRessource from './CarteRessource'
import DossierRessource from './DossierRessource'
import FormulaireRessource from './FormulaireRessource'
import { ElementTriable, ZoneDepot } from './Triable'
import { detecterCollision } from './detecterCollision'
import { IMAGE_DOSSIER } from '../config/ressources'
import { useProfil } from '../useProfil'
import {
  ajouterDossier,
  ajouterRessource,
  chargerDossiers,
  chargerRessources,
  deplacerRessource,
  enregistrerOrdre,
  modifierRessource,
  renommerDossier,
  supprimerDossier,
  supprimerImage,
  supprimerRessource,
  televerserImage,
} from '../services/ressources'

const cleRessource = (r) => `r-${r.id}`
const cleDossier = (d) => `d-${d.id}`
const dansDossier = (dossierId) => (r) => (r.dossier_id ?? null) === dossierId
// Tri stable par position : à égalité, l'ordre précédent (le plus récent d'abord) est conservé.
const trierParOrdre = (liste) => [...liste].sort((a, b) => a.ordre - b.ordre)
const positionSuivante = (liste) => liste.reduce((max, e) => Math.max(max, e.ordre), 0) + 1

/** Petit formulaire d'une ligne pour nommer un dossier. */
function FormulaireNom({ initial = '', libelle, onValider, onAnnuler }) {
  const [nom, setNom] = useState(initial)
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (nom.trim()) onValider(nom)
      }}
    >
      <input
        autoFocus
        value={nom}
        maxLength={60}
        onChange={(e) => setNom(e.target.value)}
        aria-label={libelle}
        placeholder="Nom du dossier"
        className="rounded-lg border border-secondary-light bg-surface px-3 py-1.5 text-text"
      />
      <button type="submit" className="btn btn-primary btn-sm" disabled={!nom.trim()}>
        Valider
      </button>
      <button type="button" className="btn btn-ghost btn-sm text-text-inverse" onClick={onAnnuler}>
        Annuler
      </button>
    </form>
  )
}

/** @param {{ categorie: import('../config/ressources').ConfigCategorie }} props */
export default function SectionRessource({ categorie }) {
  const { estAdmin } = useProfil()
  const [ressources, setRessources] = useState([])
  const [dossiers, setDossiers] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [message, setMessage] = useState('')
  const [enCours, setEnCours] = useState(false)
  // null : aucun formulaire ; 'ajout' : nouvelle fiche ; sinon la fiche en cours de modification.
  const [formulaire, setFormulaire] = useState(null)
  // Formulaire de nom de dossier : null, 'nouveau' ou 'renommer'.
  const [saisieDossier, setSaisieDossier] = useState(null)
  const [glisseEnCours, setGlisseEnCours] = useState(false)
  const [parametres, setParametres] = useSearchParams()

  const capteurs = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const charger = useCallback(
    () =>
      Promise.all([chargerRessources(categorie.id), chargerDossiers(categorie.id)]).then(
        ([fiches, listeDossiers]) => {
          setErreur(fiches.error ? `Chargement impossible : ${fiches.error.message}` : '')
          // Sans dossiers (ex. supabase/dossiers_ressources.sql pas encore exécuté), les fiches restent affichées.
          if (listeDossiers.error) console.warn('Dossiers non chargés :', listeDossiers.error.message)
          setRessources(fiches.data ?? [])
          setDossiers(listeDossiers.data ?? [])
          setChargement(false)
        },
      ),
    [categorie.id],
  )

  useEffect(() => {
    charger()
  }, [charger])

  const dossierOuvert = dossiers.find((d) => d.id === Number(parametres.get('dossier'))) ?? null
  const idDossierOuvert = dossierOuvert?.id ?? null
  const fichesVisibles = ressources.filter(dansDossier(idDossierOuvert))
  // Les visiteurs ne voient pas les dossiers vides ; les administrateurs, si (pour les remplir).
  const dossiersVisibles = idDossierOuvert
    ? []
    : dossiers.filter((d) => estAdmin || ressources.some(dansDossier(d.id)))
  const glisserActif = estAdmin && formulaire === null

  function ouvrirDossier(id) {
    setFormulaire(null)
    setSaisieDossier(null)
    setMessage('')
    setParametres(id ? { dossier: String(id) } : {})
  }

  function signalerEchec(texte, error) {
    setMessage(`${texte} : ${error.message}`)
    charger()
  }

  // ----- Fiches : ajout, modification, suppression -----

  // Renvoie un message d'erreur à afficher dans le formulaire, ou rien si tout s'est bien passé.
  async function valider(valeurs, fichier) {
    setEnCours(true)
    try {
      let imageUrl = valeurs.image_url
      if (fichier) imageUrl = await televerserImage(fichier, categorie.id)

      // Une nouvelle fiche se place à la fin du dossier ouvert (ou de la racine).
      const { error } =
        formulaire === 'ajout'
          ? await ajouterRessource(
              { ...valeurs, image_url: imageUrl },
              { dossier_id: idDossierOuvert, ordre: positionSuivante(fichesVisibles) },
            )
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

  // ----- Rangement : dossiers et ordre -----

  async function ranger(ressource, dossierId) {
    if ((ressource.dossier_id ?? null) === dossierId) return
    const ordre = positionSuivante(ressources.filter(dansDossier(dossierId)))
    setRessources((liste) =>
      trierParOrdre(liste.map((r) => (r.id === ressource.id ? { ...r, dossier_id: dossierId, ordre } : r))),
    )
    const { error } = await deplacerRessource(ressource.id, dossierId, ordre)
    if (error) return signalerEchec('Déplacement impossible', error)
    const dossier = dossiers.find((d) => d.id === dossierId)
    setMessage(
      dossier ? `« ${ressource.titre} » rangée dans « ${dossier.nom} ».` : `« ${ressource.titre} » sortie du dossier.`,
    )
  }

  async function reordonner(type, liste, de, vers) {
    const nouvelle = arrayMove(liste, de, vers)
    const positions = new Map(nouvelle.map((e, index) => [e.id, index + 1]))
    const renumeroter = (e) => (positions.has(e.id) ? { ...e, ordre: positions.get(e.id) } : e)
    if (type === 'dossier') setDossiers(nouvelle.map(renumeroter))
    else setRessources((toutes) => trierParOrdre(toutes.map(renumeroter)))

    const { error } = await enregistrerOrdre(type === 'dossier' ? 'dossiers_ressources' : 'ressources', nouvelle)
    if (error) signalerEchec('Ordre non enregistré', error)
  }

  function finDuGlisser({ active, over }) {
    setGlisseEnCours(false)
    if (!over || active.id === over.id) return
    const deplace = active.data.current
    const cible = over.data.current
    if (deplace.type === 'ressource' && cible?.type === 'dossier') return ranger(deplace.element, cible.element.id)
    if (deplace.type === 'ressource' && cible?.type === 'sortie') return ranger(deplace.element, null)
    if (deplace.type !== cible?.type) return

    const liste = deplace.type === 'dossier' ? dossiersVisibles : fichesVisibles
    const cle = deplace.type === 'dossier' ? cleDossier : cleRessource
    const de = liste.findIndex((e) => cle(e) === active.id)
    const vers = liste.findIndex((e) => cle(e) === over.id)
    if (de !== -1 && vers !== -1) reordonner(deplace.type, liste, de, vers)
  }

  async function creerDossier(nom) {
    const { data, error } = await ajouterDossier(categorie.id, nom, positionSuivante(dossiers))
    if (error) return setMessage(`Création impossible : ${error.message}`)
    setDossiers((liste) => [...liste, data])
    setSaisieDossier(null)
    setMessage(`Dossier « ${data.nom} » créé. Glissez-y des ressources avec la poignée ⠿.`)
  }

  async function renommer(nom) {
    const { error } = await renommerDossier(dossierOuvert.id, nom)
    if (error) return setMessage(`Renommage impossible : ${error.message}`)
    setDossiers((liste) => liste.map((d) => (d.id === dossierOuvert.id ? { ...d, nom: nom.trim() } : d)))
    setSaisieDossier(null)
    setMessage('Dossier renommé.')
  }

  async function supprimerLeDossier() {
    const dossier = dossierOuvert
    const contenu = ressources.filter(dansDossier(dossier.id))
    const avertissement = contenu.length
      ? `\nSes ${contenu.length} ressource(s) ne sont pas supprimées : elles reviennent hors dossier.`
      : ''
    if (!confirm(`Supprimer le dossier « ${dossier.nom} » ?${avertissement}`)) return

    // Les fiches ressortent à la fin de la liste principale, dans leur ordre actuel.
    const depart = positionSuivante(ressources.filter(dansDossier(null)))
    const sorties = await Promise.all(contenu.map((r, i) => deplacerRessource(r.id, null, depart + i)))
    const { error } = sorties.find((r) => r.error) ?? (await supprimerDossier(dossier.id))
    if (error) return signalerEchec('Suppression impossible', error)
    ouvrirDossier(null)
    setMessage(`Dossier « ${dossier.nom} » supprimé.`)
    charger()
  }

  // ----- Affichage -----

  const listeFiches = fichesVisibles.map((ressource) =>
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
      <ElementTriable
        key={ressource.id}
        id={cleRessource(ressource)}
        type="ressource"
        element={ressource}
        actif={glisserActif}
        libelle={ressource.titre}
      >
        {({ poignee }) => (
          <CarteRessource
            ressource={ressource}
            estAdmin={estAdmin}
            onModifier={setFormulaire}
            onSupprimer={supprimer}
            dossiers={dossiers}
            onDeplacer={ranger}
            poignee={poignee}
          />
        )}
      </ElementTriable>
    ),
  )

  return (
    <div className="bg-bg min-h-screen">
      <div className="bibliochess" style={{ '--couleur-categorie': `var(--color-${categorie.couleur})` }}>
        <BandeauTitre titre={categorie.libelle} image={categorie.image} />
        <p className="text-text-inverse/80 text-center mb-6">{categorie.description}</p>

        {dossierOuvert && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button type="button" className="btn btn-ghost text-text-inverse" onClick={() => ouvrirDossier(null)}>
              ← {categorie.libelle}
            </button>
            <img src={IMAGE_DOSSIER} alt="" className="h-10 w-10" style={{ imageRendering: 'pixelated' }} />
            {saisieDossier === 'renommer' ? (
              <FormulaireNom
                initial={dossierOuvert.nom}
                libelle="Nouveau nom du dossier"
                onValider={renommer}
                onAnnuler={() => setSaisieDossier(null)}
              />
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-text-inverse">{dossierOuvert.nom}</h2>
                {estAdmin && (
                  <span className="flex gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSaisieDossier('renommer')}>
                      ✏️ Renommer
                    </button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={supprimerLeDossier}>
                      🗑️ Supprimer le dossier
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {estAdmin && formulaire === null && (
          <div className="mb-6 flex flex-wrap justify-end gap-2">
            {!dossierOuvert &&
              (saisieDossier === 'nouveau' ? (
                <FormulaireNom libelle="Nom du nouveau dossier" onValider={creerDossier} onAnnuler={() => setSaisieDossier(null)} />
              ) : (
                <button type="button" className="btn btn-secondary" onClick={() => setSaisieDossier('nouveau')}>
                  📁 Nouveau dossier
                </button>
              ))}
            <button type="button" className={`btn btn-${categorie.couleur}`} onClick={() => setFormulaire('ajout')}>
              ➕ Ajouter une ressource{dossierOuvert ? ' ici' : ''}
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
        ) : (
          <DndContext
            sensors={capteurs}
            collisionDetection={detecterCollision}
            onDragStart={() => setGlisseEnCours(true)}
            onDragCancel={() => setGlisseEnCours(false)}
            onDragEnd={finDuGlisser}
          >
            {dossierOuvert && glisseEnCours && <ZoneDepot id="sortie">⬆ Lâcher ici pour sortir du dossier</ZoneDepot>}

            {dossiersVisibles.length > 0 && (
              <SortableContext items={dossiersVisibles.map(cleDossier)} strategy={rectSortingStrategy}>
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {dossiersVisibles.map((dossier) => (
                    <ElementTriable
                      key={dossier.id}
                      id={cleDossier(dossier)}
                      type="dossier"
                      element={dossier}
                      actif={glisserActif}
                      libelle={`le dossier ${dossier.nom}`}
                    >
                      {({ poignee, survole }) => (
                        <DossierRessource
                          dossier={dossier}
                          nombre={ressources.filter(dansDossier(dossier.id)).length}
                          poignee={poignee}
                          survole={survole}
                          onOuvrir={() => ouvrirDossier(dossier.id)}
                        />
                      )}
                    </ElementTriable>
                  ))}
                </div>
              </SortableContext>
            )}

            {fichesVisibles.length === 0 ? (
              <p className="text-text-inverse/70">
                {dossierOuvert
                  ? 'Ce dossier est vide.'
                  : dossiersVisibles.length === 0 && 'Aucune ressource pour le moment.'}
              </p>
            ) : (
              <SortableContext items={fichesVisibles.map(cleRessource)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{listeFiches}</div>
              </SortableContext>
            )}
          </DndContext>
        )}

        {estAdmin && !chargement && !erreur && (
          <p className="mt-4 text-sm text-text-inverse/60">
            Astuce : la poignée ⠿ déplace une fiche ou un dossier. Lâchez une fiche sur un dossier pour l'y ranger.
          </p>
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
