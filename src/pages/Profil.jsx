import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

function SectionRepliable({ titre, count, couleurBandeau, couleurContenu, ouvert, onToggle, children }) {
  return (
    <div className="border-b last:border-0">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 ${couleurBandeau} text-white font-medium`}
      >
        <span>{titre} {count > 0 && `(${count})`}</span>
        <span className={`transition-transform ${ouvert ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {ouvert && (
        <div className={`p-4 ${couleurContenu}`}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function Profil() {
  const [demandes, setDemandes] = useState([])
  const [enCours, setEnCours] = useState([])
  const [rendus, setRendus] = useState([])
  const [livresEmpruntes, setLivresEmpruntes] = useState([])
  const [sectionOuverte, setSectionOuverte] = useState(null) // 'demande' | 'emprunt' | 'rendu' | null

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: d } = await supabase
      .from('demandes_emprunt')
      .select('*, livres(titre)')
      .eq('utilisateur_id', user.id)
      .eq('statut', 'en_attente')
    setDemandes(d || [])

    const { data: c } = await supabase
      .from('prets')
      .select('*, livres(*)')
      .eq('utilisateur_id', user.id)
      .is('date_retour', null)
    setEnCours(c || [])
    setLivresEmpruntes((c || []).map((p) => p.livres).filter(Boolean))

    const { data: r } = await supabase
      .from('prets')
      .select('*, livres(titre)')
      .eq('utilisateur_id', user.id)
      .not('date_retour', 'is', null)
      .order('date_retour', { ascending: false })
    setRendus(r || [])
  }

  function tempsRestant(dateLimite) {
    if (!dateLimite) return null
    const diffMs = new Date(dateLimite) - new Date()
    const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffJours < 0) return { texte: `en retard de ${Math.abs(diffJours)} jour(s)`, retard: true }
    if (diffJours === 0) return { texte: "à rendre aujourd'hui", retard: false }
    return { texte: `encore ${diffJours} jour(s)`, retard: false }
  }

  function toggle(section) {
    setSectionOuverte(sectionOuverte === section ? null : section)
  }

  return (
    <div className="bg-black min-h-screen">
      
      <div className="max-w-3xl mx-auto p-4">
        <div className="relative overflow-hidden rounded-lg mb-6">
        <div className="absolute inset-0 motif-damier"></div>
        <h1 className="z-10 relative text-center text-3xl font-bold text-heading  p-4"><mark className  = "StitreB">Mon profile</mark></h1>
        </div>
       

        <div className="border rounded-lg overflow-hidden mb-10">
          <SectionRepliable
            titre="Demandés"
            count={demandes.length}
            couleurBandeau="bg-orange-500"
            couleurContenu="bg-yellow-50"
            ouvert={sectionOuverte === 'demande'}
            onToggle={() => toggle('demande')}
          >
            {demandes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune demande en attente</p>
            ) : (
              demandes.map((d) => (
                <div key={d.id} className="py-1 text-sm">{d.livres?.titre}</div>
              ))
            )}
          </SectionRepliable>

          <SectionRepliable
            titre="Empruntés actuellement"
            count={enCours.length}
            couleurBandeau="bg-blue-600"
            couleurContenu="bg-sky-50"
            ouvert={sectionOuverte === 'emprunt'}
            onToggle={() => toggle('emprunt')}
          >
            {enCours.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun emprunt en cours</p>
            ) : (
              enCours.map((p) => {
                const restant = tempsRestant(p.date_limite)
                return (
                  <div key={p.id} className="py-1 text-sm">
                    <strong>{p.livres?.titre}</strong> — depuis le {new Date(p.date_debut).toLocaleDateString('fr-FR')}
                    {restant && (
                      <span className={restant.retard ? 'text-red-600 font-semibold ml-2' : 'text-gray-500 ml-2'}>
                        ({restant.texte})
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </SectionRepliable>

          <SectionRepliable
            titre="Rendus"
            count={rendus.length}
            couleurBandeau="bg-green-600"
            couleurContenu="bg-green-50"
            ouvert={sectionOuverte === 'rendu'}
            onToggle={() => toggle('rendu')}
          >
            {rendus.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun historique</p>
            ) : (
              rendus.map((p) => (
                <div key={p.id} className="py-1 text-sm">
                  {p.livres?.titre} — rendu le {new Date(p.date_retour).toLocaleDateString('fr-FR')}
                </div>
              ))
            )}
          </SectionRepliable>
        </div>

        <div className="relative overflow-hidden rounded-lg mb-6">
        <div className="absolute inset-0 motif-damier"></div>
        <h1 className="z-10 relative text-center text-lg font-bold text-heading  p-4"><mark className  = "StitreB">Liste des livres </mark></h1>
        </div>

        <h2 className="text-lg font-semibold mb-4">Liste des livres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {livresEmpruntes.length === 0 && (
            <p className="text-lg text-white font-bold">Tu n'as aucun livre emprunté actuellement</p>
          )}
          {livresEmpruntes.map((livre) => (
            <div key={livre.id} className="border rounded-lg p-4 shadow-sm flex gap-4">
              {livre.couverture_url ? (
                <img src={livre.couverture_url} alt={livre.titre} className="w-20 h-28 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-20 h-28 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center">
                  Pas d'image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{livre.titre}</h3>
                <p className="text-sm text-gray-600">{livre.auteur}</p>
                <p className="text-xs text-gray-400">{livre.theme}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}