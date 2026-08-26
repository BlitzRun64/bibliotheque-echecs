import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

const TAILLE_CASE = 24 // pixels par unité de grille

export default function Plan_de_Table() {
  const [evenements, setEvenements] = useState([])
  const [evenementId, setEvenementId] = useState(null)
  const [nouvelEvenement, setNouvelEvenement] = useState('')

  const [cartes, setCartes] = useState([])
  const [carteId, setCarteId] = useState(null)
  const [carte, setCarte] = useState(null)

  const [nomCarteInput, setNomCarteInput] = useState('Jour 1')
  const [largeurInput, setLargeurInput] = useState(20)
  const [longueurInput, setLongueurInput] = useState(15)

  const [zoom, setZoom] = useState(1)
  const [erreur, setErreur] = useState(null)

  useEffect(() => { chargerEvenements() }, [])
  useEffect(() => {
    setCarteId(null)
    setCarte(null)
    if (evenementId) chargerCartes()
    else setCartes([])
  }, [evenementId])
  useEffect(() => {
    const c = cartes.find((c) => c.id === carteId)
    setCarte(c || null)
  }, [carteId, cartes])

  async function chargerEvenements() {
    setErreur(null)
    const { data, error } = await supabase
      .from('pt_evenement')
      .select('*')
      .order('nom')
    if (error) { setErreur(error.message); return }
    setEvenements(data || [])
  }

  async function creerEvenement() {
    if (!nouvelEvenement.trim()) return
    setErreur(null)
    const { data, error } = await supabase
      .from('pt_evenement')
      .insert({ nom: nouvelEvenement.trim() })
      .select()
      .single()
    if (error) { setErreur(error.message); return }
    setNouvelEvenement('')
    await chargerEvenements()
    setEvenementId(data.id)
  }

  async function chargerCartes() {
    setErreur(null)
    const { data, error } = await supabase
      .from('pt_map')
      .select('*')
      .eq('evenement_id', evenementId)
      .order('nom')
    if (error) { setErreur(error.message); return }
    setCartes(data || [])
    if (data && data.length > 0) setCarteId(data[0].id)
  }

  async function creerCarte() {
    const largeur = parseInt(largeurInput, 10)
    const longueur = parseInt(longueurInput, 10)
    if (!nomCarteInput.trim() || !largeur || !longueur || largeur < 1 || longueur < 1) return
    setErreur(null)

    const { data, error } = await supabase
      .from('pt_map')
      .insert({
        evenement_id: evenementId,
        nom: nomCarteInput.trim(),
        largeur_map: largeur,
        longueur_map: longueur
      })
      .select()
      .single()

    if (error) { setErreur(error.message); return }
    await chargerCartes()
    setCarteId(data.id)
  }

  async function majTailleCarte() {
    if (!carte) return
    const largeur = parseInt(largeurInput, 10)
    const longueur = parseInt(longueurInput, 10)
    if (!largeur || !longueur || largeur < 1 || longueur < 1) return
    setErreur(null)

    const { data, error } = await supabase
      .from('pt_map')
      .update({ largeur_map: largeur, longueur_map: longueur })
      .eq('id', carte.id)
      .select()
      .single()

    if (error) { setErreur(error.message); return }
    setCartes((prev) => prev.map((c) => (c.id === data.id ? data : c)))
  }

  useEffect(() => {
    if (carte) {
      setLargeurInput(carte.largeur_map)
      setLongueurInput(carte.longueur_map)
    }
  }, [carte])

  const largeurPx = carte ? carte.largeur_map * TAILLE_CASE * zoom : 0
  const hauteurPx = carte ? carte.longueur_map * TAILLE_CASE * zoom : 0

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-display font-bold mb-4">Plan de table</h1>

      {erreur && (
        <div className="bg-red-100 text-red-700 text-sm px-3 py-2 rounded mb-4">
          Erreur : {erreur}
        </div>
      )}

      {/* Sélection / création d'événement */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          value={evenementId || ''}
          onChange={(e) => setEvenementId(e.target.value || null)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">— Choisir un événement —</option>
          {evenements.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.nom}</option>
          ))}
        </select>

        <input
          type="text"
          value={nouvelEvenement}
          onChange={(e) => setNouvelEvenement(e.target.value)}
          placeholder="Nom du nouvel événement"
          className="border rounded px-2 py-1 text-sm"
        />
        <button
          onClick={creerEvenement}
          className="bg-primary text-white text-sm px-3 py-1 rounded"
        >
          Créer
        </button>
      </div>

      {evenementId && (
        <>
          {/* Sélection de carte */}
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <select
              value={carteId || ''}
              onChange={(e) => setCarteId(e.target.value || null)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">— Choisir une carte —</option>
              {cartes.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            <input
              type="text"
              value={nomCarteInput}
              onChange={(e) => setNomCarteInput(e.target.value)}
              placeholder="Nom (ex: Jour 1)"
              className="border rounded px-2 py-1 text-sm w-32"
            />
            <input
              type="number"
              min="1"
              value={largeurInput}
              onChange={(e) => setLargeurInput(e.target.value)}
              className="border rounded px-2 py-1 w-20 text-sm"
              title="Largeur (cases)"
            />
            <input
              type="number"
              min="1"
              value={longueurInput}
              onChange={(e) => setLongueurInput(e.target.value)}
              className="border rounded px-2 py-1 w-20 text-sm"
              title="Longueur (cases)"
            />
            <button
              onClick={creerCarte}
              className="bg-primary text-white text-sm px-3 py-1 rounded"
            >
              Nouvelle carte
            </button>

            {carte && (
              <button
                onClick={majTailleCarte}
                className="border text-sm px-3 py-1 rounded"
              >
                Redimensionner "{carte.nom}"
              </button>
            )}

            {carte && (
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="border rounded px-2 text-sm">-</button>
                <span className="text-sm">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="border rounded px-2 text-sm">+</button>
              </div>
            )}
          </div>

          {/* Grille SVG */}
          {carte && (
            <div className="border border-secondary-light rounded overflow-auto" style={{ maxHeight: '70vh' }}>
              <svg width={largeurPx} height={hauteurPx}>
                <GrilleSVG
                  largeurCases={carte.largeur_map}
                  longueurCases={carte.longueur_map}
                  tailleCase={TAILLE_CASE * zoom}
                />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function GrilleSVG({ largeurCases, longueurCases, tailleCase }) {
  const lignes = []

  for (let x = 0; x <= largeurCases; x++) {
    lignes.push(
      <line
        key={`v-${x}`}
        x1={x * tailleCase}
        y1={0}
        x2={x * tailleCase}
        y2={longueurCases * tailleCase}
        stroke="#d1d5db"
        strokeWidth={1}
      />
    )
  }

  for (let y = 0; y <= longueurCases; y++) {
    lignes.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y * tailleCase}
        x2={largeurCases * tailleCase}
        y2={y * tailleCase}
        stroke="#d1d5db"
        strokeWidth={1}
      />
    )
  }

  return <>{lignes}</>
}