import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Navbar() {
  const [demandes, setDemandes] = useState([])
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [session, setSession] = useState(undefined)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) chargerDemandes()
  }, [session])

  async function chargerDemandes() {
    const { data } = await supabase
      .from('demandes_emprunt')
      .select('*, livres(titre)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false })
    setDemandes(data || [])
  }

  async function deconnexion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b px-4 py-3 flex justify-between items-center relative">
      <div className="flex gap-4 items-center">
        <Link to="/" className="font-bold">♟️ Club d'échecs</Link>
        <Link to="/" className="text-sm text-gray-600 hover:text-black">Bibliothèque</Link>
      </div>

      <div className="flex items-center gap-4">
        {session && (
          <div className="relative">
            <button onClick={() => setMenuOuvert(!menuOuvert)} className="relative text-xl leading-none">
              📬
              {demandes.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {demandes.length}
                </span>
              )}
            </button>

            {menuOuvert && (
              <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg max-h-72 overflow-y-auto z-50">
                {demandes.length === 0 ? (
                  <p className="text-sm text-gray-500 p-3">Aucune demande</p>
                ) : (
                  demandes.map((d) => (
                    <div key={d.id} className="p-3 border-b text-sm">
                      <strong>{d.nom_demandeur}</strong> veut emprunter <em>{d.livres?.titre}</em>
                    </div>
                  ))
                )}
                <Link to="/admin" onClick={() => setMenuOuvert(false)} className="block text-center text-blue-600 text-sm p-2 hover:bg-gray-50">
                  Gérer les demandes →
                </Link>
              </div>
            )}
          </div>
        )}

        {session ? (
          <>
            <Link to="/admin" className="text-sm text-gray-600 hover:text-black">Admin</Link>
            <button onClick={deconnexion} className="text-sm text-red-600">Déconnexion</button>
          </>
        ) : (
          <Link to="/login" className="text-xs text-gray-400 underline">Espace admin</Link>
        )}
      </div>
    </nav>
  )
}