// src/pages/Horloge.jsx
// Onglet de visualisation des composants pixel art (horloge, compte à rebours, date).
import { useState } from 'react'
import PixelNumber from '../components/PixelNumber'
import { Horloge as HorlogePixel, CompteARebours, DatePixel } from '../components/PixelHorloge'

// Valeur par défaut du champ datetime-local : dans 3 jours, à 20h.
function cibleParDefaut() {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  d.setHours(20, 0, 0, 0)
  const deux = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T20:00`
}

function Section({ titre, children }) {
  return (
    <section className="bg-[#073b14] rounded-lg p-4 mb-6">
      <h2 className="text-white font-display font-semibold mb-3">{titre}</h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  )
}

export default function Horloge() {
  const [scale, setScale] = useState(1)
  const [secondes, setSecondes] = useState(true)
  const [cible, setCible] = useState(cibleParDefaut)
  const [style, setStyle] = useState('lettres')
  const [texteLibre, setTexteLibre] = useState('12:34')

  return (
    <div className="bg-black min-h-screen">
      <div className="bg-[#073b14] w-full flex justify-center py-6">
        <HorlogePixel secondes={secondes} scale={scale} />
      </div>

      <div className="bibliochess">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="absolute inset-0 motif-damier"></div>
          <h1 className="z-10 relative text-center text-3xl font-bold text-heading p-4">
            <mark className="StitreB">Horloge</mark>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 items-center mb-6 text-white text-sm">
          <label className="flex items-center gap-2">
            Taille
            <select
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="bg-surface text-text rounded px-2 py-1"
            >
              <option value={1}>Normale (×1)</option>
              <option value={0.5}>Réduite (×½)</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={secondes} onChange={(e) => setSecondes(e.target.checked)} />
            Afficher les secondes
          </label>
        </div>

        <Section titre="Heure">
          <HorlogePixel secondes={secondes} scale={scale} />
        </Section>

        <Section titre="Compte à rebours">
          <div className="flex flex-wrap gap-4 items-center mb-4 text-white text-sm">
            <label className="flex items-center gap-2">
              Jusqu'au
              <input
                type="datetime-local"
                value={cible}
                onChange={(e) => setCible(e.target.value)}
                className="bg-surface text-text rounded px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2">
              Format
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-surface text-text rounded px-2 py-1"
              >
                <option value="lettres">3j 04h 12m 30s</option>
                <option value="deux-points">76:12:30</option>
              </select>
            </label>
          </div>
          {cible && <CompteARebours cible={cible} style={style} secondes={secondes} scale={scale} />}
        </Section>

        <Section titre="Date du jour">
          <DatePixel scale={scale} />
        </Section>

        <Section titre="Texte libre">
          <input
            value={texteLibre}
            onChange={(e) => setTexteLibre(e.target.value)}
            placeholder="Chiffres et : / j h m s"
            className="bg-surface text-text rounded px-3 py-2 mb-4 w-full max-w-xs"
          />
          <div>
            <PixelNumber value={texteLibre} scale={scale} />
          </div>
        </Section>

        <Section titre="Tous les chiffres">
          <PixelNumber value="0123456789" scale={scale} />
        </Section>
      </div>
    </div>
  )
}
