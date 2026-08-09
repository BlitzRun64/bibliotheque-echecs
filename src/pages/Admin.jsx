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
  const [delais, setDelais] = useState({})
  const [livreAttribution, setLivreAttribution] = useState(null)
  const [rechercheUtilisateur, setRechercheUtilisateur] = useState('')
  const [resultatsUtilisateurs, setResultatsUtilisateurs] = useState([])
  const [delaiAttribution, setDelaiAttribution] = useState('')
  const [livreHistorique, setLivreHistorique] = useState(null)
  const [evenements, setEvenements] = useState([])
  const [messageAdmin, setMessageAdmin] = useState('')
  const [previewImage, setPreviewImage] = useState(null)
  const [previewEdition, setPreviewEdition] = useState(null)

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
    const { error } = await supabase.storage.from('couvertures').upload(nomFichier, fichier)
    if (error) {
      setMessageAdmin('Erreur upload image : ' + error.message)
      return null
    }
    const { data } = supabase.storage.from('couvertures').getPublicUrl(nomFichier)
    return data.publicUrl
  }

  async function ajouterLivre(e) {
    e.preventDefault()
    let urlFinale = nouveauLivre.couverture_url
    if (fichierImage) {
      const urlUploadee = await uploaderImage(fichierImage)
      if (urlUploadee) urlFinale = urlUploadee
    }
    const { data, error } = await supabase.from('livres').insert({
      ...nouveauLivre,
      couverture_url: urlFinale,
    }).select().single()

    if (error) {
      setMessageAdmin('Erreur ajout livre : ' + error.message)
      console.error(error)
      return
    }
    setMessageAdmin('Livre ajouté avec succès !')
    await enregistrerEvenement(data.id, 'ajout', `Livre ajouté : ${data.titre}`)
    setNouveauLivre({ titre: '', auteur: '', theme: '', couverture_url: '' })
    setFichierImage(null)
    setPreviewImage(null)
    chargerLivres()
  }

  async function supprimerLivre(id) {
    await supabase.from('livres').delete().eq('id', id)
    chargerLivres()
  }

  async function marquerCommeRendu(id) {
    await supabase.from('livres').update({ disponible: true, emprunteur_nom: null }).eq('id', id)
    await supabase.from('prets').update({ date_retour: new Date().toISOString() }).eq('livre_id', id).is('date_retour', null)
    await enregistrerEvenement(id, 'retour', 'Livre rendu')
    chargerLivres()
  }

  async function definirDelai(livreId, dateStr) {
    const dateISO = dateStr ? new Date(dateStr).toISOString() : null
    await supabase.from('livres').update({ date_limite: dateISO }).eq('id', livreId)
    await supabase.from('prets').update({ date_limite: dateISO }).eq('livre_id', livreId).is('date_retour', null)
    await enregistrerEvenement(livreId, 'delai_modifie', dateStr ? `Délai fixé au ${new Date(dateStr).toLocaleDateString('fr-FR')}` : 'Délai supprimé')
    chargerLivres()
  }

  function commencerEdition(livre) {
    setLivreEnEdition(livre.id)
    setEdition({ titre: livre.titre, auteur: livre.auteur, theme: livre.theme || '', couverture_url: livre.couverture_url || '' })
    setFichierEdition(null)
    setPreviewEdition(null)
  }

  async function chercherUtilisateurs(texte) {
    setRechercheUtilisateur(texte)
    if (texte.trim().length < 2) { setResultatsUtilisateurs([]); return }
    const { data } = await supabase.from('profils').select('id, nom').ilike('nom', `%${texte}%`).limit(6)
    setResultatsUtilisateurs(data || [])
  }

  async function attribuerLivre(livreId, utilisateur) {
    const dateISO = delaiAttribution ? new Date(delaiAttribution).toISOString() : null
    await supabase.from('livres').update({
      disponible: false, emprunteur_nom: utilisateur.nom,
      date_emprunt: new Date().toISOString(), date_limite: dateISO,
    }).eq('id', livreId)
    await supabase.from('prets').insert({
      livre_id: livreId, utilisateur_id: utilisateur.id, nom_emprunteur: utilisateur.nom,
      date_debut: new Date().toISOString(), date_limite: dateISO,
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
    const { error } = await supabase.from('livres').update({ ...edition, couverture_url: urlFinale }).eq('id', id)
    if (error) {
      setMessageAdmin('Erreur modification : ' + error.message)
      return
    }
    setMessageAdmin('Livre modifié avec succès !')
    setLivreEnEdition(null)
    setPreviewEdition(null)
    await enregistrerEvenement(id, 'modification', `Fiche modifiée : ${edition.titre}`)
    chargerLivres()
  }

  async function traiterDemande(demande, accepter, delai) {
    await supabase.from('demandes_emprunt').update({ statut: accepter ? 'acceptee' : 'refusee' }).eq('id', demande.id)
    if (accepter) {
      const dateLimiteISO = delai ? new Date(delai).toISOString() : null
      await enregistrerEvenement(demande.livre_id, 'emprunt', `Emprunté par ${demande.nom_demandeur}${dateLimiteISO ? ` (à rendre avant le ${new Date(dateLimiteISO).toLocaleDateString('fr-FR')})` : ''}`)
      await supabase.from('livres').update({
        disponible: false, emprunteur_nom: demande.nom_demandeur,
        date_emprunt: new Date().toISOString(), date_limite: dateLimiteISO,
      }).eq('id', demande.livre_id)
      await supabase.from('prets').insert({
        livre_id: demande.livre_id, utilisateur_id: demande.utilisateur_id || null,
        nom_emprunteur: demande.nom_demandeur, date_debut: new Date().toISOString(), date_limite: dateLimiteISO,
      })
    }
    chargerDemandes()
    chargerLivres()
  }

  async function voirHistorique(livreId) {
    if (livreHistorique === livreId) { setLivreHistorique(null); return }
    const { data } = await supabase.from('historique_livres').select('*').eq('livre_id', livreId).order('created_at', { ascending: false })
    setEvenements(data || [])
    setLivreHistorique(livreId)
  }

  async function enregistrerEvenement(livreId, type, description) {
    await supabase.from('historique_livres').insert({ livre_id: livreId, type_evenement: type, description })
  }

  return (
    <div className="admin-page max-w-4xl mx-auto p-4">
      <h1 className="admin-titre">Administration</h1>

      {messageAdmin && <p className="admin-message">{messageAdmin}</p>}

      <section className="mb-8">
        <h2 className="admin-sous-titre">Demandes en attente</h2>
        {demandes.length === 0 && <p className="admin-texte-discret">Aucune demande</p>}
        {demandes.map((d) => (
          <div key={d.id} className="admin-carte mb-2 flex flex-wrap justify-between items-center gap-2">
            <span className="text-admin-text">
              {d.nom_demandeur} veut emprunter <strong>{d.livres?.titre}</strong>
            </span>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={delais[d.id] || ''}
                onChange={(e) => setDelais({ ...delais, [d.id]: e.target.value })}
                className="admin-input"
                title="Délai de retour (optionnel)"
              />
              <button onClick={() => traiterDemande(d, true, delais[d.id])} className="admin-btn-primaire">
                Accepter
              </button>
              <button onClick={() => traiterDemande(d, false)} className="admin-btn-danger">
                Refuser
              </button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="admin-sous-titre">Gestion des livres</h2>
        <form onSubmit={ajouterLivre} className="flex flex-wrap gap-2 mb-4 items-center">
          <input placeholder="Titre" value={nouveauLivre.titre} onChange={(e) => setNouveauLivre({ ...nouveauLivre, titre: e.target.value })} className="admin-input" />
          <input placeholder="Auteur" value={nouveauLivre.auteur} onChange={(e) => setNouveauLivre({ ...nouveauLivre, auteur: e.target.value })} className="admin-input" />
          <input placeholder="Thème" value={nouveauLivre.theme} onChange={(e) => setNouveauLivre({ ...nouveauLivre, theme: e.target.value })} className="admin-input" />
          <input placeholder="URL de l'image (optionnel)" value={nouveauLivre.couverture_url} onChange={(e) => setNouveauLivre({ ...nouveauLivre, couverture_url: e.target.value })} className="admin-input" />
          <label className="admin-texte-discret">
            ou upload :
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const fichier = e.target.files[0]
                setFichierImage(fichier)
                setPreviewImage(fichier ? URL.createObjectURL(fichier) : null)
              }}
              className="text-sm ml-1"
            />
          </label>
          <button className="admin-btn-primaire">Ajouter</button>

          {(previewImage || nouveauLivre.couverture_url) && (
            <img src={previewImage || nouveauLivre.couverture_url} alt="Aperçu" className="w-20 h-28 object-cover rounded border border-admin-border mb-4" />
          )}
        </form>

        {livres.map((l) => {
          const enRetard = !l.disponible && l.date_limite && new Date(l.date_limite) < new Date()
          return (
            <div key={l.id} className="admin-ligne">
              {livreEnEdition === l.id ? (
                <div className="admin-carte flex flex-wrap gap-2 items-center">
                  <input value={edition.titre} onChange={(e) => setEdition({ ...edition, titre: e.target.value })} placeholder="Titre" className="admin-input" />
                  <input value={edition.auteur} onChange={(e) => setEdition({ ...edition, auteur: e.target.value })} placeholder="Auteur" className="admin-input" />
                  <input value={edition.theme} onChange={(e) => setEdition({ ...edition, theme: e.target.value })} placeholder="Thème" className="admin-input" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const fichier = e.target.files[0]
                      setFichierEdition(fichier)
                      setPreviewEdition(fichier ? URL.createObjectURL(fichier) : null)
                    }}
                    className="text-xs text-admin-text"
                  />
                  {(previewEdition || edition.couverture_url) && (
                    <img src={previewEdition || edition.couverture_url} alt="Aperçu" className="w-16 h-20 object-cover rounded border border-admin-border" />
                  )}
                  <button onClick={() => sauvegarderEdition(l.id)} className="admin-btn-primaire">Enregistrer</button>
                  <button onClick={() => setLivreEnEdition(null)} className="admin-btn-secondaire">Annuler</button>
                </div>
              ) : livreAttribution === l.id ? (
                <div className="admin-carte flex flex-col gap-2">
                  <p className="text-sm font-medium text-admin-text">Attribuer "{l.titre}" à :</p>
                  <input
                    placeholder="Rechercher un utilisateur..."
                    value={rechercheUtilisateur}
                    onChange={(e) => chercherUtilisateurs(e.target.value)}
                    className="admin-input"
                  />
                  {resultatsUtilisateurs.length > 0 && (
                    <div className="admin-carte-liste">
                      {resultatsUtilisateurs.map((u) => (
                        <button key={u.id} onClick={() => attribuerLivre(l.id, u)} className="admin-item-liste">
                          {u.nom}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    type="date"
                    value={delaiAttribution}
                    onChange={(e) => setDelaiAttribution(e.target.value)}
                    className="admin-input"
                    title="Délai de retour (optionnel)"
                  />
                  <button onClick={() => { setLivreAttribution(null); setRechercheUtilisateur(''); setResultatsUtilisateurs([]) }} className="admin-btn-secondaire text-left">
                    Annuler
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:grid sm:grid-cols-[2fr_2fr_auto] sm:items-center gap-2">
                    <span className="font-medium text-admin-text">{l.titre} — {l.auteur}</span>

                    <span>
                      {l.disponible ? (
                        <span className="text-admin-primary text-sm">(disponible)</span>
                      ) : enRetard ? (
                        <span className="white-space: pre-line">
                          <span className="text-admin-accent font-bold text-sm">
                            emprunté par {l.emprunteur_nom}
                          </span>
                          
                          <span className="text-admin-retarded font-bold text-sm">
                            <br/>
                            EN RETARD !!!
                          </span>
                        </span>
                      ) : (
                        <span className="text-admin-text-muted text-sm">
                          <span className="text-admin-accent font-bold text-sm">
                          (emprunté{l.emprunteur_nom ? ` par ${l.emprunteur_nom}` : ''}
                          <br/>
                          </span>
                          
                          {l.date_limite ? ` — à rendre avant le ${new Date(l.date_limite).toLocaleDateString('fr-FR')}` : ''})
                        </span>
                      )}
                    </span>

                    <div className="flex gap-3 items-center text-lg">
                      {l.disponible && (
                        <button onClick={() => setLivreAttribution(l.id)} title="Attribuer directement">🎁</button>
                      )}
                      {!l.disponible && (
                        <>
                          <input
                            type="date"
                            defaultValue={l.date_limite ? l.date_limite.slice(0, 10) : ''}
                            onChange={(e) => definirDelai(l.id, e.target.value)}
                            className="admin-input px-1 py-0.5 text-xs"
                            title="Modifier le délai"
                          />
                          <button onClick={() => voirHistorique(l.id)} title="Historique">🕓</button>
                          <button onClick={() => marquerCommeRendu(l.id)} title="Marquer comme rendu">📗</button>
                        </>
                      )}
                      <button onClick={() => commencerEdition(l)} title="Modifier">🔄️</button>
                      <button onClick={() => supprimerLivre(l.id)} title="Supprimer">🗑️</button>
                    </div>
                  </div>

                  {livreHistorique === l.id && (
                    <div className="admin-carte mt-2 text-xs max-h-40 overflow-y-auto">
                      {evenements.length === 0 ? (
                        <p className="text-admin-text-muted font-semibold">Aucun événement enregistré</p>
                      ) : (
                        evenements.map((ev) => (
                          <div key={ev.id} className="border-b border-admin-border py-1 last:border-0">
                            <span className="text-admin-text-muted font-semibold">
                              {new Date(ev.created_at).toLocaleString('fr-FR')}
                            </span>{' '}
                            <span className="text-admin-text">— {ev.description}</span>
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