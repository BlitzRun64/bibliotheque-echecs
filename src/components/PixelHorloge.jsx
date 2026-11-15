// src/components/PixelHorloge.jsx
// Composants prêts à l'emploi construits sur PixelNumber :
//   <Horloge />                         heure qui avance (HH:MM ou HH:MM:SS)
//   <CompteARebours cible={date} />     temps restant (3j 04h 12m 30s ou 04:12:30)
//   <DatePixel date={date} />           date au format JJ/MM/AAAA
import { useEffect, useState } from 'react'
import PixelNumber from './PixelNumber'

const deux = (n) => String(n).padStart(2, '0')

// Renvoie la date courante, rafraîchie toutes les `intervalle` ms.
function useMaintenant(intervalle = 1000) {
  const [maintenant, setMaintenant] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setMaintenant(new Date()), intervalle)
    return () => clearInterval(id)
  }, [intervalle])
  return maintenant
}

export function Horloge({ secondes = false, ...props }) {
  const d = useMaintenant(1000)
  const texte = `${deux(d.getHours())}:${deux(d.getMinutes())}${secondes ? ':' + deux(d.getSeconds()) : ''}`
  return <PixelNumber value={texte} label={`Il est ${texte}`} {...props} />
}

/**
 * @param {Date|string|number} cible   date/heure de fin
 * @param {'lettres'|'deux-points'} style  "3j 04h 12m 30s" ou "04:12:30"
 * @param {boolean} secondes           afficher les secondes
 */
export function CompteARebours({ cible, style = 'lettres', secondes = true, ...props }) {
  const d = useMaintenant(1000)
  const reste = Math.max(0, Math.floor((new Date(cible) - d) / 1000))
  const j = Math.floor(reste / 86400)
  const h = Math.floor((reste % 86400) / 3600)
  const m = Math.floor((reste % 3600) / 60)
  const s = reste % 60

  let texte
  if (style === 'deux-points') {
    const heures = j * 24 + h
    texte = `${deux(heures)}:${deux(m)}${secondes ? ':' + deux(s) : ''}`
  } else {
    const morceaux = []
    if (j > 0) morceaux.push(`${j}j`)
    morceaux.push(`${deux(h)}h`, `${deux(m)}m`)
    if (secondes) morceaux.push(`${deux(s)}s`)
    texte = morceaux.join(' ')
  }
  return <PixelNumber value={texte} label={`Il reste ${texte}`} {...props} />
}

export function DatePixel({ date = new Date(), annee = true, ...props }) {
  const d = new Date(date)
  const texte = `${deux(d.getDate())}/${deux(d.getMonth() + 1)}${annee ? '/' + d.getFullYear() : ''}`
  return <PixelNumber value={texte} label={d.toLocaleDateString('fr-FR')} {...props} />
}
