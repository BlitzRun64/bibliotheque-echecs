import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Bibliotheque() {
  const [livres, setLivres] = useState([])
  const [demandesEnAttente, setDemandesEnAttente] = useState([]) // liste des livre_id déjà demandés
  const [demandeEnCours, setDemandeEnCours] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    chargerLivres()
  }, [])

  async function chargerLivres() {
    const { data, error } = await supabase
      .from('livres')
      .select('*')
      .order('titre')
    if (!error) setLivres(data)
  }

  async function envoyerDemande(livreId) {
    if (!nom.trim()) {
      setMessage('Merci d\'indiquer ton nom')
      return
    }

    // Vérifie qu'il n'y a pas déjà une demande en attente pour ce livre par cette même personne
    const { data: existantes } = await supabase
      .from('demandes_emprunt')
      .select('id')
      .eq('livre_id', livreId)
      .eq('nom_demandeur', nom.trim())

    // Note : la lecture est réservée admin désormais, donc cette vérification
    // ne fonctionnera plus après le durcissement RLS — voir remarque plus bas

    const { error } = await supabase.from('demandes_emprunt').insert({
      livre_id: livreId,
      nom_demandeur: nom.trim(),
      email_demandeur: email.trim(),
    })

    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Demande envoyée ! L\'admin va la traiter.')
      setDemandesEnAttente([...demandesEnAttente, livreId])
      setDemandeEnCours(null)
      setNom('')
      setEmail('')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque du club</h1>
      {message && (
        <p className="mb-4 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded p-2">
          {message}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {livres.map((livre) => {
          const dejaDemandeCetteSession = demandesEnAttente.includes(livre.id)
          return (
            <div key={livre.id} className="border rounded-lg p-4 shadow-sm">
              <h2 className="font-semibold">{livre.titre}</h2>
              <p className="text-sm text-gray-600">{livre.auteur}</p>
              <p className="text-xs text-gray-400 mb-2">{livre.theme}</p>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  livre.disponible
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {livre.disponible ? 'Disponible' : 'Emprunté'}
              </span>

              {livre.disponible && !dejaDemandeCetteSession && (
                <div className="mt-3">
                  {demandeEnCours === livre.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        placeholder="Ton nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <input
                        placeholder="Email (optionnel)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => envoyerDemande(livre.id)}
                        className="bg-blue-600 text-white rounded px-2 py-1 text-sm"
                      >
                        Confirmer la demande
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDemandeEnCours(livre.id)}
                      className="text-sm text-blue-600 underline"
                    >
                      Demander l'emprunt
                    </button>
                  )}
                </div>
              )}

              {dejaDemandeCetteSession && (
                <p className="mt-3 text-xs text-gray-500 italic">
                  Demande déjà envoyée, en attente de traitement
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}