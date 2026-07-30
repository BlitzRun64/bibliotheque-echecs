import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Admin() {
  const [livres, setLivres] = useState([])
  const [demandes, setDemandes] = useState([])
  const [nouveauLivre, setNouveauLivre] = useState({ titre: '', auteur: '', theme: '' })
  const [fichierImage, setFichierImage] = useState(null)
  
  useEffect(() => {
    chargerLivres()
    chargerDemandes()
  }, [])

  async function chargerLivres() {
    const { data } = await supabase.from('livres').select('*').order('titre')
    setLivres(data || [])
  }

  async function chargerDemandes() {
    const { data } = await supabase
      .from('demandes_emprunt')
      .select('*, livres(titre)')
      .eq('statut', 'en_attente')
    setDemandes(data || [])
  }

async function uploaderImage(fichier) {
  const nomFichier = `${Date.now()}-${fichier.name}`
  const { error } = await supabase.storage
    .from('couvertures')
    .upload(nomFichier, fichier)

  if (error) {
    alert('Erreur upload image : ' + error.message)
    return null
  }

  const { data } = supabase.storage
    .from('couvertures')
    .getPublicUrl(nomFichier)

  return data.publicUrl
}

async function ajouterLivre(e) {
  e.preventDefault()

  let urlFinale = nouveauLivre.couverture_url

  // Si un fichier a été sélectionné, on l'upload et on récupère son URL
  if (fichierImage) {
    const urlUploadee = await uploaderImage(fichierImage)
    if (urlUploadee) urlFinale = urlUploadee
  }

  const { error } = await supabase.from('livres').insert({
    ...nouveauLivre,
    couverture_url: urlFinale,
  })

  if (error) {
    alert('Erreur ajout livre : ' + error.message)
    console.error(error)
    return
  }
  setNouveauLivre({ titre: '', auteur: '', theme: '', couverture_url: '' })
  setFichierImage(null)
  chargerLivres()
}

  async function supprimerLivre(id) {
    await supabase.from('livres').delete().eq('id', id)
    chargerLivres()
  }

  async function marquerCommeRendu(id) {
  await supabase
    .from('livres')
    .update({ disponible: true, emprunteur_nom: null })
    .eq('id', id)
  chargerLivres()
}

  async function traiterDemande(demande, accepter) {
  await supabase
    .from('demandes_emprunt')
    .update({ statut: accepter ? 'acceptee' : 'refusee' })
    .eq('id', demande.id)

  if (accepter) {
    await supabase
      .from('livres')
      .update({ disponible: false, emprunteur_nom: demande.nom_demandeur })
      .eq('id', demande.livre_id)
  }
  chargerDemandes()
  chargerLivres()
}

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Administration</h1>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">Demandes en attente</h2>
        {demandes.length === 0 && <p className="text-sm text-gray-500">Aucune demande</p>}
        {demandes.map((d) => (
          <div key={d.id} className="border rounded p-3 mb-2 flex justify-between items-center">
            <span>
              {d.nom_demandeur} veut emprunter <strong>{d.livres?.titre}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => traiterDemande(d, true)}
                className="bg-green-600 text-white rounded px-3 py-1 text-sm"
              >
                Accepter
              </button>
              <button
                onClick={() => traiterDemande(d, false)}
                className="bg-red-600 text-white rounded px-3 py-1 text-sm"
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold mb-3">Gestion des livres</h2>
        <form onSubmit={ajouterLivre} className="flex flex-wrap gap-2 mb-4 items-center">
          <input
            placeholder="Titre"
            value={nouveauLivre.titre}
            onChange={(e) => setNouveauLivre({ ...nouveauLivre, titre: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Auteur"
            value={nouveauLivre.auteur}
            onChange={(e) => setNouveauLivre({ ...nouveauLivre, auteur: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Thème"
            value={nouveauLivre.theme}
            onChange={(e) => setNouveauLivre({ ...nouveauLivre, theme: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="URL de l'image (optionnel)"
            value={nouveauLivre.couverture_url}
            onChange={(e) => setNouveauLivre({ ...nouveauLivre, couverture_url: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <label className="text-sm text-gray-600">
            ou upload :
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFichierImage(e.target.files[0])}
              className="text-sm ml-1"
            />
          </label>
          <button className="bg-blue-600 text-white rounded px-3 py-1">Ajouter</button>
      </form>

        {livres.map((l) => (
    <div key={l.id} className="flex justify-between items-center border-b py-2">
      <span>
        {l.titre} — {l.auteur}{' '}
        {l.disponible ? (
          <span className="text-green-600 text-sm">(disponible)</span>
        ) : (
          <span className="text-red-600 text-sm">
            (emprunté{l.emprunteur_nom ? ` par ${l.emprunteur_nom}` : ''})
          </span>
        )}
      </span>
      <div className="flex gap-2">
        {!l.disponible && (
          <button
            onClick={() => marquerCommeRendu(l.id)}
            className="bg-green-600 text-white rounded px-3 py-1 text-sm"
          >
            Marquer comme rendu
          </button>
        )}
        <button onClick={() => supprimerLivre(l.id)} className="text-red-600 text-sm">
          Supprimer
        </button>
      </div>
    </div>
  ))}
      </section>
    </div>
  )
}