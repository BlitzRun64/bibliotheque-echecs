import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const DEPARTEMENTS = [ 

  {id: 'dep1' , nom : 'Département 1', image: '/image/' , lienOfficiel : ""}
]


function Liens() {
  const [titre, setTitre] = useState("");
  const [url, setUrl] = useState("");
  const [liens, setLiens] = useState([]);

  const ajouterLien = (e) => {
    e.preventDefault();

    if (!titre || !url) return;

    const nouveauLien = {
      id: Date.now(),
      titre: titre,
      url: url
    };

    setLiens([...liens, nouveauLien]);

    setTitre("");
    setUrl("");
  };

  return (
    <div className= "bg-placeholders   ">
      <h2 className="mx-4"> <strong> Ajouter un lien</strong></h2>

      <form onSubmit={ajouterLien}>

        <input
          className = "mx-4  bg-input text-white placeholder-white border border-white rounded px-3 py-2"
          type="text"
          placeholder="Titre du lien"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />

        <input
          className = "mx-4 bg-input text-white placeholder-white border border-white rounded px-3 py-2"
          type="url"
          placeholder="https://exemple.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

       <button
          type="submit"
          className="border border-white bg-[#073b14] text-white px-4 py-2 rounded"
        >
          Ajouter
        </button>

      </form>

      <h2>Mes liens</h2>

      {liens.map((lien) => (
        <div key={lien.id}>
          <a
            href={lien.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {lien.titre}
          </a>
        </div>
      ))}
    </div>
  );
}


export default function Tournois() {
  return (
    <div className="bg-black min-h-screen">
      <div className="admin-page max-w-4xl mx-auto p-4">
        <div className="relative overflow-hidden rounded-lg mb-6">
          <div className="absolute inset-0 motif-damier2"></div>
          <h1 className="z-10 relative text-center text-3xl font-bold text-heading  p-4"><mark className  = "StitreB">Tournois </mark></h1>
          </div>

        <h2 className=""> <strong> Les liens par région</strong></h2>

        <Liens />
      </div>
    </div>
  );
}