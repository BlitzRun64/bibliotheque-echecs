// src/pages/Horloge.jsx
// Onglet Horloge : l'heure en haut, puis une section par événement avec son compte à rebours.
// Les événements sont dans la table Supabase "evenements" (voir supabase/evenements.sql).
// Seuls les administrateurs voient et utilisent les boutons d'ajout / modification / suppression.
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Horloge as HorlogePixel, CompteARebours } from '../components/PixelHorloge'

const deux = (n) => String(n).padStart(2, '0')

// Date ISO (base) -> valeur d'un <input type="datetime-local"> en heure locale.
function versChampLocal(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`
}

function dateLisible(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Formulaire réutilisé pour l'ajout et la modification.
function FormulaireEvenement({ initial, onValider, onAnnuler, libelle }) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [date, setDate] = useState(initial ? versChampLocal(initial.date_cible) : '')
  const [erreur, setErreur] = useState('')

  async function valider(e) {
    e.preventDefault()
    if (!nom.trim() || !date) {
      setErreur('Indique un nom et une date.')
      return
    }
    const message = await onValider({ nom: nom.trim(), date_cible: new Date(date).toISOString() })
    if (message) setErreur(message)
  }

  return (
    <form onSubmit={valider} className="flex flex-wrap gap-2 items-center text-sm">
      <input
        value={nom}
        onChange={(e) => { setNom(e.target.value); setErreur('') }}
        placeholder="Nom de l'événement"
        className="bg-surface text-text rounded px-3 py-2 flex-1 min-w-48"
      />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => { setDate(e.target.value); setErreur('') }}
        className="bg-surface text-text rounded px-3 py-2"
      />
      <button type="submit" className="bg-primary hover:bg-primary-light text-white rounded px-3 py-2">
        {libelle}
      </button>
      {onAnnuler && (
        <button type="button" onClick={onAnnuler} className="bg-surface text-text rounded px-3 py-2">
          Annuler
        </button>
      )}
      {erreur && <p className="w-full text-red-300">{erreur}</p>}
    </form>
  )
}

function SectionEvenement({ evenement, estAdmin, onModifier, onSupprimer }) {
  const [enEdition, setEnEdition] = useState(false)
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const termine = new Date(evenement.date_cible).getTime() <= maintenant

  // Vérifie chaque seconde si l'événement est passé (pour afficher "C'est parti !").
  useEffect(() => {
    if (termine) return
    const id = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(id)
  }, [termine])

  return (
    <section className="bg-[#073b14] rounded-lg p-4 mb-6">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
        <div>
          <h2 className="text-white font-display font-semibold text-xl">{evenement.nom}</h2>
          <p className="text-white/70 text-sm first-letter:uppercase">{dateLisible(evenement.date_cible)}</p>
        </div>
        {estAdmin && !enEdition && (
          <div className="flex gap-2">
            <button
              onClick={() => setEnEdition(true)}
              className="text-xs bg-primary hover:bg-primary-light text-white rounded px-2 py-1"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer l'événement « ${evenement.nom} » ?`)) onSupprimer(evenement.id)
              }}
              className="text-xs bg-accent text-white rounded px-2 py-1"
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>

      {enEdition && (
        <div className="mb-4">
          <FormulaireEvenement
            initial={evenement}
            libelle="Enregistrer"
            onAnnuler={() => setEnEdition(false)}
            onValider={async (valeurs) => {
              const message = await onModifier(evenement.id, valeurs)
              if (!message) setEnEdition(false)
              return message
            }}
          />
        </div>
      )}

      {termine ? (
        <p className="text-white text-2xl font-display font-bold">C'est parti !</p>
      ) : (
        <CompteARebours cible={evenement.date_cible} />
      )}
    </section>
  )
}

export default function Horloge() {
  const [profil, setProfil] = useState(null)
  const [evenements, setEvenements] = useState([])
  const [chargement, setChargement] = useState(true)
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const estAdmin = !!profil?.est_admin

  useEffect(() => {
    chargerProfil()
    chargerEvenements()
  }, [])

  async function chargerProfil() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profils').select('*').eq('id', user.id).single()
    setProfil(data)
  }

  async function chargerEvenements() {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .order('date_cible', { ascending: true })
    if (error) console.error('Erreur lors du chargement des événements :', error)
    setEvenements(data || [])
    setChargement(false)
  }

  // Chaque action renvoie un message d'erreur, ou rien si tout s'est bien passé.
  async function ajouter(valeurs) {
    const { error } = await supabase.from('evenements').insert(valeurs)
    if (error) return `Impossible d'ajouter : ${error.message}`
    setAjoutOuvert(false)
    chargerEvenements()
  }

  async function modifier(id, valeurs) {
    const { error } = await supabase.from('evenements').update(valeurs).eq('id', id)
    if (error) return `Impossible de modifier : ${error.message}`
    chargerEvenements()
  }

  async function supprimer(id) {
    const { error } = await supabase.from('evenements').delete().eq('id', id)
    if (error) alert(`Impossible de supprimer : ${error.message}`)
    chargerEvenements()
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="bg-[#073b14] w-full flex justify-center py-6 px-4">
        <HorlogePixel secondes />
      </div>

      <div className="bibliochess">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="absolute inset-0 motif-damier"></div>
          <h1 className="z-10 relative text-center text-3xl font-bold text-heading p-4">
            <mark className="StitreB">Événements</mark>
          </h1>
        </div>

        {estAdmin && (
          <div className="mb-6">
            {ajoutOuvert ? (
              <div className="bg-[#073b14] rounded-lg p-4">
                <FormulaireEvenement libelle="Ajouter" onValider={ajouter} onAnnuler={() => setAjoutOuvert(false)} />
              </div>
            ) : (
              <button
                onClick={() => setAjoutOuvert(true)}
                className="bg-secondary text-black rounded px-3 py-2 text-sm"
              >
                ➕ Nouvel événement
              </button>
            )}
          </div>
        )}

        {chargement ? (
          <p className="text-white/70">Chargement…</p>
        ) : evenements.length === 0 ? (
          <p className="text-white/70">Aucun événement pour le moment.</p>
        ) : (
          evenements.map((ev) => (
            <SectionEvenement
              key={ev.id}
              evenement={ev}
              estAdmin={estAdmin}
              onModifier={modifier}
              onSupprimer={supprimer}
            />
          ))
        )}
      </div>
    </div>
  )
}
