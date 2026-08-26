import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState , useRef } from 'react'
import { supabase } from './supabaseClient'
import Navbar from './components/Navbar'
import Bibliotheque from './pages/Bibliotheque'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Inscription from './pages/Inscription'
import Profil from './pages/Profil'
import UpdatePrompt from './components/UpdatePrompt'
import MotDePasseOublie from './pages/MotDePasseOublie'
import ReinitialiserMdp from './pages/ReinitialiserMdp'
import Tournois from './pages/Tournois'
import InterClub from './pages/InterClub'
import Installation from './pages/Installation'
import Plan_De_Table from './pages/Plan_De_Table/Plan_De_Table'
import AdminRoute from './components/AdminRoute'



function RouteProtegee({ children }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <p>Chargement...</p>
  return session ? children : <Navigate to="/login" />
}





export default function App() {

 
  return (
    
     


    <BrowserRouter>
      <Navbar />
      <Routes>
      
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/profil" element={<Profil />} /> 
        <Route path="/" element={<Bibliotheque />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
        <Route path="/reinitialiser-mdp" element={<ReinitialiserMdp />} />
        <Route path="/admin" element={<RouteProtegee><Admin /></RouteProtegee>} />
        <Route path="/tournois" element={<Tournois />} />
        <Route path="/inter-club" element={<InterClub />} />
        <Route path="/installation" element={<Installation />} />
        <Route path="/Plan_De_Table/Plan_De_Table" element={<AdminRoute><Plan_De_Table /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  )
}