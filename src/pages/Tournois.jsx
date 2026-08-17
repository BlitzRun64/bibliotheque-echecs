import { useState } from "react";

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
    <div>
      <h2>Ajouter un lien</h2>

      <form onSubmit={ajouterLien}>

        <input
          type="text"
          placeholder="Titre du lien"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
        />

        <input
          type="url"
          placeholder="https://exemple.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <button type="submit">
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
    <div>
      <h1>Tournois</h1>

      <p>Contenu de la page Tournois</p>

      <Liens />
    </div>
  );
}