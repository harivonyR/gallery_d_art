// Page d'administration : verifie le login/mot de passe par rapport a
// data/user.json, puis affiche le stock des oeuvres depuis data/article.json.
//
// Exercice pour manipuler du JSON en JavaScript (fetch, recherche dans un
// objet, generation de tableau HTML). Ce n'est PAS une vraie securite : le
// mot de passe est verifie cote navigateur, donc data/user.json et ce fichier
// restent lisibles par n'importe qui.

const formulaireConnexion = document.querySelector("#formulaire-connexion");
const champLogin = document.querySelector("#champ-login");
const champMotDePasse = document.querySelector("#champ-mot-de-passe");
const statutConnexion = document.querySelector(".statut-connexion");
const blocConnexion = document.querySelector("#connexion-admin");
const blocTableau = document.querySelector("#tableau-admin");
const corpsTableauStock = document.querySelector("#corps-tableau-stock");
const statutTableau = document.querySelector(".statut-tableau");

// Les oeuvres chargees depuis data/article.json, gardees en memoire pour
// pouvoir les modifier (prix, stock) directement dans le tableau. Comme le
// reste du site, rien n'est reecrit sur le disque : les modifications se
// perdent si on recharge la page.
let articlesAdmin = [];

// Formate un nombre en prix, ex: 250000 -> "250 000 Ar"
function formaterPrix(nombre) {
  return nombre.toLocaleString("fr-FR") + " Ar";
}

// Charge data/article.json puis dessine le tableau
function afficherTableauStock() {
  fetch("data/article.json")
    .then(function (reponse) {
      return reponse.json();
    })
    .then(function (articles) {
      articlesAdmin = articles;
      redessinerTableau();
    })
    .catch(function (erreur) {
      console.error("Impossible de charger data/article.json :", erreur);
      blocTableau.querySelector("h2").insertAdjacentHTML(
        "afterend",
        '<p class="erreur-chargement">Impossible de charger le catalogue (data/article.json).</p>'
      );
    });
}

// Reconstruit tout le corps du tableau a partir de articlesAdmin
function redessinerTableau() {
  corpsTableauStock.innerHTML = "";

  articlesAdmin.forEach(function (article) {
    corpsTableauStock.appendChild(creerLigne(article));
  });
}

// Cree une ligne en mode affichage (pas d'edition) pour une oeuvre
function creerLigne(article) {
  const ligne = document.createElement("tr");
  ligne.dataset.id = article.id;

  ligne.innerHTML =
    "<td>" + article.id + "</td>" +
    "<td>" + article.titre + "</td>" +
    "<td>" + article.artiste + "</td>" +
    '<td class="cellule-prix">' + formaterPrix(article.price) + "</td>" +
    '<td class="cellule-stock">' + article.stock + "</td>" +
    '<td class="cellule-actions">' +
      '<button type="button" class="bouton-modifier" title="Modifier">✏️</button>' +
    "</td>";

  return ligne;
}

// Bascule une ligne en mode edition : prix et stock deviennent des champs,
// le crayon devient deux boutons Valider / Annuler.
function passerEnEdition(ligne, article) {
  statutTableau.textContent = "";

  ligne.querySelector(".cellule-prix").innerHTML =
    '<input type="number" class="champ-edition-prix" min="0" step="1000" value="' + article.price + '">';
  ligne.querySelector(".cellule-stock").innerHTML =
    '<input type="number" class="champ-edition-stock" min="0" step="1" value="' + article.stock + '">';
  ligne.querySelector(".cellule-actions").innerHTML =
    '<button type="button" class="bouton-valider-ligne" title="Valider">✓</button>' +
    '<button type="button" class="bouton-annuler-ligne" title="Annuler">✕</button>';
}

// Un seul ecouteur sur le tableau (delegation), plutot qu'un par bouton :
// pratique car les lignes sont recreees a chaque modification/annulation.
corpsTableauStock.addEventListener("click", function (evenement) {
  const ligne = evenement.target.closest("tr");
  if (!ligne) {
    return;
  }

  const article = articlesAdmin.find(function (a) {
    return a.id === ligne.dataset.id;
  });
  if (!article) {
    return;
  }

  if (evenement.target.classList.contains("bouton-modifier")) {
    passerEnEdition(ligne, article);
    return;
  }

  if (evenement.target.classList.contains("bouton-annuler-ligne")) {
    ligne.replaceWith(creerLigne(article));
    return;
  }

  if (evenement.target.classList.contains("bouton-valider-ligne")) {
    const nouveauPrix = Number(ligne.querySelector(".champ-edition-prix").value);
    const nouveauStock = Number(ligne.querySelector(".champ-edition-stock").value);

    if (!Number.isFinite(nouveauPrix) || nouveauPrix < 0 || !Number.isFinite(nouveauStock) || nouveauStock < 0) {
      statutTableau.textContent = "Le prix et le stock doivent etre des nombres positifs.";
      return;
    }

    article.price = nouveauPrix;
    article.stock = nouveauStock;

    ligne.replaceWith(creerLigne(article));
  }
});

// Verifie le login/mot de passe saisi par rapport a data/user.json
formulaireConnexion.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  const login = champLogin.value.trim();
  const motDePasse = champMotDePasse.value;

  fetch("data/user.json")
    .then(function (reponse) {
      return reponse.json();
    })
    .then(function (utilisateur) {
      if (utilisateur.login === login && utilisateur.password === motDePasse) {
        blocConnexion.hidden = true;
        blocTableau.hidden = false;
        afficherTableauStock();
      } else {
        statutConnexion.textContent = "Identifiant ou mot de passe incorrect.";
      }
    })
    .catch(function (erreur) {
      console.error("Impossible de charger data/user.json :", erreur);
      statutConnexion.textContent = "Erreur : impossible de verifier les identifiants.";
    });
});
