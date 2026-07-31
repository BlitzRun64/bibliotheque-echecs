import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Bibliotheque() {
  const [livres, setLivres] = useState([])
  const [recherche, setRecherche] = useState('')
  const [demandesEnAttente, setDemandesEnAttente] = useState([])
  const [demandeEnCours, setDemandeEnCours] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { chargerLivres() }, [])

  async function chargerLivres() {
    const { data, error } = await supabase.from('livres').select('*').order('titre')
    if (!error) setLivres(data)
  }

  async function envoyerDemande(livreId) {
    if (!nom.trim()) { setMessage("Merci d'indiquer ton nom"); return }
    const { error } = await supabase.from('demandes_emprunt').insert({
      livre_id: livreId,
      nom_demandeur: nom.trim(),
      email_demandeur: email.trim(),
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

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bibliothèque du club</h1>

      <input
        type="text"
        placeholder="Rechercher par titre, auteur ou thème..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="border rounded px-3 py-2 mb-6 w-full max-w-md"
      />

      {message && (
        <p className="mb-4 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded p-2">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {livresFiltres.map((livre) => {
          const dejaDemande = demandesEnAttente.includes(livre.id)
          return (
            <div key={livre.id} className="border rounded-lg p-4 shadow-sm flex gap-4">
              {livre.couverture_url ? (
                <img
                  src={livre.couverture_url}
                  alt={livre.titre}
                  className="w-20 h-28 object-cover rounded flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-28 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center">
                  Pas d'image
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold">{livre.titre}</h2>
                <p className="text-sm text-gray-600">{livre.auteur}</p>
                <p className="text-xs text-gray-400 mb-2">{livre.theme}</p>
                <span className={`text-xs px-2 py-1 rounded ${livre.disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {livre.disponible ? 'Disponible' : 'Emprunté'}
                </span>

                {livre.disponible && !dejaDemande && (
                  <div className="mt-3">
                    {demandeEnCours === livre.id ? (
                      <div className="flex flex-col gap-2">
                        <input placeholder="Ton nom" value={nom} onChange={(e) => setNom(e.target.value)} className="border rounded px-2 py-1 text-sm" />
                        <input placeholder="Email (optionnel)" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-2 py-1 text-sm" />
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
  )
}