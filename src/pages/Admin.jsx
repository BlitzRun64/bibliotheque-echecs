import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Admin() {
  const [livres, setLivres] = useState([])
  const [demandes, setDemandes] = useState([])
  const [nouveauLivre, setNouveauLivre] = useState({ titre: '', auteur: '', theme: '' })
  const [fichierImage, setFichierImage] = useState(null)
  const [livreEnEdition, setLivreEnEdition] = useState(null)
  const [edition, setEdition] = useState({ titre: '', auteur: '', theme: '', couverture_url: '' })
  const [fichierEdition, setFichierEdition] = useState(null)
  const [delais, setDelais] = useState({}) // { [demandeId]: 'YYYY-MM-DD' }
  const [livreAttribution, setLivreAttribution] = useState(null) // id du livre en cours d'attribution
  const [rechercheUtilisateur, setRechercheUtilisateur] = useState('')
  const [resultatsUtilisateurs, setResultatsUtilisateurs] = useState([])
  const [delaiAttribution, setDelaiAttribution] = useState('')
  const [livreHistorique, setLivreHistorique] = useState(null)
  const [evenements, setEvenements] = useState([])
  const [messageAdmin, setMessageAdmin] = useState('')

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
    setMessageAdmin('Erreur upload image : ' + error.message)
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

  const { data, error } = await supabase.from('livres').insert({
    ...nouveauLivre,
    couverture_url: urlFinale,
  })
  .select()
  .single()

  if (error) {
    alert('Erreur ajout livre : ' + error.message)
    console.error(error)
    return
  }
  setMessageAdmin('Livre ajouté avec succès !')

  await enregistrerEvenement(data.id, 'ajout', `Livre ajouté : ${data.titre}`)
  setNouveauLivre({ titre: '', auteur: '', theme: '', couverture_url: '' })
  setFichierImage(null)
  chargerLivres()
}

async function supprimerLivre(id) {
  await supabase.from('livres').delete().eq('id', id)
  chargerLivres()
}

async function marquerCommeRendu(id) {
  await supabase.from('livres').update({
    disponible: true,
    emprunteur_nom: null,
  }).eq('id', id)

  // Ferme le prêt actif correspondant (celui sans date de retour)
  await supabase
    .from('prets')
    .update({ date_retour: new Date().toISOString() })
    .eq('livre_id', id)
    .is('date_retour', null)

  await enregistrerEvenement(id, 'retour', 'Livre rendu')
  chargerLivres()
}

async function definirDelai(livreId, dateStr) {
  const dateISO = dateStr ? new Date(dateStr).toISOString() : null
  await supabase.from('livres').update({ date_limite: dateISO }).eq('id', livreId)
  await supabase
    .from('prets')
    .update({ date_limite: dateISO })
    .eq('livre_id', livreId)
    .is('date_retour', null)
  await enregistrerEvenement(livreId, 'delai_modifie', dateStr ? `Délai fixé au ${new Date(dateStr).toLocaleDateString('fr-FR')}` : 'Délai supprimé')
  chargerLivres()
}

function commencerEdition(livre) {
  setLivreEnEdition(livre.id)
  setEdition({
    titre: livre.titre,
    auteur: livre.auteur,
    theme: livre.theme || '',
    couverture_url: livre.couverture_url || '',
  })
  setFichierEdition(null)
}
async function chercherUtilisateurs(texte) {
  setRechercheUtilisateur(texte)
  if (texte.trim().length < 2) { setResultatsUtilisateurs([]); return }
  const { data } = await supabase
    .from('profils')
    .select('id, nom')
    .ilike('nom', `%${texte}%`)
    .limit(6)
  setResultatsUtilisateurs(data || [])
}

