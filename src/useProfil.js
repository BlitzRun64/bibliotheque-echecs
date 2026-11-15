// Utilisateur connecté (auth) et son profil (table profils), avec le drapeau administrateur.
// Suit les connexions / déconnexions pour rester à jour sans rechargement.
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useProfil() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [profil, setProfil] = useState(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let actif = true

    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!actif) return
      if (!user) {
        setUtilisateur(null)
        setProfil(null)
        setChargement(false)
        return
      }
      const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
      if (!actif) return
      setUtilisateur(user)
      setProfil(data ?? null)
      setChargement(false)
    }

    charger()
    // Différé d'un tick : appeler Supabase directement dans ce callback peut bloquer le verrou d'authentification.
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => { if (actif) charger() }, 0)
    })
    return () => {
      actif = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { utilisateur, profil, estAdmin: !!profil?.est_admin, chargement }
}
