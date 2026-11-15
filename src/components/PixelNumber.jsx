// src/components/PixelNumber.jsx
// Affiche une chaîne comme "14:35", "15/11/2026" ou "3j 12h" avec les sprites
// de public/image/pawn.png (planche verticale : une frame de 96×128 par chiffre, 0 en haut).
// Les séparateurs (: / j h m s, espace) sont dessinés en pixel art par le code.
import { useEffect, useState } from 'react'

const PLANCHE = '/image/pawn.png'
const LARGEUR = 96 // largeur d'une frame en px
const HAUTEUR = 128 // hauteur d'une frame en px
const PIXEL = 4 // taille d'un "gros pixel" des séparateurs, à l'échelle 1

// Glyphes des séparateurs, en grille de pixels ("#" = pixel plein).
const GLYPHES = {
  ':': ['#', '.', '.', '#'],
  '/': ['..#', '..#', '.#.', '.#.', '#..', '#..'],
  j: ['..#', '...', '..#', '..#', '..#', '#.#', '.#.'],
  h: ['#..', '#..', '##.', '#.#', '#.#'],
  m: ['##.#.', '#.#.#', '#.#.#', '#.#.#'],
  s: ['.##', '#..', '.#.', '..#', '##.'],
}

function Chiffre({ valeur, scale }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: LARGEUR * scale,
        height: HAUTEUR * scale,
        backgroundImage: `url(${PLANCHE})`,
        backgroundSize: `${LARGEUR * scale}px ${HAUTEUR * 10 * scale}px`,
        backgroundPosition: `0 ${-valeur * HAUTEUR * scale}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }}
    />
  )
}

function Separateur({ caractere, scale, couleur, contour }) {
  const lignes = GLYPHES[caractere]
  // Un espace : simple marge.
  if (!lignes) return <span aria-hidden="true" style={{ display: 'inline-block', width: 24 * scale }} />

  const h = lignes.length
  const w = Math.max(...lignes.map((l) => l.length))
  const plein = (x, y) => lignes[y]?.[x] === '#'

  // Contour d'1 pixel autour du glyphe (comme le liseré des chiffres).
  const cellsContour = []
  const cellsPleines = []
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      if (plein(x, y)) cellsPleines.push([x, y])
      else if ([-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => plein(x + dx, y + dy))))
        cellsContour.push([x, y])
    }
  }

  const p = PIXEL * scale
  return (
    <svg
      aria-hidden="true"
      width={(w + 2) * p}
      height={(h + 2) * p}
      viewBox={`-1 -1 ${w + 2} ${h + 2}`}
      shapeRendering="crispEdges"
      style={{ margin: `0 ${2 * scale}px` }}
    >
      {cellsContour.map(([x, y]) => (
        <rect key={`c${x},${y}`} x={x} y={y} width="1" height="1" fill={contour} />
      ))}
      {cellsPleines.map(([x, y]) => (
        <rect key={`p${x},${y}`} x={x} y={y} width="1" height="1" fill={couleur} />
      ))}
    </svg>
  )
}

// Taille par défaut : ×1 sur ordinateur, ×½ sur téléphone (écran < 640 px, comme "sm" de Tailwind).
const REQUETE_ORDI = '(min-width: 640px)'
function useEchelleAuto() {
  const [ordi, setOrdi] = useState(() => window.matchMedia(REQUETE_ORDI).matches)
  useEffect(() => {
    const mq = window.matchMedia(REQUETE_ORDI)
    const maj = () => setOrdi(mq.matches)
    mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])
  return ordi ? 1 : 0.5
}

function Groupe({ texte, scale, couleur, contour }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {[...texte].map((c, i) =>
        /\d/.test(c) ? (
          <Chiffre key={i} valeur={Number(c)} scale={scale} />
        ) : (
          <Separateur key={i} caractere={c.toLowerCase()} scale={scale} couleur={couleur} contour={contour} />
        ),
      )}
    </span>
  )
}

/**
 * @param {string|number} value   texte à afficher : chiffres + séparateurs (: / j h m s espace)
 *                                Les espaces permettent le retour à la ligne sur petit écran.
 * @param {number} scale          1 = taille réelle (128 px de haut), 0.5 = réduit.
 *                                Si absent : 1 sur ordinateur, 0.5 sur téléphone.
 * @param {string} couleur        couleur des séparateurs
 * @param {string} contour        couleur du liseré des séparateurs
 * @param {string} label          texte lu par les lecteurs d'écran (par défaut : value)
 */
export default function PixelNumber({
  value,
  scale,
  couleur = '#ffffff',
  contour = '#1a1a1a',
  label,
  className = '',
}) {
  const echelleAuto = useEchelleAuto()
  const s = scale ?? echelleAuto
  const texte = String(value)
  const groupes = texte.split(' ').filter(Boolean)
  return (
    <span
      role="img"
      aria-label={label ?? texte}
      className={className}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 24 * s,
        lineHeight: 0,
        maxWidth: '100%',
      }}
    >
      {groupes.map((g, i) => (
        <Groupe key={i} texte={g} scale={s} couleur={couleur} contour={contour} />
      ))}
    </span>
  )
}
