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

// Sections régionales : en-tête bleu FFE, regroupent leurs départements et proposent la frise.
// Les départements qui n'appartiennent à aucune région restent affichés seuls, sous les régions.
const REGIONS = [
  { id: 'normandie', nom: 'Normandie', departements: ['dep1', 'dep2', 'dep3', 'dep4', 'dep5'] },
]

// Une image par cadence, de la plus rapide à la plus lente (pixel art 20×20 ou 40×40 dans
// public/image/cadences/). Tant que l'image n'existe pas, la pastille affiche le symbole de secours.
const CADENCES = {
  bullet: { libelle: 'Bullet', image: '/image/cadences/bullet.png', secours: '🚀' },
  blitz: { libelle: 'Blitz', image: '/image/cadences/blitz.png', secours: '⚡' },
  rapide: { libelle: 'Rapide', image: '/image/cadences/rapide.png', secours: '🐇' },
  lent: { libelle: 'Lent', image: '/image/cadences/lent.png', secours: '🐢' },
}

const FORMULAIRE_VIDE = { titre: '', url: '', date_debut: '', date_fin: '', cadence: 'lent' }

// --- Dates -----------------------------------------------------------------------------------
// Les dates arrivent de Supabase au format 'AAAA-MM-JJ' : on les lit en UTC pour que le calcul
// de durée ne soit pas faussé par le changement d'heure.
function versUTC(iso) {
  const [a, m, j] = iso.split('-').map(Number)
  return Date.UTC(a, m - 1, j)
}

function aujourdhuiISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Nombre de jours, bornes incluses : du 16 au 16 = 1 jour, du 15 au 16 = 2 jours.
function dureeEnJours(debut, fin) {
  return Math.round((versUTC(fin) - versUTC(debut)) / 86400000) + 1
}

function periode(duree) {
  if (duree <= 1) return 'Journée'
  if (duree <= 3) return 'Week-end'
  return 'Semaine'
}

function libelleTournoi(lien) {
  const duree = dureeEnJours(lien.date_debut, lien.date_fin)
  return `${periode(duree)} du  ${lien.titre} (${duree} jour${duree > 1 ? 's' : ''})`
}

// « 16 NOV. 2026 »
function enTeteDate(iso) {
  return new Date(versUTC(iso))
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .toUpperCase()
}

