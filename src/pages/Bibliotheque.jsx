import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Bibliotheque() {
  const [livres, setLivres] = useState([])
  const [demandeEnCours, setDemandeEnCours] = useState(null)
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')

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
    if (!nom.trim()) return alert('Merci d\'indiquer ton nom')
    const { error } = await supabase.from('demandes_emprunt').insert({
      livre_id: livreId,
      nom_demandeur: nom,
      email_demandeur: email,
    })
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      alert('Demande envoyée !')
      setDemandeEnCours(null)
      setNom('')
      setEmail('')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bibliothèque du club</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {livres.map((livre) => (
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

            {livre.disponible && (
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
          </div>
        ))}
      </div>
    </div>
  )
}