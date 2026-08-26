import { useEffect, useState , useRef} from 'react'
import { supabase } from '../../supabaseClient'
import { DndContext, useDraggable , useSensor , useSensors, PointerSensor} from '@dnd-kit/core'

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
  const [panneauOuvert, setPanneauOuvert] = useState(false)
  const refPanneau = useRef(null)

  const [tables, setTables] = useState([])
  const [largeurTableInput, setLargeurTableInput] = useState(4)
  const [longueurTableInput, setLongueurTableInput] = useState(2)
  const [tableSelectionneeId, setTableSelectionneeId] = useState(null)
  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8 // pixels à parcourir avant de considérer que c'est un drag
    }
  })
)

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

  useEffect(() => {
  if (carte) chargerTables()
  else setTables([])
}, [carte])

useEffect(() => {
  function gererClicExterieur(e) {
    if (refPanneau.current && !refPanneau.current.contains(e.target)) {
      setPanneauOuvert(false)
      setTableSelectionneeId(null)
    }
  }
  document.addEventListener('mousedown', gererClicExterieur)
  return () => document.removeEventListener('mousedown', gererClicExterieur)
}, [])




    async function chargerTables() {
    setErreur(null)
    const { data, error } = await supabase
        .from('pt_table')
        .select('*')
        .eq('map_id', carte.id)
    if (error) { setErreur(error.message); return }
    setTables(data || [])
    }

    async function ajouterTable() {
        const largeur = parseInt(largeurTableInput, 10)
        const longueur = parseInt(longueurTableInput, 10)
        if (!carte || !largeur || !longueur || largeur < 1 || longueur < 1) return
        setErreur(null)

        const { data, error } = await supabase
            .from('pt_table')
            .insert({
            map_id: carte.id,
            largeur,
            longueur,
            x: 0,
            y: 0,
            rotation: 0,
            statut: 'vide'
            })
            .select()
            .single()

        if (error) { setErreur(error.message); return }
        setTables((prev) => [...prev, data])
        }

    async function supprimerTable(id) {
        setErreur(null)
        const { error } = await supabase.from('pt_table').delete().eq('id', id)
        if (error) { setErreur(error.message); return }
        setTables((prev) => prev.filter((t) => t.id !== id))
        if (tableSelectionneeId === id) setTableSelectionneeId(null)
        }

    const couleurStatut = {
        vide: '#ef4444',      // rouge
        ok: '#22c55e',        // vert
        reflexion: '#f97316', // orange
        warning: '#eab308'    // jaune
        }

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

    async function deplacerTable(id, x, y) {
        setErreur(null)
        const { data, error } = await supabase
            .from('pt_table')
            .update({ x, y })
            .eq('id', id)
            .select()
            .single()

        if (error) { setErreur(error.message); return }
        setTables((prev) => prev.map((t) => (t.id === id ? data : t)))
        }

    function gererFinDrag(event, tailleCasePx) {
        const { active, delta } = event
        const table = tables.find((t) => t.id === active.id)
        if (!table) return

        const deltaXCases = delta.x / tailleCasePx
        const deltaYCases = delta.y / tailleCasePx

        let nouveauX = Math.round(table.x + deltaXCases)
        let nouveauY = Math.round(table.y + deltaYCases)

        // Empêcher de sortir de la carte
        nouveauX = Math.max(0, Math.min(nouveauX, carte.largeur_map - table.largeur))
        nouveauY = Math.max(0, Math.min(nouveauY, carte.longueur_map - table.longueur))

        deplacerTable(table.id, nouveauX, nouveauY)
    }

    function fermerPanneau() {
      setPanneauOuvert(false)
      setTableSelectionneeId(null)
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
const tableSelectionnee = tables.find((t) => t.id === tableSelectionneeId) || null

  return (
     <div className="p-4 max-w-7xl mx-auto flex gap-4">

            <div className="flex-1 min-w-0">
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
                        <div className="flex flex-wrap gap-2 items-center mb-4">
                            <label className="text-sm">
                            Table — largeur
                            <input
                                type="number"
                                min="1"
                                value={largeurTableInput}
                                onChange={(e) => setLargeurTableInput(e.target.value)}
                                className="border rounded px-2 py-1 ml-2 w-16 text-sm"
                            />
                            </label>
                            <label className="text-sm">
                            longueur
                            <input
                                type="number"
                                min="1"
                                value={longueurTableInput}
                                onChange={(e) => setLongueurTableInput(e.target.value)}
                                className="border rounded px-2 py-1 ml-2 w-16 text-sm"
                            />
                            </label>
                            <button
                            onClick={ajouterTable}
                            className="bg-primary text-white text-sm px-3 py-1 rounded"
                            >
                            Ajouter une table
                            </button>

                            {tableSelectionneeId && (
                            <button
                                onClick={() => supprimerTable(tableSelectionneeId)}
                                className="border border-red-400 text-red-600 text-sm px-3 py-1 rounded"
                            >
                                Supprimer la table sélectionnée
                            </button>
                            )}
                        </div>
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
                      <DndContext sensors={sensors} onDragEnd={(e) => gererFinDrag(e, TAILLE_CASE * zoom)}>
                        <div style={{ position: 'relative', width: largeurPx, height: hauteurPx }}>
                            <svg width={largeurPx} height={hauteurPx} style={{ position: 'absolute', top: 0, left: 0 }}>
                            <GrilleSVG
                                largeurCases={carte.largeur_map}
                                longueurCases={carte.longueur_map}
                                tailleCase={TAILLE_CASE * zoom}
                            />
                            </svg>

                            {tables.map((table) => (
                            <TableDraggable
                                key={table.id}
                                table={table}
                                tailleCasePx={TAILLE_CASE * zoom}
                                selectionnee={tableSelectionneeId === table.id}
                                onSelect={(id) => { setTableSelectionneeId(id); setPanneauOuvert(true) }}
                                couleur={couleurStatut[table.statut] || couleurStatut.vide}
                            />
                            ))}
                        </div>
                        </DndContext>
                    </div>
                  )}
                </>
              )}
            </div>
         {panneauOuvert && tableSelectionnee && (
            <div
              ref={refPanneau}
              className="w-64 shrink-0 border border-secondary-light rounded bg-surface p-4 h-fit sticky top-4"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-display font-bold text-sm">Table</h2>
                <button
                  onClick={fermerPanneau}
                  className="text-sm text-nav-text opacity-60 hover:opacity-100"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="text-sm space-y-1 mb-4">
                <p><strong>Dimensions :</strong> {tableSelectionnee.largeur} × {tableSelectionnee.longueur}</p>
                <p><strong>Position :</strong> x={tableSelectionnee.x}, y={tableSelectionnee.y}</p>
                <p><strong>Statut :</strong> {tableSelectionnee.statut}</p>
              </div>

              <div className="flex flex-col gap-2">
                <button className="border rounded px-3 py-1 text-sm opacity-40 cursor-not-allowed" disabled>
                  Rotation (à venir)
                </button>
                <button className="border rounded px-3 py-1 text-sm opacity-40 cursor-not-allowed" disabled>
                  Affecter un participant (à venir)
                </button>
                <button
                  onClick={() => { supprimerTable(tableSelectionnee.id); fermerPanneau() }}
                  className="border border-red-400 text-red-600 rounded px-3 py-1 text-sm"
                >
                  Supprimer la table
                </button>
              </div>
            </div>
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

function TableDraggable({ table, tailleCasePx, selectionnee, onSelect, couleur }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: table.id
  })

  const style = {
    position: 'absolute',
    left: table.x * tailleCasePx,
    top: table.y * tailleCasePx,
    width: table.largeur * tailleCasePx,
    height: table.longueur * tailleCasePx,
    backgroundColor: couleur,
    border: selectionnee ? '3px solid #000' : '1px solid #374151',
    boxSizing: 'border-box',
    cursor: 'grab',
    touchAction: 'none', // essentiel pour le tactile : empêche le scroll pendant le drag
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#111',
    padding: '2px',
    textAlign: 'center',
    userSelect: 'none'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(table.id)}
      {...listeners}
      {...attributes}
    >
      {table.largeur}×{table.longueur}
    </div>
  )
}