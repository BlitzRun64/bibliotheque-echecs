import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'




  

export default function Bibliotheque() {
  const audioRef = useRef(null)
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [demandesEnAttente, setDemandesEnAttente] = useState([])
  const [demandeEnCours, setDemandeEnCours] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [utilisateur, setUtilisateur] = useState(null) // null = pas connecté
  const [profil, setProfil] = useState(null)
  const [visible, setVisible] = useState(true)
  const [imageAgrandie, setImageAgrandie] = useState(null)

 
  /*<option value="club1">Club 1 (contrasté)</option> */

  useEffect(() => {
    chargerLivres()
    chargerUtilisateur()
  }, [])

  useEffect(() => {
  if (!imageAgrandie) return
  const onKey = (e) => { if (e.key === 'Escape') setImageAgrandie(null) }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [imageAgrandie])

  function lancerMusique(){
   
    audioRef.current.play();
  }

  async function chargerLivres() {
    const { data, error } = await supabase.from('livres').select('*').order('titre')
    if (!error) setLivres(data)
  }

  async function chargerUtilisateur() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUtilisateur(user)
    const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
    setProfil(data)
  }

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
    
    <div className="bg-black min-h-screen">
      <div className="bg-[#073b14] w-full flex justify-center py-4">

              
                <div className="logo-perspective" cursor-pointer>
                  
                  <img
                    src="/image/icon-192.png"
                    alt="Logo"
                    className="logo-3d w-40 h-40"
                  />
                </div>
              

      </div>
      
                
    
    
    




      <div className="bibliochess">
        <div className="relative overflow-hidden rounded-lg mb-6">
        <div className="absolute inset-0 motif-damier"></div>
        <h1 className="z-10 relative text-center text-3xl font-bold text-heading  p-4"><mark className  = "StitreB">Bibliothèque du club</mark></h1>
        </div>

        <div className="relative w-full max-w-md mb-6">
        <input
          type="text"
          placeholder="Rechercher par titre, auteur ou thème..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="border border-secondary-light rounded px-3 py-2 pr-20 w-full bg-surface"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
          {nbFiltres}/{total}
        </span>
      </div>

        {message && (
          <p className="mb-4 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded p-2">
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {livresFiltres.map((livre) => {
            const dejaDemande = demandesEnAttente.includes(livre.id)
            return (
              <div key={livre.id} className=" border-secondary-light bg-surface rounded-lg p-4 shadow-sm flex gap-4">
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
                      onClick={() => setImageAgrandie(livre.couverture_url)}
                      aria-label="Agrandir l'image"
                      className="absolute bottom-1 right-1 rounded-full bg-black/60 text-white w-6 h-6 text-xs flex items-center justify-center"
                    >
                      ⤢
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-28 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center">
                    Pas d'image
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-semibold text-text">{livre.titre}</h2>
                  <p className="text-sm text-text-muted">{livre.auteur}</p>
                  <p className="text-sm text-text-muted mb-2">{livre.theme}</p>
                  <span className={`text-xs px-2 py-1 rounded ${livre.disponible ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                    {livre.disponible ? 'Disponible' : 'Emprunté'}
                  </span>

                  {livre.disponible && !dejaDemande && (
                    <div className="mt-3">
                      {demandeEnCours === livre.id ? (
                        <div className="flex flex-col gap-2">
                          {utilisateur ? (
                            <p className="text-sm text-gray-600">
                              Demande au nom de <strong>{profil?.nom}</strong> ({utilisateur.email})
                            </p>
                          ) : (
                            <>
                              <input placeholder="Ton nom" value={nom} onChange={(e) => setNom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                              <input placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                            </>
                          )}
                          <button onClick={() => envoyerDemande(livre.id)} className="bg-blue-600 text-white rounded px-2 py-1 text-sm">
                            Confirmer la demande
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDemandeEnCours(livre.id)} className="text-sm text-blue-600 underline">
                          Demander l'emprunt
                        </button>
                      )}
                    </div>
                  )}

                  {dejaDemande && (
                    <p className="mt-3 text-xs text-gray-500 italic">Demande envoyée, en attente</p>
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