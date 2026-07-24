// Page d'administration : verifie le login/mot de passe aupres de l'API
// gallery_api (POST /login), puis affiche le stock des oeuvres (GET
// /articles) et permet de le modifier (PUT /articles/{id}). Toutes les
// donnees vivent desormais dans l'API, plus aucun fichier JSON lu en local.
//
// Exercice pour manipuler du JSON en JavaScript/Python. Ce n'est PAS une
// vraie securite : pas de session ni de jeton, juste une comparaison
// login/mot de passe a chaque connexion.

const formulaireConnexion = document.querySelector("#formulaire-connexion");
const champLogin = document.querySelector("#champ-login");
const champMotDePasse = document.querySelector("#champ-mot-de-passe");
const statutConnexion = document.querySelector(".statut-connexion");
const blocConnexion = document.querySelector("#connexion-admin");
const blocTableau = document.querySelector("#tableau-admin");
const corpsTableauStock = document.querySelector("#corps-tableau-stock");
const statutTableau = document.querySelector(".statut-tableau");

// L'API (gallery_api) qui sert et met a jour data/article.json. Evite d'avoir
// a faire choisir un fichier a l'utilisateur : le serveur ecrit lui-meme sur
// le disque quand on valide une modification.
const API_BASE = "http://localhost:8001";

// Les oeuvres chargees depuis l'API, gardees en memoire pour l'affichage.
let articlesAdmin = [];

// Formate un nombre en prix, ex: 250000 -> "250 000 Ar"
function formaterPrix(nombre) {
  return nombre.toLocaleString("fr-FR") + " Ar";
}

// Charge le catalogue depuis l'API puis dessine le tableau
function afficherTableauStock() {
  fetch(API_BASE + "/articles")
    .then(function (reponse) {
      return reponse.json();
    })
    .then(function (articles) {
      articlesAdmin = articles;
      redessinerTableau();
    })
    .catch(function (erreur) {
      console.error("Impossible de charger le catalogue depuis l'API :", erreur);
      blocTableau.querySelector("h2").insertAdjacentHTML(
        "afterend",
        '<p class="erreur-chargement">Impossible de joindre l\'API (' + API_BASE + '). Verifie qu\'elle est bien lancee.</p>'
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

// Demande a l'API de mettre a jour le prix/stock d'une oeuvre. C'est le
// serveur qui reecrit data/article.json, donc aucun fichier a choisir.
async function enregistrerArticleSurApi(article) {
  const reponse = await fetch(API_BASE + "/articles/" + article.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price: article.price, stock: article.stock })
  });

  if (!reponse.ok) {
    throw new Error("L'API a refuse la mise a jour (code " + reponse.status + ").");
  }

  return reponse.json();
}

// Un seul ecouteur sur le tableau (delegation), plutot qu'un par bouton :
// pratique car les lignes sont recreees a chaque modification/annulation.
corpsTableauStock.addEventListener("click", async function (evenement) {
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

    const prixPrecedent = article.price;
    const stockPrecedent = article.stock;

    article.price = nouveauPrix;
    article.stock = nouveauStock;

    try {
      const articleMisAJour = await enregistrerArticleSurApi(article);
      article.price = articleMisAJour.price;
      article.stock = articleMisAJour.stock;

      statutTableau.textContent = "";
      ligne.replaceWith(creerLigne(article));
    } catch (erreur) {
      console.error("Impossible d'enregistrer via l'API :", erreur);
      article.price = prixPrecedent;
      article.stock = stockPrecedent;
      statutTableau.textContent = "Impossible d'enregistrer : verifie que l'API (gallery_api) est bien lancee.";
    }
  }
});

// Verifie le login/mot de passe aupres de l'API (POST /login)
formulaireConnexion.addEventListener("submit", function (evenement) {
  evenement.preventDefault();

  const login = champLogin.value.trim();
  const motDePasse = champMotDePasse.value;

  fetch(API_BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: login, password: motDePasse })
  })
    .then(function (reponse) {
      if (reponse.ok) {
        blocConnexion.hidden = true;
        blocTableau.hidden = false;
        afficherTableauStock();
      } else {
        statutConnexion.textContent = "Identifiant ou mot de passe incorrect.";
      }
    })
    .catch(function (erreur) {
      console.error("Impossible de joindre l'API pour la connexion :", erreur);
      statutConnexion.textContent = "Erreur : impossible de joindre l'API (verifie que gallery_api est lancee).";
    });
});
