import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BandeauTitre from '../components/BandeauTitre'
import { useProfil } from '../useProfil'

export default function Bibliotheque() {
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [demandesEnAttente, setDemandesEnAttente] = useState([])
  const [demandeEnCours, setDemandeEnCours] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [imageAgrandie, setImageAgrandie] = useState(null)
  const { utilisateur, profil } = useProfil() // utilisateur null = pas connecté

  function chargerLivres() {
    return supabase
      .from('livres')
      .select('*')
      .order('titre')
      .then(({ data, error }) => {
        if (!error) setLivres(data)
      })
  }

  useEffect(() => {
    chargerLivres()
  }, [])

  useEffect(() => {
    if (!imageAgrandie) return
    const onKey = (e) => { if (e.key === 'Escape') setImageAgrandie(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imageAgrandie])

  async function envoyerDemande(livreId) {
    const nomFinal = utilisateur ? profil?.nom : nom.trim()
    const emailFinal = utilisateur ? utilisateur.email : email.trim()

    if (!nomFinal) { setMessage("Merci d'indiquer ton nom"); return }

    const { error } = await supabase.from('demandes_emprunt').insert({
      livre_id: livreId,
      nom_demandeur: nomFinal,
      email_demandeur: emailFinal,
      utilisateur_id: utilisateur ? utilisateur.id : null,
    })

    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage("Demande envoyée ! L'admin va la traiter.")
      setDemandesEnAttente([...demandesEnAttente, livreId])
      setDemandeEnCours(null)
      setNom('')
      setEmail('')
    }
  }

  const livresFiltres = livres.filter((l) => {
    const texte = recherche.toLowerCase()
    return (
      l.titre.toLowerCase().includes(texte) ||
      l.auteur.toLowerCase().includes(texte) ||
      (l.theme || '').toLowerCase().includes(texte)
    )
  })

  const total = livres.length
  const nbFiltres = livresFiltres.length

  return (
    <div className="bg-bg min-h-screen">
      {/* Bandeau animé : overflow-x-clip laisse la pièce sortir de l'écran sur mobile
          au lieu d'élargir la page (l'animation est en transform, voir .logo-perspective). */}
      <div className="bg-primary w-full flex justify-center py-4 overflow-x-clip">
        <div className="logo-perspective">
          <img src="/image/icon-192.png" alt="Logo" className="logo-3d w-40 h-40" />
        </div>
      </div>

      <div className="bibliochess">
        <BandeauTitre titre="Bibliothèque du club" />

        <div className="relative w-full max-w-md mb-6">
          <input
            type="text"
            placeholder="Rechercher par titre, auteur ou thème..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ pr-20"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
            {nbFiltres}/{total}
          </span>
        </div>

        {message && (
          <p role="status" className="mb-4 text-sm bg-surface text-primary border border-primary rounded-lg px-3 py-2">
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {livresFiltres.map((livre) => {
            const dejaDemande = demandesEnAttente.includes(livre.id)
            return (
              <div key={livre.id} className="bg-surface rounded-lg p-4 shadow-sm flex gap-4">
                {livre.couverture_url ? (
                  <div className="relative w-20 h-28 flex-shrink-0 border-2 border-black rounded overflow-hidden">
                    <img
                      src={livre.couverture_url}
                      alt={livre.titre}
                      loading="lazy"
                      decoding="async"
                      className="block w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageAgrandie(livre.couverture_url)}
                      aria-label="Agrandir l'image"
                      className="absolute bottom-1 right-1 rounded-full bg-black/60 text-white w-6 h-6 text-xs flex items-center justify-center"
                    >
                      ⤢
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-28 bg-surface-alt rounded flex-shrink-0 flex items-center justify-center text-text-muted text-xs text-center">
                    Pas d'image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-semibold text-text">{livre.titre}</h2>
                  <p className="text-sm text-text-muted">{livre.auteur}</p>
                  <p className="text-sm text-text-muted mb-2">{livre.theme}</p>
                  <span className={`text-xs px-2 py-1 rounded ${livre.disponible ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                    {livre.disponible ? 'Disponible' : 'Emprunté'}
                  </span>

                  {livre.disponible && !dejaDemande && (
                    <div className="mt-3">
                      {demandeEnCours === livre.id ? (
                        <div className="flex flex-col gap-2">
                          {utilisateur ? (
                            <p className="text-sm text-text-muted">
                              Demande au nom de <strong>{profil?.nom}</strong> ({utilisateur.email})
                            </p>
                          ) : (
                            <>
                              <input placeholder="Ton nom" value={nom} onChange={(e) => setNom(e.target.value)} className="champ" />
                              <input placeholder="Email (optionnel)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="champ" />
                            </>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => envoyerDemande(livre.id)} className="btn btn-primary btn-sm">
                              Confirmer la demande
                            </button>
                            <button type="button" onClick={() => setDemandeEnCours(null)} className="btn btn-ghost btn-sm">
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setDemandeEnCours(livre.id)} className="btn btn-secondary btn-sm">
                          Demander l'emprunt
                        </button>
                      )}
                    </div>
                  )}

                  {dejaDemande && (
                    <p className="mt-3 text-xs text-text-muted italic">Demande envoyée, en attente</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {imageAgrandie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setImageAgrandie(null)}
        >
          <button
            type="button"
            onClick={() => setImageAgrandie(null)}
            aria-label="Fermer"
            className="absolute right-4 top-4 text-3xl text-white"
          >
            ✕
          </button>
          <img
            src={imageAgrandie}
            alt="Couverture agrandie"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </div>
  )
}
