import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const NB_POSITIONS = 8

export default function InterClub() {
  const [ronde, setRonde] = useState('Ronde 1')
  const [joueurs, setJoueurs] = useState([])
  const [compositions, setCompositions] = useState([])
  const [menuJoueursOuvert, setMenuJoueursOuvert] = useState(false)
  const [nouveauJoueur, setNouveauJoueur] = useState({ nom: '', prenom: '', elo: '' })
  const [positionEnEdition, setPositionEnEdition] = useState(null) // { equipe, position }
  const [rechercheJoueur, setRechercheJoueur] = useState('')
  const [adversaire, setAdversaire] = useState({ nom: '', prenom: '', elo: '' })
  const [profil, setProfil] = useState(null)

  useEffect(() => {
    chargerJoueurs()
    chargerProfil()
  }, [])

  useEffect(() => {
    chargerCompositions()
  }, [ronde])

  async function chargerProfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
    setProfil(data)
  }

  async function chargerJoueurs() {
    const { data } = await supabase.from('joueurs_interclub').select('*').order('nom')
    setJoueurs(data || [])
  }

  async function chargerCompositions() {
    const { data } = await supabase
      .from('compositions_interclub')
      .select('*, joueurs_interclub(nom, prenom, elo)')
      .eq('ronde', ronde)
    setCompositions(data || [])
  }

  async function ajouterJoueur(e) {
    e.preventDefault()
    if (!nouveauJoueur.nom || !nouveauJoueur.prenom) return
    await supabase.from('joueurs_interclub').insert({
      nom: nouveauJoueur.nom,
      prenom: nouveauJoueur.prenom,
      elo: nouveauJoueur.elo ? parseInt(nouveauJoueur.elo) : null,
    })
    setNouveauJoueur({ nom: '', prenom: '', elo: '' })
    chargerJoueurs()
  }

  async function supprimerJoueur(id) {
    await supabase.from('joueurs_interclub').delete().eq('id', id)
    chargerJoueurs()
  }

  function ouvrirEdition(equipe, position) {
    const existant = compositions.find((c) => c.equipe === equipe && c.position === position)
    setAdversaire({
      nom: existant?.adversaire_nom || '',
      prenom: existant?.adversaire_prenom || '',
      elo: existant?.adversaire_elo || '',
    })
    setRechercheJoueur('')
    setPositionEnEdition({ equipe, position })
  }

  async function assignerJoueur(joueurId) {
    const { equipe, position } = positionEnEdition
    const existant = compositions.find((c) => c.equipe === equipe && c.position === position)

    const payload = {
      ronde,
      equipe,
      position,
      joueur_id: joueurId,
      adversaire_nom: adversaire.nom || null,
      adversaire_prenom: adversaire.prenom || null,
      adversaire_elo: adversaire.elo ? parseInt(adversaire.elo) : null,
    }

    if (existant) {
      await supabase.from('compositions_interclub').update(payload).eq('id', existant.id)
    } else {
      await supabase.from('compositions_interclub').insert(payload)
    }

    setPositionEnEdition(null)
    chargerCompositions()
  }

  async function definirResultat(compositionId, resultat) {
    await supabase.from('compositions_interclub').update({ resultat }).eq('id', compositionId)
    chargerCompositions()
  }

  async function retirerPosition(equipe, position) {
    const existant = compositions.find((c) => c.equipe === equipe && c.position === position)
    if (existant) {
      await supabase.from('compositions_interclub').delete().eq('id', existant.id)
      chargerCompositions()
    }
  }

  const joueursFiltres = joueurs.filter((j) =>
    `${j.nom} ${j.prenom}`.toLowerCase().includes(rechercheJoueur.toLowerCase())
  )

  const x = 210

  function TableauEquipe({ equipe }) {
    return (
      <div className="mb-10">
        <div className="relative overflow-hidden rounded-lg mb-6 text-whie">
          
          <div className="absolute  "
              style={{
            left: `${x}px`,
            
          }}
          > 
          
            <a href="https://www.echecs.asso.fr/Equipes.aspx">
              <img
                      src="/image/logo ffe.png"
                      alt="Logo ffe"
                      className="logo-2d w-10 h-10"
                    />
            </a>
          </div>
          <h2 className="font-semibold text-white mb-3">Équipe {equipe} | lien vers la ffe ➡️</h2>
        </div>
        <span className="font-semibold text-white">  {compositions.filter(c => c.equipe === 1 && c.joueur_id).length} / {NB_POSITIONS} joueurs assignés </span> 
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-secondary-light bg-surface rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-primary/10 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Prénom</th>
                <th className="p-2">Elo</th>
                <th className="p-2">Résultat</th>
                <th className="p-2">Adversaire</th>
                <th className="p-2">Elo adv.</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: NB_POSITIONS }, (_, i) => i + 1).map((position) => {
                const comp = compositions.find((c) => c.equipe === equipe && c.position === position)
                return (
                  <tr key={position} className="border-t border-secondary-light">
                    <td className="p-2 text-text-muted">{position}</td>
                    <td className="p-2 text-text">{comp?.joueurs_interclub?.nom || '—'}</td>
                    <td className="p-2 text-text">{comp?.joueurs_interclub?.prenom || ''}</td>
                    <td className="p-2 text-text-muted">{comp?.joueurs_interclub?.elo || ''}</td>
                    <td className="p-2">
                      {comp?.joueur_id ? (
                        <select
                          value={comp.resultat || ''}
                          onChange={(e) => definirResultat(comp.id, e.target.value || null)}
                          className="border border-secondary-light rounded px-1 py-0.5 text-xs bg-surface"
                        >
                          <option value="">—</option>
                          <option value="1-0">1-0</option>
                          <option value="0-1">0-1</option>
                          <option value="1/2-1/2">1/2-1/2</option>
                        </select>
                      ) : '—'}
                    </td>
                    <td className="p-2 text-text-muted">
                      {comp?.adversaire_nom ? `${comp.adversaire_nom} ${comp.adversaire_prenom || ''}` : ''}
                    </td>
                    <td className="p-2 text-text-muted">{comp?.adversaire_elo || ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {profil?.est_admin && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: NB_POSITIONS }, (_, i) => i + 1).map((position) => {
              const comp = compositions.find((c) => c.equipe === equipe && c.position === position)
              return (
                <div key={position} className="flex gap-1">
                  <button
                    onClick={() => ouvrirEdition(equipe, position)}
                    className="text-xs bg-primary hover:bg-primary-light text-white rounded px-2 py-1"
                  >
                    Pos {position} {comp?.joueur_id ? '✏️' : '➕'}
                  </button>
                  {comp?.joueur_id && (
                    <button
                      onClick={() => retirerPosition(equipe, position)}
                      className="text-xs bg-accent text-white rounded px-2 py-1"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-black">
    <div className="max-w-4xl mx-auto p-4 bg-black">
      <div className="relative overflow-hidden rounded-lg mb-6">
        <div className="absolute inset-0 motif-damier"></div>
        <h1 className="relative z-10 text-center text-3xl font-bold text-heading p-4">
          <mark className="StitreB">Inter-club</mark>
        </h1>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
        <input
          value={ronde}
          onChange={(e) => setRonde(e.target.value)}
          className="border border-secondary-light rounded px-3 py-2 bg-surface text-text font-medium"
        />
        {profil?.est_admin && (
          <button
            onClick={() => setMenuJoueursOuvert(true)}
            className="bg-secondary text-black rounded px-3 py-2 text-sm"
          >
            👥 Gérer les joueurs
          </button>
        )}
      </div>
        
            
           
       
      <TableauEquipe equipe={1} />
      <TableauEquipe equipe={2} />

      {/* Modal gestion des joueurs */}
      {menuJoueursOuvert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-text">Liste des joueurs</h2>
              <button onClick={() => setMenuJoueursOuvert(false)} className="text-text-muted">✕</button>
            </div>

            <form onSubmit={ajouterJoueur} className="flex flex-wrap gap-2 mb-4">
              <input placeholder="Nom" value={nouveauJoueur.nom} onChange={(e) => setNouveauJoueur({ ...nouveauJoueur, nom: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm flex-1" />
              <input placeholder="Prénom" value={nouveauJoueur.prenom} onChange={(e) => setNouveauJoueur({ ...nouveauJoueur, prenom: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm flex-1" />
              <input placeholder="Elo" type="number" value={nouveauJoueur.elo} onChange={(e) => setNouveauJoueur({ ...nouveauJoueur, elo: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm w-20" />
              <button className="bg-primary text-white rounded px-3 py-1 text-sm">Ajouter</button>
            </form>

            {joueurs.map((j) => (
              <div key={j.id} className="flex justify-between items-center border-b border-secondary-light py-1 text-sm">
                <span className="text-text">{j.nom} {j.prenom} {j.elo ? `(${j.elo})` : ''}</span>
                <button onClick={() => supprimerJoueur(j.id)} className="text-accent text-xs">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal assignation position */}
      {positionEnEdition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-text">
                Équipe {positionEnEdition.equipe} — Position {positionEnEdition.position}
              </h2>
              <button onClick={() => setPositionEnEdition(null)} className="text-text-muted">✕</button>
            </div>

            <input
              placeholder="Rechercher un joueur..."
              value={rechercheJoueur}
              onChange={(e) => setRechercheJoueur(e.target.value)}
              className="border border-secondary-light rounded px-2 py-1 text-sm w-full mb-2"
            />
            <div className="max-h-32 overflow-y-auto border border-secondary-light rounded mb-4">
              {joueursFiltres.map((j) => (
                <button
                  key={j.id}
                  onClick={() => assignerJoueur(j.id)}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-primary/10 text-text"
                >
                  {j.nom} {j.prenom} {j.elo ? `(${j.elo})` : ''}
                </button>
              ))}
              {joueursFiltres.length === 0 && (
                <p className="text-xs text-text-muted p-2">Aucun joueur trouvé</p>
              )}
            </div>

            <p className="text-sm font-medium text-text mb-2">Adversaire supposé (optionnel)</p>
            <div className="flex flex-wrap gap-2">
              <input placeholder="Nom" value={adversaire.nom} onChange={(e) => setAdversaire({ ...adversaire, nom: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm flex-1" />
              <input placeholder="Prénom" value={adversaire.prenom} onChange={(e) => setAdversaire({ ...adversaire, prenom: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm flex-1" />
              <input placeholder="Elo" type="number" value={adversaire.elo} onChange={(e) => setAdversaire({ ...adversaire, elo: e.target.value })} className="border border-secondary-light rounded px-2 py-1 text-sm w-20" />
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}