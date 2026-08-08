import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const navigate = useNavigate()

  async function seConnecter(e) {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setErreur(error.message); return }

    const { data: profil } = await supabase
      .from('profils')
      .select('est_admin')
      .eq('id', data.user.id)
      .single()

    navigate(profil?.est_admin ? '/admin' : '/profil')
  }

  return (
    <form onSubmit={seConnecter} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Connexion</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-3 py-2" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded px-3 py-2" />
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button className="bg-blue-600 text-white rounded px-3 py-2">Se connecter</button>
      <Link to="/inscription" className="text-sm text-blue-600 underline text-center">Créer un compte</Link>
      <Link to="/mot-de-passe-oublie" className="text-sm text-blue-600 underline text-center">Mot de passe oublié ?</Link>    
    </form>
  )
}