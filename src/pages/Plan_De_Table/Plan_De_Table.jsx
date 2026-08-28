import { useEffect, useState , useRef} from 'react'
import { supabase } from '../../supabaseClient'
import { DndContext, useDraggable , useSensor , useSensors, PointerSensor} from '@dnd-kit/core'

const TAILLE_CASE = 24 // pixels par unité de grille

  function dimensionsEffectives(table) {
  const permute = table.rotation === 90 || table.rotation === 270
  return permute
    ? { largeur: table.longueur, longueur: table.largeur }
    : { largeur: table.largeur, longueur: table.longueur }
}

export default function Plan_de_Table() {

  const [evenements, setEvenements] = useState([])
  const [evenementId, setEvenementId] = useState(null)
  const [nouvelEvenement, setNouvelEvenement] = useState('')


  const [participants, setParticipants] = useState([])
  const [prenomInput, setPrenomInput] = useState('')
  const [nomInput, setNomInput] = useState('')
  const [professionInput, setProfessionInput] = useState('')

  const [placements, setPlacements] = useState([])
  const [rechercheParticipant, setRechercheParticipant] = useState('')

  const [cartes, setCartes] = useState([])
  const [carteId, setCarteId] = useState(null)
  const [carte, setCarte] = useState(null)

  const [nomCarteInput, setNomCarteInput] = useState('Jour 1')
  const [largeurInput, setLargeurInput] = useState(20)
  const [longueurInput, setLongueurInput] = useState(15)

  const [zoom, setZoom] = useState(1)
  const [erreur, setErreur] = useState(null)
 

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
  if (evenementId) chargerParticipants()
  else setParticipants([])
}, [evenementId])

