

import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

// À personnaliser : remplace nom / image / lienOfficiel pour chacun de tes 5 départements
const DEPARTEMENTS = [
  { id: 'dep1', nom: 'Calvados', image: '/image/blasons/calavados.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=14' },
  { id: 'dep2', nom: 'Orne', image: '/image/blasons/Orne.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=61' },
  { id: 'dep3', nom: 'Seine-Maritime', image: '/image/blasons/Seine-Maritime.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=76' },
  { id: 'dep4', nom: 'Eure', image: '/image/blasons/eure.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=27' },
  { id: 'dep5', nom: 'Manche', image: '/image/blasons/Manche.jpg', lienOfficiel: 'https://www.echecs.asso.fr/ListeTournois.aspx?Action=TOURNOICOMITE&ComiteRef=50' },
]

const x = 300

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
      <div className="flex items-center gap-3 p-3 bg-departement">
        <a href={departement.lienOfficiel} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
          <img src={departement.image} alt={departement.nom} className="w-12 h-12 object-cover rounded" />
        </a>
        <button onClick={onToggle} className="flex-1 flex items-center justify-between text-left">
          <span className=" font-semibold text-text" >{departement.nom}</span>
          <span className="absolute text-xs, border border-blue bg-black text-white rounded-full px-2 py-1 " style={{right: `${x}px`,}}>
          {liens.length}
          </span>

          <span className={`transition-transform text-text-muted ${ouvert ? 'rotate-90' : ''}`}>▶</span>
        </button>
      </div>

      {ouvert && (
        <div className="border-t border-secondary-light p-3">
          {liens.length === 0 && (
            <p className="text-sm text-text-muted mb-2">Aucun lien pour l'instant</p>
          )}
          <ul className="mb-3">
            {liens.map((lien) => (
              <li key={lien.id} className="flex justify-between items-center py-1 text-sm">
                <a href={lien.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  {lien.titre}
                </a>
                {estAdmin && (
                  <button onClick={() => onSupprimerLien(lien.id)} className="text-accent text-xs">🗑️</button>
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
                className="border border-secondary-light rounded px-2 py-1 text-sm flex-1"
              />
              <input
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border border-secondary-light rounded px-2 py-1 text-sm flex-1"
              />
              <button className="bg-primary hover:bg-primary-light text-white rounded px-3 py-1 text-sm">
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
  const [profil, setProfil] = useState(null)

  useEffect(() => {
    chargerLiens()
    chargerProfil()
  }, [])

  async function chargerProfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
    setProfil(data)
  }

  async function chargerLiens() {
    const { data } = await supabase.from('liens_tournois').select('*').order('created_at')
    setLiens(data || [])
  }

  async function ajouterLien(departementId, titre, url) {
    await supabase.from('liens_tournois').insert({ departement: departementId, titre, url })
    chargerLiens()
  }

  async function supprimerLien(id) {
    await supabase.from('liens_tournois').delete().eq('id', id)
    chargerLiens()
  }

  return (
    <div className="bg-black">
      <div className="bg-black max-w-4xl mx-auto p-4">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="absolute inset-0 motif-damier"></div>
          <h1 className="relative z-10 text-center text-3xl font-bold text-heading p-4">
            <mark className="StitreB">Tournois</mark>
          </h1>
        </div>

        {DEPARTEMENTS.map((dep) => (
          <SectionDepartement
            key={dep.id}
            departement={dep}
            ouvert={sectionOuverte === dep.id}
            onToggle={() => setSectionOuverte(sectionOuverte === dep.id ? null : dep.id)}
            liens={liens.filter((l) => l.departement === dep.id)}
            estAdmin={profil?.est_admin}
            onAjoutLien={ajouterLien}
            onSupprimerLien={supprimerLien}
          />
        ))}
      </div>
    </div>
    )
  }




/*
function Liens() {
  const [titre, setTitre] = useState("");
  const [url, setUrl] = useState("");
  const [liens, setLiens] = useState([]);

  const ajouterLien = (e) => {
    e.preventDefault();

    if (!titre || !url) return;

    const nouveauLien = {
      id: Date.now(),
      titre: titre,
      url: url
    };

    setLiens([...liens, nouveauLien]);

    setTitre("");
    setUrl("");
  }; */ 
/*
  return (
    <div className= "bg-placeholders   ">
      <h2 className="mx-4"> <strong> Ajouter un lien</strong></h2>

      <form onSubmit={ajouterLien}>

        <input
          className = "mx-4  bg-input text-white placeholder-white border border-white rounded px-3 py-2"
          type="text"
          placeholder="Titre du lien"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />

        <input
          className = "mx-4 bg-input text-white placeholder-white border border-white rounded px-3 py-2"
          type="url"
          placeholder="https://exemple.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

       <button
          type="submit"
          className="border border-white bg-[#073b14] text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>

      </form>

      <h2>Mes liens</h2>

      {liens.map((lien) => (
        <div key={lien.id}>
          <a
            href={lien.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {lien.titre}
          </a>
        </div>
      ))}
    </div>
  );
}


export default function Tournois() {
  return (
    <div className="bg-black min-h-screen">
      <div className="admin-page max-w-4xl mx-auto p-4">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="absolute inset-0 motif-damier2"></div>
          <h1 className="z-10 relative text-center text-3xl font-bold text-heading  p-4"><mark className  = "StitreB">Tournois </mark></h1>
          </div>

        <h2 className=""> <strong> Les liens par région</strong></h2>

        <Liens />
      </div>
    </div>
  );
} */ 