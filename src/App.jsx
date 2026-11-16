import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import Ressources from './pages/Ressources'
import CategorieRessources from './pages/CategorieRessources'
import Installation from './pages/Installation'
import Plan_De_Table from './pages/Plan_De_Table/Plan_De_Table'
import AdminRoute from './components/AdminRoute'
import Horloge from './pages/Horloge'

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
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/tournois" element={<Tournois />} />
        <Route path="/ressources" element={<Ressources />} />
        <Route path="/ressources/:categorie" element={<CategorieRessources />} />
        {/* Ancienne adresse de la page Inter-club : les études sont désormais dans Ressources */}
        <Route path="/inter-club" element={<Navigate to="/ressources/etudes" replace />} />
        <Route path="/installation" element={<Installation />} />
        <Route path="/horloge" element={<Horloge />} />
        <Route path="/Plan_De_Table/Plan_De_Table" element={<AdminRoute><Plan_De_Table /></AdminRoute>} />
      </Routes>
      {/* Enregistre le service worker et propose les mises à jour (voir vite.config.js, registerType 'prompt') */}
      <UpdatePrompt />
    </BrowserRouter>
  )
}
