import { Link } from 'react-router-dom'

// Pied de page discret, présent sur toutes les pages : accès aux mentions légales (obligation LCEN / RGPD).
export default function PiedDePage() {
  return (
    <footer className="bg-bg border-t border-secondary-light/40 py-4 text-center text-xs text-text-inverse/60">
      <Link to="/mentions-legales" className="underline hover:text-text-inverse">
        Mentions légales et confidentialité
      </Link>
    </footer>
  )
}
