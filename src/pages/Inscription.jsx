// src/pages/Inscription.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Inscription() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function sInscrire(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
    })
    if (error) setMessage('Erreur : ' + error.message)
    else setMessage('Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse.')
  }

  return (
    <form onSubmit={sInscrire} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Créer un compte</h1>
      <input placeholder="Ton nom" value={nom} onChange={(e) => setNom(e.target.value)} className="border rounded px-3 py-2" />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded px-3 py-2" />
      <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded px-3 py-2" />
      {message && <p className="text-sm text-blue-700">{message}</p>}
      <button className="bg-blue-600 text-white rounded px-3 py-2">S'inscrire</button>
    </form>
  )
}