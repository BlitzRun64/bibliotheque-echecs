// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useProfil } from '../useProfil'
import { CATEGORIES, cheminCategorie } from '../config/ressources'
import { MESSAGES_MISE_A_JOUR, verifierMiseAJour } from '../miseAJourPwa'

export default function Navbar() {
  const { utilisateur, profil, estAdmin, chargement: chargementProfil } = useProfil()
  const [demandes, setDemandes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [menuDemandesOuvert, setMenuDemandesOuvert] = useState(false)
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false)
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false)
  const navigate = useNavigate()
  const refDemandes = useRef(null)
  const refProfil = useRef(null)
  const audioRef = useRef(null)
  const [musiqueActive, setMusiqueActive] = useState(false)
  const [playlist, setplaylist] = useState([])
  const [IndexMorceau, setIndexMorceau] = useState(0)
  const [MenuPlaylistOuverte, setMenuPlaylistOuverte] = useState(false)
  const [etatMiseAJour, setEtatMiseAJour] = useState('')
  const [verificationEnCours, setVerificationEnCours] = useState(false)

  // ----- Chargement des données -----

  function chargerPlaylist() {
    return supabase
      .from('playlist')
      .select('*')
      .order('ordre', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erreur lors du chargement de la playlist :', error)
          return
        }
        setplaylist(data || [])
      })
  }

  function chargerDemandes() {
    return supabase
      .from('demandes_emprunt')
      .select('*, livres(titre)')
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false })
      .then(({ data }) => setDemandes(data || []))
  }

  const chargerNotifications = useCallback(() => {
    if (!utilisateur) return Promise.resolve()
    const requete = estAdmin
      ? supabase.from('notifications').select('*').eq('destinataire_admin', true).eq('lue', false)
      : supabase.from('notifications').select('*').eq('destinataire_id', utilisateur.id).eq('lue', false)
    return requete
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifications(data || []))
  }, [utilisateur, estAdmin])

  useEffect(() => {
    chargerPlaylist()
  }, [])

  useEffect(() => {
    if (!profil) return
    if (estAdmin) chargerDemandes()
    chargerNotifications()
  }, [profil, estAdmin, chargerNotifications])

  useEffect(() => {
    function gererClicExterieur(e) {
      if (refDemandes.current && !refDemandes.current.contains(e.target)) {
        setMenuDemandesOuvert(false)
      }
      if (refProfil.current && !refProfil.current.contains(e.target)) {
        setMenuProfilOuvert(false)
      }
    }
    document.addEventListener('mousedown', gererClicExterieur)
    return () => document.removeEventListener('mousedown', gererClicExterieur)
  }, [])

  async function deconnexion() {
    await supabase.auth.signOut()
    setMenuProfilOuvert(false)
    navigate('/')
  }

  async function marquerNotifsLues() {
    const idsAMarquer = notifications.map((n) => n.id)
    if (idsAMarquer.length === 0) return
    await supabase.from('notifications').update({ lue: true }).in('id', idsAMarquer)
  }

  async function verifierLesMisesAJour() {
    setVerificationEnCours(true)
    setEtatMiseAJour('')
    const resultat = await verifierMiseAJour()
    setEtatMiseAJour(MESSAGES_MISE_A_JOUR[resultat])
    setVerificationEnCours(false)
  }

  // ----- Musique -----

  function lancerMusique() {
    if (!audioRef.current) return
    audioRef.current
      .play()
      .then(() => setMusiqueActive(true))
      .catch((error) => console.error('Impossible de lancer la musique :', error))
  }

  function arreterMusique() {
    if (!audioRef.current) return
    audioRef.current.pause()
    setMusiqueActive(false)
  }

  function morceauSuivant() {
    if (playlist.length === 0) return
    setIndexMorceau((i) => (i + 1) % playlist.length)
  }

  function jouerMorceau(i) {
    setIndexMorceau(i)
    setMusiqueActive(true)
  }

  useEffect(() => {
    if (musiqueActive && audioRef.current) {
      audioRef.current
        .play()
        .catch((error) => console.error('Impossible de lire le morceau :', error))
    }
  }, [IndexMorceau, musiqueActive])

  // ----- Onglets -----

  const sousMenuRessources = CATEGORIES.map((categorie) => ({
    label: categorie.libelle,
    to: cheminCategorie(categorie.id),
    couleur: categorie.couleur,
  }))

  const onglets = [
    { label: 'Bibliothèque', to: '/' },
    { label: 'Tournois', to: '/tournois' },
    { label: 'Ressources', to: '/ressources', sousMenu: sousMenuRessources },
    { label: 'Événements', to: '/horloge' },
    { label: "Installer l'app", to: '/installation' },
    // Onglets réservés aux administrateurs.
    ...(estAdmin
      ? [
          { label: 'Administrer', to: '/admin' },
          { label: 'Plan_De_Table', to: '/Plan_De_Table/Plan_De_Table' },
        ]
      : []),
  ]

  return (
    <>
      <nav className="bg-nav-bg border-b border-secondary-light px-4 py-3 flex justify-between items-center relative">
        <div className="flex gap-4 items-center">
          <Link to="https://www.echecs.asso.fr/FicheClub.aspx?Ref=213" className="font-display font-bold text-nav-text">
            Orbec
          </Link>
          <button
            type="button"
            onClick={() => setMenuMobileOuvert(!menuMobileOuvert)}
            className="sm:hidden text-2xl leading-none w-8 h-8 flex items-center justify-center text-nav-text hover:opacity-80"
            aria-label={menuMobileOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuMobileOuvert}
          >
            {menuMobileOuvert ? '✕' : '☰'}
          </button>

          <div className="hidden sm:flex gap-4 items-center">
            {onglets.map((o) =>
              o.sousMenu ? (
                // Sous-menu déplié au survol de « Ressources » (ou au clavier, via le focus).
                <div key={o.to} className="relative group">
                  <Link
                    to={o.to}
                    className="text-sm text-nav-text opacity-80 hover:opacity-100 inline-flex items-center gap-1"
                    aria-haspopup="menu"
                  >
                    {o.label}
                    <span aria-hidden="true" className="text-xs">▾</span>
                  </Link>
                  <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block z-50">
                    <div className="w-56 rounded-lg bg-surface text-text shadow-carte-survol border border-secondary-light overflow-hidden py-1">
                      {o.sousMenu.map((categorie) => (
                        <Link
                          key={categorie.to}
                          to={categorie.to}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-alt focus:bg-surface-alt focus:outline-none"
                        >
                          <span
                            aria-hidden="true"
                            className="w-3 h-3 rounded-full border border-black/30 shrink-0"
                            style={{ backgroundColor: `var(--color-${categorie.couleur})` }}
                          ></span>
                          {categorie.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={o.to} to={o.to} className="text-sm text-nav-text opacity-80 hover:opacity-100">
                  {o.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {playlist.length > 0 && (
            <audio ref={audioRef} src={playlist[IndexMorceau]?.fichier_url} onEnded={morceauSuivant} />
          )}

          <button
            type="button"
            onClick={musiqueActive ? arreterMusique : lancerMusique}
            className={`text-xl leading-none ${musiqueActive ? 'animate-pulse' : ''}`}
            title={musiqueActive ? 'Couper la musique' : 'Lancer la musique'}
            disabled={playlist.length === 0}
          >
            {musiqueActive ? '🎵' : '🔇'}
          </button>

          {playlist.length > 0 && (
            <button
              type="button"
              onClick={() => setMenuPlaylistOuverte(!MenuPlaylistOuverte)}
              className="text-sm text-nav-text opacity-70"
              title="Voir la playlist"
            >
              ▾
            </button>
          )}

          {MenuPlaylistOuverte && (
            <div className="absolute right-0 top-8 w-64 bg-surface text-text border border-secondary-light rounded-lg shadow-carte-survol max-h-72 overflow-y-auto z-50">
              {playlist.map((morceau, i) => (
                <button
                  type="button"
                  key={morceau.id}
                  onClick={() => { jouerMorceau(i); setMenuPlaylistOuverte(false) }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-primary/10 ${i === IndexMorceau ? 'font-semibold text-primary' : ''}`}
                >
                  {i === IndexMorceau && musiqueActive ? '▶ ' : ''}{morceau.titre}
                </button>
              ))}
            </div>
          )}

          {utilisateur && (
            <div className="relative" ref={refDemandes}>
              <button
                type="button"
                onClick={() => { setMenuDemandesOuvert(!menuDemandesOuvert); if (!menuDemandesOuvert) marquerNotifsLues() }}
                className="relative text-xl leading-none"
                aria-label="Notifications"
              >
                📬
                {(demandes.length + notifications.length) > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-text-inverse text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {demandes.length + notifications.length}
                  </span>
                )}
              </button>

              {menuDemandesOuvert && (
                <div className="fixed sm:absolute left-1/2 sm:left-auto right-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 top-16 sm:top-auto sm:mt-2 w-[90vw] sm:w-72 bg-surface text-text border border-secondary-light rounded-lg shadow-carte-survol max-h-72 overflow-y-auto z-50">
                  {estAdmin && demandes.map((d) => (
                    <div key={d.id} className="p-3 border-b border-secondary-light/40 text-sm">
                      <strong>{d.nom_demandeur}</strong> veut emprunter <em>{d.livres?.titre}</em>
                    </div>
                  ))}
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 border-b border-secondary-light/40 text-sm">{n.message}</div>
                  ))}
                  {demandes.length === 0 && notifications.length === 0 && (
                    <p className="text-sm text-text-muted p-3">Rien de nouveau</p>
                  )}
                  {estAdmin && (
                    <Link to="/admin" onClick={() => setMenuDemandesOuvert(false)} className="block text-center text-primary text-sm p-2 hover:bg-surface-alt">
                      Gérer les demandes →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {chargementProfil ? null : utilisateur ? (
            <div className="relative" ref={refProfil}>
              <button
                type="button"
                onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
                className="text-sm text-nav-text flex items-center gap-1"
                aria-expanded={menuProfilOuvert}
              >
                {profil?.nom || '...'} ▾
              </button>
              {menuProfilOuvert && (
                <div className="absolute right-0 mt-2 w-60 bg-surface text-text border border-secondary-light rounded-lg shadow-carte-survol z-50 overflow-hidden">
                  <Link
                    to={estAdmin ? '/admin' : '/profil'}
                    onClick={() => setMenuProfilOuvert(false)}
                    className="block px-4 py-2 text-sm hover:bg-surface-alt"
                  >
                    {estAdmin ? 'Admin' : 'Mon profil'}
                  </Link>
                  <button
                    type="button"
                    onClick={verifierLesMisesAJour}
                    disabled={verificationEnCours}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-surface-alt disabled:opacity-60"
                  >
                    {verificationEnCours ? 'Vérification…' : 'Vérifier les mises à jour'}
                  </button>
                  {etatMiseAJour && (
                    <p role="status" className="px-4 pb-2 text-xs text-text-muted">{etatMiseAJour}</p>
                  )}
                  <button
                    type="button"
                    onClick={deconnexion}
                    className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface-alt"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary btn-sm">Connexion</Link>
          )}
        </div>
      </nav>

      {menuMobileOuvert && (
        <div className="sm:hidden fixed inset-0 top-[57px] bg-surface z-40 flex flex-col overflow-y-auto">
          {onglets.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              onClick={() => setMenuMobileOuvert(false)}
              className="text-lg font-onglets border-b border-secondary-light/40 px-6 py-4"
            >
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
