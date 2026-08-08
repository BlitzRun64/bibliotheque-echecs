// src/pages/MotDePasseOublie.jsx
import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function envoyerLien(e) {
    e.preventDefault()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reinitialiser-mdp`,
    })
    if (error) setMessage('Erreur : ' + error.message)
    else setMessage('Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.')
  }

  return (
    <form onSubmit={envoyerLien} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Mot de passe oublié</h1>
      <input
        type="email"
        placeholder="Ton email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded px-3 py-2"
      />
      {message && <p className="text-sm text-blue-700">{message}</p>}
      <button className="bg-blue-600 text-white rounded px-3 py-2">Envoyer le lien</button>
      <Link to="/login" className="text-sm text-blue-600 underline text-center">Retour à la connexion</Link>
    </form>
  )
}