// Bandeau damier avec le titre de la page et, en option, une image d'illustration à sa gauche
// (bordure noire de 3 px, coins arrondis).
export default function BandeauTitre({ titre, image, alt = '', niveau: Titre = 'h1' }) {
  return (
    <div className="relative overflow-hidden rounded-lg mb-6">
      <div className="absolute inset-0 motif-damier" aria-hidden="true"></div>
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-5 p-4">
        {image && (
          <img
            src={image}
            alt={alt}
            className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 object-cover rounded-2xl border-[3px] border-black bg-surface shadow-carte"
          />
        )}
        <Titre className="text-center text-2xl sm:text-3xl font-bold text-heading">
          <mark className="StitreB">{titre}</mark>
        </Titre>
      </div>
    </div>
  )
}