function dateCourte(iso) {
  return new Date(versUTC(iso)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// --- Composants ------------------------------------------------------------------------------
function PastilleCadence({ cadence }) {
  const [imageAbsente, setImageAbsente] = useState(false)
  const infos = CADENCES[cadence] || CADENCES.lent

  return (
    <span
      className="relative z-10 w-12 h-12 shrink-0 rounded-full bg-frise-pastille border-4 border-frise-ligne flex items-center justify-center overflow-hidden text-xl"
      title={infos.libelle}
    >
      {imageAbsente ? (
        <span aria-hidden="true">{infos.secours}</span>
      ) : (
        // pixelated : l'agrandissement ×2 garde des pixels nets au lieu de les flouter.
        <img src={infos.image} alt="" className="w-full h-full object-cover [image-rendering:pixelated]" onError={() => setImageAbsente(true)} />
      )}
      <span className="sr-only">Cadence {infos.libelle}</span>
    </span>
  )
}

// Frise façon Lichess : un titre par date de début, puis une ligne par tournoi qui commence ce jour-là.
function FriseTournois({ liens }) {
  const [voirPasses, setVoirPasses] = useState(false)
  const aujourdhui = aujourdhuiISO()

  const dates = liens.filter((l) => l.date_debut && l.date_fin)
  const passes = dates.filter((l) => l.date_fin < aujourdhui)
  const affiches = (voirPasses ? dates : dates.filter((l) => l.date_fin >= aujourdhui))
    .slice()
    .sort((a, b) => a.date_debut.localeCompare(b.date_debut) || a.titre.localeCompare(b.titre))
  const sansDate = liens.length - dates.length

  const groupes = []
  for (const lien of affiches) {
    const dernier = groupes[groupes.length - 1]
    if (dernier && dernier.date === lien.date_debut) dernier.liens.push(lien)
    else groupes.push({ date: lien.date_debut, liens: [lien] })
  }

  const nomDepartement = (id) => DEPARTEMENTS.find((d) => d.id === id)?.nom ?? ''

  return (
    <div className="rounded-lg bg-frise-fond text-text-inverse p-4">
      {passes.length > 0 && (
        <button type="button" onClick={() => setVoirPasses(!voirPasses)} className="btn btn-ghost btn-sm mb-3">
          {voirPasses ? 'Masquer les tournois passés' : `Afficher les tournois passés (${passes.length})`}
        </button>
      )}

      {groupes.length === 0 && <p className="text-sm text-text-inverse/70">Aucun tournoi à venir.</p>}

      {groupes.map((groupe) => (
        <section key={groupe.date} className="mb-4 last:mb-0">
          <h3 className="font-bold text-frise-date tracking-wide mb-2">{enTeteDate(groupe.date)}</h3>
          <ol className="relative ml-6">
            {/* Trait vertical qui relie les pastilles, centré sous elles (pastille de 48 px). */}
            <span aria-hidden="true" className="absolute left-[22px] top-0 bottom-0 w-1 bg-frise-ligne" />
            {groupe.liens.map((lien) => (
              <li
                key={lien.id}
                className={`relative flex items-center gap-4 py-1.5 ${lien.date_fin < aujourdhui ? 'opacity-50' : ''}`}
              >
                <PastilleCadence cadence={lien.cadence} />
                <a
                  href={lien.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 hover:underline"
                >
                  {libelleTournoi(lien)}
                </a>
                <span className="text-sm text-text-inverse/60 shrink-0 hidden sm:inline">
                  {nomDepartement(lien.departement)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {sansDate > 0 && (
        <p className="text-xs text-text-inverse/60 mt-3">
          {sansDate} lien(s) sans dates ne figurent pas sur la frise : à compléter avec le crayon.
        </p>
      )}
    </div>
  )
}

function FormulaireLien({ initial, onValider, onAnnuler }) {
  const [champs, setChamps] = useState(initial)
  const [erreur, setErreur] = useState('')

  const changer = (cle) => (e) => setChamps({ ...champs, [cle]: e.target.value })

  function soumettre(e) {
    e.preventDefault()
    const titre = champs.titre.trim()
    const url = champs.url.trim()
    if (!titre || !url || !champs.date_debut || !champs.date_fin || !champs.cadence) {
      setErreur('Tous les champs sont obligatoires.')
      return
    }
    if (champs.date_fin < champs.date_debut) {
      setErreur('La date de fin précède la date de début.')
      return
    }
    setErreur('')
    onValider({ ...champs, titre, url }).then((message) => {
      if (message) setErreur(message)
      else if (!onAnnuler) setChamps(FORMULAIRE_VIDE)
    })
  }

  return (
    <form onSubmit={soumettre} className="flex flex-wrap items-end gap-2">
      <input placeholder="Nom du tournoi" value={champs.titre} onChange={changer('titre')} className="champ flex-1 min-w-40" />
      <input placeholder="https://..." type="url" value={champs.url} onChange={changer('url')} className="champ flex-1 min-w-40" />
      <label className="flex flex-col text-xs text-text-muted">
        Début
        <input type="date" value={champs.date_debut} onChange={changer('date_debut')} className="champ" />
      </label>
      <label className="flex flex-col text-xs text-text-muted">
        Fin
        <input type="date" value={champs.date_fin} min={champs.date_debut || undefined} onChange={changer('date_fin')} className="champ" />
      </label>
      <label className="flex flex-col text-xs text-text-muted">
        Cadence
        <select value={champs.cadence} onChange={changer('cadence')} className="champ">
          {Object.entries(CADENCES).map(([cle, c]) => (
            <option key={cle} value={cle}>{c.libelle}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn-primary btn-sm">
        {onAnnuler ? 'Enregistrer' : 'Ajouter'}
      </button>
      {onAnnuler && (
        <button type="button" onClick={onAnnuler} className="btn btn-secondary btn-sm">
          Annuler
        </button>
      )}
      {erreur && <p className="w-full text-sm text-danger">{erreur}</p>}
    </form>
  )
}

function SectionDepartement({ departement, ouvert, onToggle, liens, estAdmin, onAjoutLien, onModifierLien, onSupprimerLien }) {
  const [enEdition, setEnEdition] = useState(null)

  return (
    <div className="border border-secondary-light rounded-lg overflow-hidden mb-4 last:mb-0 bg-surface">
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
            {liens.map((lien) =>
              enEdition === lien.id ? (
                <li key={lien.id} className="py-2">
                  <FormulaireLien
                    initial={{
                      titre: lien.titre,
                      url: lien.url,
                      date_debut: lien.date_debut ?? '',
                      date_fin: lien.date_fin ?? '',
                      cadence: lien.cadence ?? 'lent',
                    }}
                    onValider={(champs) =>
                      onModifierLien(lien.id, champs).then((message) => {
                        if (!message) setEnEdition(null)
                        return message
                      })
                    }
                    onAnnuler={() => setEnEdition(null)}
                  />
                </li>
              ) : (
                <li key={lien.id} className="flex justify-between items-center gap-2 py-1 text-sm">
                  <span className="min-w-0">
                    <a href={lien.url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                      {lien.titre}
                    </a>
                    {lien.date_debut && lien.date_fin && (
                      <span className="text-text-muted">
                        {' · '}
                        {lien.date_debut === lien.date_fin
                          ? dateCourte(lien.date_debut)
                          : `${dateCourte(lien.date_debut)} → ${dateCourte(lien.date_fin)}`}
                        {lien.cadence && ` · ${CADENCES[lien.cadence]?.libelle ?? lien.cadence}`}
                      </span>
                    )}
                  </span>
                  {estAdmin && (
                    <span className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEnEdition(lien.id)}
                        className="btn btn-secondary btn-sm btn-icone"
                        aria-label={`Modifier le lien ${lien.titre}`}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => onSupprimerLien(lien.id)}
                        className="btn btn-danger btn-sm btn-icone"
                        aria-label={`Supprimer le lien ${lien.titre}`}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </span>
                  )}
                </li>
              )
            )}
          </ul>

          {estAdmin && (
            <FormulaireLien initial={FORMULAIRE_VIDE} onValider={(champs) => onAjoutLien(departement.id, champs)} />
          )}
        </div>
      )}
    </div>
  )
}

function SectionRegion({ region, liens, children }) {
  const [ouvert, setOuvert] = useState(true)
  const [vue, setVue] = useState('departements')

  const ongletClasse = (actif) =>
    `btn btn-sm ${actif ? 'btn-primary' : 'btn-ghost text-text-inverse'}`

  return (
    <div className="border-2 border-ffe rounded-lg overflow-hidden mb-6">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-ffe hover:bg-ffe-light text-text-inverse text-left transition-colors"
      >
        <span className="text-xl font-bold">{region.nom}</span>
        <span className="flex items-center gap-2 text-sm text-text-inverse/80">
          {ouvert ? 'Replier' : 'Déplier'}
          <span aria-hidden="true" className={`transition-transform ${ouvert ? 'rotate-90' : ''}`}>▶</span>
        </span>
      </button>

      {ouvert && (
        <div className="p-3">
          <div className="flex gap-2 mb-3" role="group" aria-label="Affichage">
            <button
              type="button"
              aria-pressed={vue === 'departements'}
              onClick={() => setVue('departements')}
              className={ongletClasse(vue === 'departements')}
            >
              Départements
            </button>
            <button
              type="button"
              aria-pressed={vue === 'frise'}
              onClick={() => setVue('frise')}
              className={ongletClasse(vue === 'frise')}
            >
              Parcours temporel
            </button>
          </div>

          {vue === 'frise' ? <FriseTournois liens={liens} /> : children}
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

  // Renvoient un message d'erreur (ou null) que le formulaire affiche.
  async function ajouterLien(departementId, champs) {
    const { error } = await supabase.from('liens_tournois').insert({ departement: departementId, ...champs })
    if (error) return `Ajout impossible : ${error.message}`
    await chargerLiens()
    return null
  }

  async function modifierLien(id, champs) {
    const { error } = await supabase.from('liens_tournois').update(champs).eq('id', id)
    if (error) return `Modification impossible : ${error.message}`
    await chargerLiens()
    return null
  }

  async function supprimerLien(id) {
    await supabase.from('liens_tournois').delete().eq('id', id)
    chargerLiens()
  }

  const rendreDepartement = (dep) => (
    <SectionDepartement
      key={dep.id}
      departement={dep}
      ouvert={sectionOuverte === dep.id}
      onToggle={() => setSectionOuverte(sectionOuverte === dep.id ? null : dep.id)}
      liens={liens.filter((l) => l.departement === dep.id)}
      estAdmin={estAdmin}
      onAjoutLien={ajouterLien}
      onModifierLien={modifierLien}
      onSupprimerLien={supprimerLien}
    />
  )

  const departementsRegionaux = REGIONS.flatMap((r) => r.departements)
  const departementsSeuls = DEPARTEMENTS.filter((d) => !departementsRegionaux.includes(d.id))

  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        <BandeauTitre titre="Tournois" />

        {REGIONS.map((region) => (
          <SectionRegion
            key={region.id}
            region={region}
            liens={liens.filter((l) => region.departements.includes(l.departement))}
          >
            {DEPARTEMENTS.filter((d) => region.departements.includes(d.id)).map(rendreDepartement)}
          </SectionRegion>
        ))}

        {departementsSeuls.map(rendreDepartement)}
      </div>
    </div>
  )
}
