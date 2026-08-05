// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Navbar() {
  const [demandes, setDemandes] = useState([])
  const [menuDemandesOuvert, setMenuDemandesOuvert] = useState(false)
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false)
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false)
  const [session, setSession] = useState(undefined)
  const [profil, setProfil] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
  if (session) {
    chargerProfil()
    chargerDemandes()
  } else {
    setProfil(null)
  }
}, [session])

  async function chargerProfil() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
  setProfil(data)
}

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

  const onglets = [{ label: 'Bibliothèque', to: '/' }]

  return (
    <>
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center relative">
        <div className="flex gap-4 items-center">
          <Link to="/" className="font-bold">♟️ Club d'échecs</Link>
          <button onClick={() => setMenuMobileOuvert(!menuMobileOuvert)} className="sm:hidden text-2xl leading-none w-8 h-8 flex items-center justify-center">
            {menuMobileOuvert ? '✕' : '☰'}
          </button>
          <div className="hidden sm:flex gap-4">
            {onglets.map((o) => (
              <Link key={o.to} to={o.to} className="text-sm text-gray-600 hover:text-black">{o.label}</Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session && profil?.est_admin && (
            <div className="relative">
              <button onClick={() => setMenuDemandesOuvert(!menuDemandesOuvert)} className="relative text-xl leading-none">
                📬
                {demandes.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {demandes.length}
                  </span>
                )}
              </button>
              {menuDemandesOuvert && (
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
                  <Link to="/admin" onClick={() => setMenuDemandesOuvert(false)} className="block text-center text-blue-600 text-sm p-2 hover:bg-gray-50">
                    Gérer les demandes →
                  </Link>
                </div>
              )}
            </div>
          )}

          {session ? (
            <div className="relative">
              <button onClick={() => setMenuProfilOuvert(!menuProfilOuvert)} className="text-sm text-gray-700 flex items-center gap-1">
                {profil?.nom || '...'} ▾
              </button>
              {menuProfilOuvert && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                  <Link to={profil?.est_admin ? '/admin' : '/profil'} onClick={() => setMenuProfilOuvert(false)} className="block px-4 py-2 text-sm hover:bg-gray-50">
                    {profil?.est_admin ? 'Admin' : 'Mon profil'}
                  </Link>
                  <button onClick={deconnexion} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-sm text-blue-600">Connexion</Link>
          )}
        </div>
      </nav>

      {menuMobileOuvert && (
        <div className="sm:hidden fixed inset-0 top-[57px] bg-white z-40 flex flex-col">
          {onglets.map((o) => (
            <Link key={o.to} to={o.to} onClick={() => setMenuMobileOuvert(false)} className="text-lg text-gray-800 border-b px-6 py-4">
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}