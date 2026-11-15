// Formulaire d'ajout / de modification d'une ressource (administrateurs uniquement).
// Vérifications côté client : nom obligatoire, lien en https://, image png / jpg / webp de 2 Mo max.
import { useEffect, useState } from 'react'
import { TYPES_IMAGE_ACCEPTES, estLienSur, verifierImage } from '../services/ressources'

/** @typedef {import('../types/ressources').Ressource} Ressource */

/**
 * @param {{
 *   categorie: import('../config/ressources').ConfigCategorie,
 *   initial?: Ressource | null,
 *   onValider: (valeurs: object, fichier: File | null) => Promise<string | void>,
 *   onAnnuler: () => void,
 *   enCours?: boolean,
 * }} props
 */
export default function FormulaireRessource({ categorie, initial = null, onValider, onAnnuler, enCours = false }) {
  const [valeurs, setValeurs] = useState(() => ({
    titre: initial?.titre ?? '',
    auteur: initial?.auteur ?? '',
    lien: initial?.lien ?? '',
    description: initial?.description ?? '',
  }))
  const [fichier, setFichier] = useState(null)
  const [apercu, setApercu] = useState(null)
  const [erreur, setErreur] = useState('')

  // Libère l'URL d'aperçu créée pour le fichier choisi.
  useEffect(() => {
    if (!apercu) return
    return () => URL.revokeObjectURL(apercu)
  }, [apercu])

  function changer(champ, valeur) {
    setValeurs((precedentes) => ({ ...precedentes, [champ]: valeur }))
    setErreur('')
  }

  function choisirFichier(e) {
    const choisi = e.target.files?.[0] ?? null
    if (!choisi) {
      setFichier(null)
      setApercu(null)
      return
    }
    const probleme = verifierImage(choisi)
    if (probleme) {
      setErreur(probleme)
      e.target.value = ''
      return
    }
    setFichier(choisi)
    setApercu(URL.createObjectURL(choisi))
    setErreur('')
  }

  async function soumettre(e) {
    e.preventDefault()
    if (!valeurs.titre.trim()) {
      setErreur('Indique un nom.')
      return
    }
    if (!estLienSur(valeurs.lien)) {
      setErreur('Le lien doit commencer par https://')
      return
    }
    const message = await onValider(
      { ...valeurs, categorie: categorie.id, image_url: initial?.image_url ?? null },
      fichier,
    )
    if (message) setErreur(message)
  }

  const imageAffichee = apercu ?? initial?.image_url ?? null

  return (
    <form
      onSubmit={soumettre}
      noValidate
      className="carte-ressource p-4 grid gap-3 sm:grid-cols-2"
      aria-label={initial ? 'Modifier la ressource' : 'Ajouter une ressource'}
    >
      <h3 className="sm:col-span-2 font-display font-semibold text-lg">
        {initial ? 'Modifier la ressource' : `Nouvelle ressource — ${categorie.libelle}`}
      </h3>

      <label className="grid gap-1 text-sm font-medium">
        Nom *
        <input
          className="champ"
          value={valeurs.titre}
          onChange={(e) => changer('titre', e.target.value)}
          maxLength={120}
          placeholder="Nom de la chaîne, du site, de l'étude…"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Auteur
        <input
          className="champ"
          value={valeurs.auteur}
          onChange={(e) => changer('auteur', e.target.value)}
          maxLength={120}
          placeholder="Qui l'a créé ?"
        />
      </label>

      <label className="sm:col-span-2 grid gap-1 text-sm font-medium">
        Lien (https:// uniquement) *
        <input
          className="champ"
          type="url"
          inputMode="url"
          value={valeurs.lien}
          onChange={(e) => changer('lien', e.target.value)}
          placeholder="https://…"
        />
      </label>

      <label className="sm:col-span-2 grid gap-1 text-sm font-medium">
        Description
        <textarea
          className="champ"
          rows={3}
          value={valeurs.description}
          onChange={(e) => changer('description', e.target.value)}
          maxLength={2000}
          placeholder="Quelques mots pour présenter la ressource (texte simple)."
        />
      </label>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Logo (png, jpg ou webp, 2 Mo max)
          <input
            type="file"
            accept={TYPES_IMAGE_ACCEPTES.join(',')}
            onChange={choisirFichier}
            className="text-sm"
          />
        </label>
        {imageAffichee && (
          <img
            src={imageAffichee}
            alt="Aperçu du logo"
            className="w-16 h-16 object-cover rounded-xl border-2 border-black"
          />
        )}
      </div>

      {erreur && (
        <p role="alert" className="sm:col-span-2 text-sm text-danger font-medium">
          {erreur}
        </p>
      )}

      <div className="sm:col-span-2 flex flex-wrap gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onAnnuler} disabled={enCours}>
          Annuler
        </button>
        <button type="submit" className={`btn btn-${categorie.couleur}`} disabled={enCours}>
          {enCours ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
