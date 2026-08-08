// src/pages/ReinitialiserMdp.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function ReinitialiserMdp() {
  const [pret, setPret] = useState(false)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase établit automatiquement une session temporaire depuis le lien reçu par email
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setPret(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function changerMdp(e) {
    e.preventDefault()
    if (password.length < 6) {
      setMessage('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage('Erreur : ' + error.message)
    } else {
      setMessage('Mot de passe mis à jour ! Redirection...')
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (!pret) {
    return <p className="text-center mt-20 text-gray-500">Vérification du lien...</p>
  }

  return (
    <form onSubmit={changerMdp} className="max-w-sm mx-auto mt-20 flex flex-col gap-3">
      <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
      />
      {message && <p className="text-sm text-blue-700">{message}</p>}
      <button className="bg-blue-600 text-white rounded px-3 py-2">Valider</button>
    </form>
  )
}