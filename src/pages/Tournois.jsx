import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import BandeauTitre from '../components/BandeauTitre'
import { useProfil } from '../useProfil'

// Un bloc par département : blason (lien vers la FFE), compteur de liens, liste dépliable.
const DEPARTEMENTS = [
  { id: 'dep1', nom: 'Calvados', image: '/image/blasons/calavados.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=14' },
  { id: 'dep2', nom: 'Orne', image: '/image/blasons/Orne.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=61' },
  { id: 'dep3', nom: 'Seine-Maritime', image: '/image/blasons/Seine-Maritime.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=76' },
  { id: 'dep4', nom: 'Eure', image: '/image/blasons/eure.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=27' },
  { id: 'dep5', nom: 'Manche', image: '/image/blasons/Manche.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=50' },
  { id: 'dep6', nom: 'Mayenne', image: '/image/blasons/Mayenne.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=53' },
  { id: 'dep7', nom: 'Finistere', image: '/image/blasons/Finistere.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=29' },
]

function SectionDepartement({ departement, ouvert, onToggle, liens, estAdmin, onAjoutLien, onSupprimerLien }) {
  const [titre, setTitre] = useState('')
  const [url, setUrl] = useState('')

  function soumettre(e) {
    e.preventDefault()
    if (!titre.trim() || !url.trim()) return
    onAjoutLien(departement.id, titre.trim(), url.trim())
    setTitre('')
    setUrl('')
  }

  return (
    <div className="border border-secondary-light rounded-lg overflow-hidden mb-4 bg-surface">
      <div className="flex items-center gap-4 p-3 bg-departement">
        {/* Blason + compteur à cheval sur son bord droit. Le compteur est positionné par rapport
            au blason (et non à la page), donc le rendu est identique à toutes les tailles d'écran. */}
        <div className="relative shrink-0">
          <a
            href={departement.lienOfficiel}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nav-text"
          >
            <img src={departement.image} alt={`Blason ${departement.nom}`} className="w-12 h-12 object-cover rounded" />
          </a>
          <span
            className="absolute top-1/2 left-full -translate-x-1/2 -translate-y-1/2 min-w-6 h-6 px-1.5 rounded-full bg-bg text-text-inverse border-2 border-nav-text text-xs font-bold flex items-center justify-center pointer-events-none shadow-bouton"
            aria-label={`${liens.length} lien(s)`}
          >
            {liens.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={ouvert}
          className="flex-1 flex items-center justify-between gap-2 text-left min-w-0"
        >
          <span className="font-semibold text-text-inverse truncate">{departement.nom}</span>
          <span aria-hidden="true" className={`transition-transform text-text-inverse/70 ${ouvert ? 'rotate-90' : ''}`}>▶</span>
        </button>
      </div>

      {ouvert && (
        <div className="border-t border-secondary-light p-3">
          {liens.length === 0 && (
            <p className="text-sm text-text-muted mb-2">Aucun lien pour l'instant</p>
          )}
          <ul className="mb-3">
            {liens.map((lien) => (
              <li key={lien.id} className="flex justify-between items-center gap-2 py-1 text-sm">
                <a href={lien.url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                  {lien.titre}
                </a>
                {estAdmin && (
                  <button
                    type="button"
                    onClick={() => onSupprimerLien(lien.id)}
                    className="btn btn-danger btn-sm btn-icone"
                    aria-label={`Supprimer le lien ${lien.titre}`}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                )}
              </li>
            ))}
          </ul>

          {estAdmin && (
            <form onSubmit={soumettre} className="flex flex-wrap gap-2">
              <input
                placeholder="Titre du lien"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="champ flex-1 min-w-40"
              />
              <input
                placeholder="https://..."
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="champ flex-1 min-w-40"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Ajouter
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default function Tournois() {
  const [liens, setLiens] = useState([])
  const [sectionOuverte, setSectionOuverte] = useState(null)
  const { estAdmin } = useProfil()

  function chargerLiens() {
    return supabase
      .from('liens_tournois')
      .select('*')
      .order('created_at')
      .then(({ data }) => setLiens(data || []))
  }

  useEffect(() => {
    chargerLiens()
  }, [])

  async function ajouterLien(departementId, titre, url) {
    await supabase.from('liens_tournois').insert({ departement: departementId, titre, url })
    chargerLiens()
  }

  async function supprimerLien(id) {
    await supabase.from('liens_tournois').delete().eq('id', id)
    chargerLiens()
  }

  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        <BandeauTitre titre="Tournois" />

        {DEPARTEMENTS.map((dep) => (
          <SectionDepartement
            key={dep.id}
            departement={dep}
            ouvert={sectionOuverte === dep.id}
            onToggle={() => setSectionOuverte(sectionOuverte === dep.id ? null : dep.id)}
            liens={liens.filter((l) => l.departement === dep.id)}
            estAdmin={estAdmin}
            onAjoutLien={ajouterLien}
            onSupprimerLien={supprimerLien}
          />
        ))}
      </div>
    </div>
  )
}
