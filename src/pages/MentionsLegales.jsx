import BandeauTitre from '../components/BandeauTitre'

// ============================================================================================
// Informations à compléter par le club. Tant qu'une valeur commence par « [À COMPLÉTER », elle
// s'affiche surlignée sur la page pour qu'on ne l'oublie pas.
// ============================================================================================
const CLUB = {
  nom: "Club d'échecs d'Orbec",
  contact: 'fabien.gervais17@laposte.net',
  regionSupabase: "Union européenne",
  miseAJour: '18 novembre 2026',
}

function Valeur({ children }) {
  const aCompleter = typeof children === 'string' && children.startsWith('[À COMPLÉTER')
  return aCompleter ? <mark className="bg-yellow-200 px-1 rounded">{children}</mark> : <>{children}</>
}

function Section({ titre, children }) {
  return (
    <section className="bg-surface text-text rounded-lg p-4 sm:p-6 mb-4 shadow-carte">
      <h2 className="text-xl font-bold text-primary mb-3">{titre}</h2>
      <div className="space-y-3 text-sm sm:text-base leading-relaxed">{children}</div>
    </section>
  )
}

export default function MentionsLegales() {
  return (
    <div className="bg-bg min-h-screen">
      <div className="max-w-4xl mx-auto p-4">
        <BandeauTitre titre="Mentions légales" />

        <Section titre="Éditeur du site">
          <p>
            Ce site est édité par Fabien Gervais .<br />
            
            
            Contact : <Valeur>{CLUB.contact}</Valeur>
          </p>
        </Section>

        <Section titre="Hébergement">
          <p>
            <strong>Site</strong> : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">vercel.com</a>
          </p>
          <p>
            <strong>Base de données et comptes</strong> : Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992 —{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">supabase.com</a>.
            Région de stockage des données : <Valeur>{CLUB.regionSupabase}</Valeur>.
          </p>
        </Section>

        <Section titre="Données personnelles (RGPD)">
          <p>
            Le responsable du traitement est le {CLUB.nom}, représenté par son responsable de la publication. Le club ne
            collecte que les données utiles au fonctionnement de la bibliothèque et des activités du club. Elles ne sont
            ni vendues, ni cédées, ni utilisées à des fins publicitaires.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-primary">
                  <th className="py-2 pr-3">Données</th>
                  <th className="py-2 pr-3">Pourquoi</th>
                  <th className="py-2">Conservation</th>
                </tr>
              </thead>
              <tbody className="align-top">
                <tr className="border-b border-secondary-light/40">
                  <td className="py-2 pr-3">Compte : nom, adresse e-mail, mot de passe (stocké chiffré, illisible par le club)</td>
                  <td className="py-2 pr-3">Se connecter, emprunter des livres, recevoir les notifications</td>
                  <td className="py-2">Jusqu'à la suppression du compte, au plus tard 3 ans après la dernière connexion</td>
                </tr>
                <tr className="border-b border-secondary-light/40">
                  <td className="py-2 pr-3">Demandes d'emprunt : nom, adresse e-mail (facultative sans compte)</td>
                  <td className="py-2 pr-3">Traiter la demande et contacter l'emprunteur</td>
                  <td className="py-2">1 an après la réponse à la demande</td>
                </tr>
                <tr className="border-b border-secondary-light/40">
                  <td className="py-2 pr-3">Prêts et historique des livres : emprunteur, dates</td>
                  <td className="py-2 pr-3">Suivre les livres prêtés et leur retour</td>
                  <td className="py-2">3 ans après le retour du livre</td>
                </tr>
                
              </tbody>
            </table>
          </div>

          <p>
            <strong>Base légale</strong> : l'adhésion au club et l'utilisation du service que vous demandez (prêt de
            livres, compte), ainsi que l'intérêt légitime du club à organiser ses activités.
          </p>
          <p>
            <strong>Qui y a accès</strong> : uniquement les administrateurs du club, et nos hébergeurs pour le seul
            stockage technique. Certains hébergeurs étant établis hors de l'Union européenne, ces transferts sont encadrés
            par les clauses contractuelles types de la Commission européenne.
          </p>
          <p>
            <strong>Vos droits</strong> : vous pouvez accéder à vos données, les faire corriger ou supprimer, vous opposer
            à leur traitement, en limiter l'usage ou en demander une copie. Écrivez à <Valeur>{CLUB.contact}</Valeur> : le
            club répond sous un mois. Si la réponse ne vous satisfait pas, vous pouvez adresser une réclamation à la{' '}
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-primary underline">CNIL</a>.
          </p>
        </Section>

        <Section titre="Cookies et stockage local">
          <p>
            Ce site n'utilise <strong>aucun cookie publicitaire ni outil de mesure d'audience</strong>. Il enregistre
            seulement dans votre navigateur ce qui est indispensable à son fonctionnement : votre session de connexion et
            les fichiers de l'application installable (fonctionnement hors ligne). Ces éléments sont exemptés de
            consentement ; aucun bandeau n'est donc nécessaire.
          </p>
          <p>
            Les polices de caractères sont hébergées sur le site lui-même : aucune donnée n'est transmise à Google Fonts.
          </p>
        </Section>

        <Section titre="Propriété intellectuelle et crédits">
          <p>
            Les textes, la mise en page et le code de ce site appartiennent au {CLUB.nom}, sauf mention contraire.
          </p>
          <p>
            Le nom et le logo de la Fédération Française des Échecs sont des marques de la FFE, utilisés pour renvoyer vers
            son site. Les noms YouTube, Lichess et les autres services cités appartiennent à leurs propriétaires
            respectifs. Les blasons des départements sont des armoiries publiques.
          </p>
          <p>
            Polices : <em>Fraunces</em> (Undercase Type) et <em>Cormorant Garamond</em> (Christian Thalmann), sous
            licence SIL Open Font License.
          </p>
          <p>
            Les liens vers des sites extérieurs (FFE, YouTube, Lichess, tournois) sont fournis à titre d'information : le
            club n'est pas responsable de leur contenu.
          </p>
        </Section>

        <p className="text-center text-xs text-text-inverse/60 mt-2">Dernière mise à jour : {CLUB.miseAJour}</p>
      </div>
    </div>
  )
}