async function attribuerLivre(livreId, utilisateur) {
  const dateISO = delaiAttribution ? new Date(delaiAttribution).toISOString() : null

  await supabase.from('livres').update({
    disponible: false,
    emprunteur_nom: utilisateur.nom,
    date_emprunt: new Date().toISOString(),
    date_limite: dateISO,
  }).eq('id', livreId)

  await supabase.from('prets').insert({
    livre_id: livreId,
    utilisateur_id: utilisateur.id,
    nom_emprunteur: utilisateur.nom,
    date_debut: new Date().toISOString(),
    date_limite: dateISO,
  })

  setLivreAttribution(null)
  setRechercheUtilisateur('')
  setResultatsUtilisateurs([])
  setDelaiAttribution('')
  await enregistrerEvenement(livreId, 'attribution_directe', `Attribué directement à ${utilisateur.nom}${dateISO ? ` (à rendre avant le ${new Date(dateISO).toLocaleDateString('fr-FR')})` : ''}`)
  chargerLivres()
}

async function sauvegarderEdition(id) {
  let urlFinale = edition.couverture_url
  if (fichierEdition) {
    const urlUploadee = await uploaderImage(fichierEdition)
    if (urlUploadee) urlFinale = urlUploadee
  }
  const { error } = await supabase
    .from('livres')
    .update({ ...edition, couverture_url: urlFinale })
    .eq('id', id)
  if (error) {
    setMessageAdmin('Erreur modification : ' + error.message)
    return
  }
  setMessageAdmin('Livre modifié avec succès !')
  setLivreEnEdition(null)
  await enregistrerEvenement(id, 'modification', `Fiche modifiée : ${edition.titre}`)
  chargerLivres()
}
async function traiterDemande(demande, accepter, delai) {
  await supabase
    .from('demandes_emprunt')
    .update({ statut: accepter ? 'acceptee' : 'refusee' })
    .eq('id', demande.id)

  if (accepter) {
    const dateLimiteISO = delai ? new Date(delai).toISOString() : null
    await enregistrerEvenement(demande.livre_id, 'emprunt', `Emprunté par ${demande.nom_demandeur}${dateLimiteISO ? ` (à rendre avant le ${new Date(dateLimiteISO).toLocaleDateString('fr-FR')})` : ''}`)


    await supabase.from('livres').update({
      disponible: false,
      emprunteur_nom: demande.nom_demandeur,
      date_emprunt: new Date().toISOString(),
      date_limite: dateLimiteISO,
    }).eq('id', demande.livre_id)

    await supabase.from('prets').insert({
      livre_id: demande.livre_id,
      utilisateur_id: demande.utilisateur_id || null,
      nom_emprunteur: demande.nom_demandeur,
      date_debut: new Date().toISOString(),
      date_limite: dateLimiteISO,
    })
  }
  chargerDemandes()
  chargerLivres()
}

async function voirHistorique(livreId) {
  if (livreHistorique === livreId) { setLivreHistorique(null); return }
  const { data } = await supabase
    .from('historique_livres')
    .select('*')
    .eq('livre_id', livreId)
    .order('created_at', { ascending: false })
  setEvenements(data || [])
  setLivreHistorique(livreId)
}