useEffect(() => {
  if (carte) chargerPlacements()
  else setPlacements([])
}, [carte, tables])





    async function chargerTables() {
    setErreur(null)
    const { data, error } = await supabase
        .from('pt_table')
        .select('*')
        .eq('map_id', carte.id)
    if (error) { setErreur(error.message); return }
    setTables(data || [])
    }

    async function chargerParticipants() {
        setErreur(null)
        const { data, error } = await supabase
          .from('pt_participant')
          .select('*')
          .eq('evenement_id', evenementId)
          .order('nom')
        if (error) { setErreur(error.message); return }
        setParticipants(data || [])
      }

  async function creerParticipant() {
    if (!prenomInput.trim() || !nomInput.trim()) return
    setErreur(null)
    const { data, error } = await supabase
      .from('pt_participant')
      .insert({
        evenement_id: evenementId,
        prenom: prenomInput.trim(),
        nom: nomInput.trim(),
        profession: professionInput.trim() || null
      })
      .select()
      .single()
    if (error) { setErreur(error.message); return }
    setPrenomInput('')
    setNomInput('')
    setProfessionInput('')
    setParticipants((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
  }

  async function chargerPlacements() {
    if (tables.length === 0) { setPlacements([]); return }
    setErreur(null)
    const idsTables = tables.map((t) => t.id)
    const { data, error } = await supabase
      .from('pt_placement')
      .select('*, pt_participant(*)')
      .in('table_id', idsTables)
    if (error) { setErreur(error.message); return }
    setPlacements(data || [])
  }

  async function assignerParticipant(tableId, participantId) {
    setErreur(null)
    const { data, error } = await supabase
      .from('pt_placement')
      .insert({ table_id: tableId, participant_id: participantId })
      .select('*, pt_participant(*)')
      .single()
    if (error) { setErreur(error.message); return }
    setPlacements((prev) => [...prev, data])
  }

  async function retirerPlacement(placementId) {
    setErreur(null)
    const { error } = await supabase.from('pt_placement').delete().eq('id', placementId)
    if (error) { setErreur(error.message); return }
    setPlacements((prev) => prev.filter((p) => p.id !== placementId))
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

   function couleurTable(table, nbParticipants) {
      if (table.statut === 'reflexion') return '#f97316' // orange
      if (table.statut === 'warning') return '#eab308'    // jaune
      return nbParticipants > 0 ? '#22c55e' : '#ef4444'    // vert / rouge
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

        const dim = dimensionsEffectives(table)
        const deltaXCases = delta.x / tailleCasePx
        const deltaYCases = delta.y / tailleCasePx

        let nouveauX = Math.round(table.x + deltaXCases)
        let nouveauY = Math.round(table.y + deltaYCases)

        // Empêcher de sortir de la carte
        nouveauX = Math.max(0, Math.min(nouveauX, carte.largeur_map - dim.largeur))
        nouveauY = Math.max(0, Math.min(nouveauY, carte.longueur_map - dim.longueur))

        deplacerTable(table.id, nouveauX, nouveauY)
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



async function pivoterTable(table) {
  setErreur(null)
  const nouvelleRotation = (table.rotation + 90) % 360
  const dimApres = dimensionsEffectives({ ...table, rotation: nouvelleRotation })

  // Reclamp la position si la nouvelle empreinte dépasse les bords de la carte
  const nouveauX = Math.max(0, Math.min(table.x, carte.largeur_map - dimApres.largeur))
  const nouveauY = Math.max(0, Math.min(table.y, carte.longueur_map - dimApres.longueur))

  const { data, error } = await supabase
    .from('pt_table')
    .update({ rotation: nouvelleRotation, x: nouveauX, y: nouveauY })
    .eq('id', table.id)
    .select()
    .single()

  if (error) { setErreur(error.message); return }
  setTables((prev) => prev.map((t) => (t.id === data.id ? data : t)))
}

  useEffect(() => {
    if (carte) {
      setLargeurInput(carte.largeur_map)
      setLongueurInput(carte.longueur_map)
    }
  }, [carte])

  useEffect(() => {
  function gererClicExterieur(e) {
    if (!e.target.closest('.popover-table') && !e.target.closest('.table-draggable')) {
      setTableSelectionneeId(null)
    }
  }
  document.addEventListener('mousedown', gererClicExterieur)
  return () => document.removeEventListener('mousedown', gererClicExterieur)
}, [])

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

                  {evenementId && (
                    <div className="flex flex-wrap gap-2 items-center mb-4 border-t pt-3">
                      <input
                        type="text"
                        value={prenomInput}
                        onChange={(e) => setPrenomInput(e.target.value)}
                        placeholder="Prénom"
                        className="border rounded px-2 py-1 text-sm w-28"
                      />
                      <input
                        type="text"
                        value={nomInput}
                        onChange={(e) => setNomInput(e.target.value)}
                        placeholder="Nom"
                        className="border rounded px-2 py-1 text-sm w-28"
                      />
                      <input
                        type="text"
                        value={professionInput}
                        onChange={(e) => setProfessionInput(e.target.value)}
                        placeholder="Profession"
                        className="border rounded px-2 py-1 text-sm w-32"
                      />
                      <button
                        onClick={creerParticipant}
                        className="bg-primary text-white text-sm px-3 py-1 rounded"
                      >
                        Ajouter un participant
                      </button>
                      <span className="text-xs text-nav-text opacity-60">
                        {participants.length} participant{participants.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

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

                            {tables.map((table) => {
                               const placementsTable = placements.filter((p) => p.table_id === table.id)
                               return (
                            <TableDraggable
                                key={table.id}
                                table={table}
                                tailleCasePx={TAILLE_CASE * zoom}
                                selectionnee={tableSelectionneeId === table.id}
                                onSelect={(id) => { setTableSelectionneeId(id)}}
                                onSupprimer={supprimerTable}
                                onPivoter={pivoterTable}
                                couleur={couleurTable[table.statut] || couleurTable.vide}
                                placementsTable={placementsTable}
                                participants={participants}
                                onAssigner={assignerParticipant}
                                onRetirer={retirerPlacement}
                            />
                            )}
                          
                          )}
                        </div>
                        </DndContext>
                    </div>
                  )}
                </>
              )}
            </div>
         
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

function TableDraggable({
  table, tailleCasePx, selectionnee, onSelect, couleur, onPivoter, onSupprimer,
  placementsTable, participants, onAssigner, onRetirer
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: table.id })
  const [recherche, setRecherche] = useState('')

  const dim = dimensionsEffectives(table)

  const style = {
    position: 'absolute',
    left: table.x * tailleCasePx,
    top: table.y * tailleCasePx,
    width: dim.largeur * tailleCasePx,
    height: dim.longueur * tailleCasePx,
    backgroundColor: couleur,
    border: selectionnee ? '3px solid #000' : '1px solid #374151',
    boxSizing: 'border-box',
    cursor: 'grab',
    touchAction: 'none',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: '#111',
    padding: '2px',
    textAlign: 'center',
    userSelect: 'none',
    overflow: 'visible'
  }

  const idsDejaAssignes = placementsTable.map((p) => p.participant_id)
  const participantsDisponibles = participants.filter(
    (p) => !idsDejaAssignes.includes(p.id) &&
      `${p.prenom} ${p.nom}`.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="table-draggable"
      onClick={() => onSelect(table.id)}
      {...listeners}
      {...attributes}
    >
      {placementsTable.length === 0 ? (
        <span>{dim.largeur}×{dim.longueur}</span>
      ) : (
        placementsTable.map((p) => (
          <div key={p.id} style={{ lineHeight: 1.2 }}>
            {p.pt_participant.prenom} {p.pt_participant.nom}
            {p.pt_participant.profession && (
              <div style={{ fontSize: '9px', opacity: 0.8 }}>{p.pt_participant.profession}</div>
            )}
          </div>
        ))
      )}

      {selectionnee && (
        <div
          className="popover-table"
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px', width: '220px',
            background: 'white', border: '1px solid #d1d5db', borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '10px', zIndex: 20, cursor: 'default'
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold">Table</span>
            <button onClick={() => onSelect(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>

          <div className="text-xs space-y-1 mb-3">
            <p>{dim.largeur} × {dim.longueur} — Rotation : {table.rotation}°</p>
          </div>

          <button
            onClick={() => onPivoter(table)}
            className="border rounded px-2 py-1 text-xs hover:bg-gray-50 w-full mb-2"
          >
            ⟳ Pivoter (90°)
          </button>

          <div className="text-xs font-semibold mb-1">Participants ({placementsTable.length})</div>
          {placementsTable.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-xs mb-1">
              <span>{p.pt_participant.prenom} {p.pt_participant.nom}</span>
              <button onClick={() => onRetirer(p.id)} className="text-red-600 opacity-70 hover:opacity-100">✕</button>
            </div>
          ))}

          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un participant..."
            className="border rounded px-2 py-1 text-xs w-full mt-2 mb-1"
          />
          <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
            {participantsDisponibles.slice(0, 20).map((p) => (
              <button
                key={p.id}
                onClick={() => onAssigner(table.id, p.id)}
                className="block w-full text-left text-xs px-1 py-1 hover:bg-gray-50 rounded"
              >
                + {p.prenom} {p.nom}
              </button>
            ))}
          </div>

          <button
            onClick={() => { onSupprimer(table.id); onSelect(null) }}
            className="border border-red-400 text-red-600 rounded px-2 py-1 text-xs w-full mt-3"
          >
            Supprimer la table
          </button>
        </div>
      )}
    </div>
  )
}