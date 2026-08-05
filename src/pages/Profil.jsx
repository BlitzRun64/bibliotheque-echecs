// src/pages/Profil.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Profil() {
  const [demandes, setDemandes] = useState([])
  const [enCours, setEnCours] = useState([])
  const [rendus, setRendus] = useState([])

  useEffect(() => { chargerTout() }, [])

  async function chargerTout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: d } = await supabase
      .from('demandes_emprunt')
      .select('*, livres(titre)')
      .eq('email_demandeur', user.email)
      .eq('statut', 'en_attente')
    setDemandes(d || [])

    const { data: c } = await supabase
      .from('prets')
      .select('*, livres(titre)')
      .eq('utilisateur_id', user.id)
      .is('date_retour', null)
    setEnCours(c || [])

    const { data: r } = await supabase
      .from('prets')
      .select('*, livres(titre)')
      .eq('utilisateur_id', user.id)
      .not('date_retour', 'is', null)
      .order('date_retour', { ascending: false })
    setRendus(r || [])
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">Demandés</h2>
        {demandes.length === 0 && <p className="text-sm text-gray-500">Aucune demande en attente</p>}
        {demandes.map((d) => (
          <div key={d.id} className="border-b py-2 text-sm">{d.livres?.titre}</div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="font-semibold mb-2">Empruntés actuellement</h2>
        {enCours.length === 0 && <p className="text-sm text-gray-500">Aucun emprunt en cours</p>}
        {enCours.map((p) => (
          <div key={p.id} className="border-b py-2 text-sm">
            {p.livres?.titre} — depuis le {new Date(p.date_debut).toLocaleDateString('fr-FR')}
            {p.date_limite && ` (à rendre avant le ${new Date(p.date_limite).toLocaleDateString('fr-FR')})`}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-semibold mb-2">Rendus</h2>
        {rendus.length === 0 && <p className="text-sm text-gray-500">Aucun historique</p>}
        {rendus.map((p) => (
          <div key={p.id} className="border-b py-2 text-sm">
            {p.livres?.titre} — rendu le {new Date(p.date_retour).toLocaleDateString('fr-FR')}
          </div>
        ))}
      </section>
    </div>
  )
}