async function enregistrerEvenement(livreId, type, description) {
  await supabase.from('historique_livres').insert({
    livre_id: livreId,
    type_evenement: type,
    description,
  })
}
return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Administration</h1>
      {messageAdmin && (
        <p className="mb-4 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded p-2">
           {messageAdmin}
        </p>
        )}
      <section className="mb-8">
        <h2 className="font-semibold mb-3">Demandes en attente</h2>
        {demandes.length === 0 && <p className="text-sm text-gray-500">Aucune demande</p>}
        {demandes.map((d) => (
          <div key={d.id} className="border rounded p-3 mb-2 flex flex-wrap justify-between items-center gap-2">
            <span>
              {d.nom_demandeur} veut emprunter <strong>{d.livres?.titre}</strong>
            </span>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={delais[d.id] || ''}
                onChange={(e) => setDelais({ ...delais, [d.id]: e.target.value })}
                className="border rounded px-2 py-1 text-sm"
                title="Délai de retour (optionnel)"
              />
              <button onClick={() => traiterDemande(d, true, delais[d.id])} className="bg-green-600 text-white rounded px-3 py-1 text-sm">
                Accepter
              </button>
              <button onClick={() => traiterDemande(d, false)} className="bg-red-600 text-white rounded px-3 py-1 text-sm">
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

        {livres.map((l) => {
          const enRetard = !l.disponible && l.date_limite && new Date(l.date_limite) < new Date()
          return (
            <div key={l.id} className="border-b py-2">
              {livreEnEdition === l.id ? (
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded">
                  <input value={edition.titre} onChange={(e) => setEdition({ ...edition, titre: e.target.value })} placeholder="Titre" className="border rounded px-2 py-1 text-sm" />
                  <input value={edition.auteur} onChange={(e) => setEdition({ ...edition, auteur: e.target.value })} placeholder="Auteur" className="border rounded px-2 py-1 text-sm" />
                  <input value={edition.theme} onChange={(e) => setEdition({ ...edition, theme: e.target.value })} placeholder="Thème" className="border rounded px-2 py-1 text-sm" />
                  <input type="file" accept="image/*" onChange={(e) => setFichierEdition(e.target.files[0])} className="text-xs" />
                  <button onClick={() => sauvegarderEdition(l.id)} className="bg-blue-600 text-white rounded px-3 py-1 text-sm">Enregistrer</button>
                  <button onClick={() => setLivreEnEdition(null)} className="text-gray-500 text-sm">Annuler</button>
                </div>
              ) : livreAttribution === l.id ? (
                <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
                  <p className="text-sm font-medium">Attribuer "{l.titre}" à :</p>
                  <input
                    placeholder="Rechercher un utilisateur..."
                    value={rechercheUtilisateur}
                    onChange={(e) => chercherUtilisateurs(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  {resultatsUtilisateurs.length > 0 && (
                    <div className="border rounded max-h-40 overflow-y-auto bg-white">
                      {resultatsUtilisateurs.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => attribuerLivre(l.id, u)}
                          className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100"
                        >
                          {u.nom}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="date"
                    value={delaiAttribution}
                    onChange={(e) => setDelaiAttribution(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                    title="Délai de retour (optionnel)"
                  />
                  <button onClick={() => { setLivreAttribution(null); setRechercheUtilisateur(''); setResultatsUtilisateurs([]) }} className="text-gray-500 text-sm text-left">
                    Annuler
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <span>
                      {l.titre} — {l.auteur}{' '}
                      {l.disponible ? (
                        <span className="text-green-600 text-sm">(disponible)</span>
                      ) : enRetard ? (
                        <span className="text-red-600 font-bold text-sm">
                          (emprunté par {l.emprunteur_nom}, EN RETARD !!!)
                        </span>
                      ) : (
                        <span className="text-red-600 text-sm">
                          (emprunté{l.emprunteur_nom ? ` par ${l.emprunteur_nom}` : ''}
                          {l.date_limite ? ` — à rendre avant le ${new Date(l.date_limite).toLocaleDateString('fr-FR')}` : ''})
                        </span>
                      )}
                    </span>

                    <div className="flex gap-3 items-center text-lg">
                      <button onClick={() => voirHistorique(l.id)} title="Historique">🕓</button>

                      {l.disponible && (
                        <button onClick={() => setLivreAttribution(l.id)} title="Attribuer directement">🎁</button>
                      )}
                      {!l.disponible && (
                        <>
                          <input
                            type="date"
                            defaultValue={l.date_limite ? l.date_limite.slice(0, 10) : ''}
                            onChange={(e) => definirDelai(l.id, e.target.value)}
                            className="border rounded px-1 py-0.5 text-xs"
                            title="Modifier le délai"
                          />
                          <button onClick={() => marquerCommeRendu(l.id)} title="Marquer comme rendu">📗</button>
                        </>
                      )}
                      <button onClick={() => commencerEdition(l)} title="Modifier">🔄️</button>
                      <button onClick={() => supprimerLivre(l.id)} title="Supprimer">🗑️</button>
                    </div>
                  </div>

                  {livreHistorique === l.id && (
                    <div className="bg-gray-50 rounded p-2 mt-2 text-xs max-h-40 overflow-y-auto">
                      {evenements.length === 0 ? (
                        <p className="text-gray-400">Aucun événement enregistré</p>
                      ) : (
                        evenements.map((ev) => (
                          <div key={ev.id} className="border-b py-1 last:border-0">
                            <span className="text-gray-400">
                              {new Date(ev.created_at).toLocaleString('fr-FR')}
                            </span>{' '}
                            — {ev.description}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}