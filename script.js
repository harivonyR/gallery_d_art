const badgePanier = document.querySelector(".badge-panier");
const lienPanier = document.querySelector(".lien-panier");

const panierLateral = document.querySelector("#panier-lateral");
const boutonFermerPanier = document.querySelector(".bouton-fermer-panier");
const listePanier = document.querySelector(".liste-panier");
const messagePanierVide = document.querySelector(".panier-vide");
const montantTotal = document.querySelector(".montant-total");
const boutonLivrer = document.querySelector(".bouton-livrer");
const statutLivraison = document.querySelector(".statut-livraison");

const modalPaiement = document.querySelector("#modal-paiement");
const boutonFermerModal = document.querySelector(".bouton-fermer-modal");
const boutonConfirmerPaiement = document.querySelector(".bouton-confirmer-paiement");
const listePaiement = document.querySelector(".liste-paiement");
const montantPaiementTotal = document.querySelector(".montant-paiement-total");
const statutPaiement = document.querySelector(".statut-paiement");

const modePaiement = document.querySelector("#mode-paiement");
const blocEspeces = document.querySelector("#bloc-especes");
const blocMobileMoney = document.querySelector("#bloc-mobile-money");
const champNom = document.querySelector("#livraison-nom");
const champAdresse = document.querySelector("#livraison-adresse");
const champTelephone = document.querySelector("#livraison-telephone");
const champReferenceMobileMoney = document.querySelector("#mobile-money-reference");

const contenuPaiement = document.querySelector(".contenu-paiement");
const confirmationMobileMoney = document.querySelector(".confirmation-mobile-money");
const confirmationTexte = document.querySelector(".confirmation-texte");
const boutonFermerConfirmation = document.querySelector(".bouton-fermer-confirmation");

const boutonsAjouterPanier = document.querySelectorAll(".bouton-ajouter-panier");

const API_BASE = "https://gallery-api-nine.vercel.app";

let articles = [];
let panier = [];

// Desactives tant que l'API n'a pas renvoye le catalogue (prix, noms...).
boutonsAjouterPanier.forEach(function (bouton) {
  bouton.disabled = true;
});

fetch(API_BASE + "/articles")
  .then(function (reponse) {
    return reponse.json();
  })
  .then(function (donnees) {
    articles = donnees;
    boutonsAjouterPanier.forEach(function (bouton) {
      bouton.disabled = false;
    });
  })
  .catch(function (erreur) {
    console.error("Impossible de charger le catalogue depuis l'API :", erreur);
    afficherErreurChargement();
  });

function afficherErreurChargement() {
  const banniere = document.createElement("p");
  banniere.className = "erreur-chargement";
  banniere.textContent =
    "Impossible de charger le catalogue depuis l'API (" + API_BASE + "), les boutons \"Ajouter au panier\" restent desactives. " +
    "Verifie que le serveur gallery_api est bien lance.";
  document.querySelector("main").prepend(banniere);
}


function trouverArticle(id) {
  return articles.find(function (article) {
    return article.id === id;
  });
}

function mettreAJourBadge() {
  const total = panier.reduce(function (somme, ligne) {
    return somme + ligne.quantity;
  }, 0);

  badgePanier.textContent = total;
  lienPanier.setAttribute("aria-label", "Voir le panier (" + total + " articles)");

  declencherEffetBadge();
}

// Retirer puis remettre la classe force le navigateur a rejouer l'animation.
function declencherEffetBadge() {
  badgePanier.classList.remove("effet-ajout");
  void badgePanier.offsetWidth;
  badgePanier.classList.add("effet-ajout");
}

const minuteriesEffetBouton = new WeakMap();

function declencherEffetBouton(bouton) {
  if (!bouton.dataset.texteOriginal) {
    bouton.dataset.texteOriginal = bouton.textContent;
  }

  clearTimeout(minuteriesEffetBouton.get(bouton));

  bouton.classList.remove("effet-ajout");
  void bouton.offsetWidth;
  bouton.classList.add("effet-ajout");
  bouton.textContent = "✅ Ajoute !";

  minuteriesEffetBouton.set(bouton, setTimeout(function () {
    bouton.classList.remove("effet-ajout");
    bouton.textContent = bouton.dataset.texteOriginal;
  }, 900));
}

function formaterPrix(nombre) {
  return nombre.toLocaleString("fr-FR") + " Ar";
}

function afficherPanier() {
  listePanier.innerHTML = "";

  if (panier.length === 0) {
    messagePanierVide.style.display = "block";
  } else {
    messagePanierVide.style.display = "none";
  }

  let total = 0;

  panier.forEach(function (ligne) {
    const article = trouverArticle(ligne.article_id);
    const sousTotal = article.price * ligne.quantity;
    total = total + sousTotal;

    const item = document.createElement("li");
    item.className = "article-panier";
    item.textContent = article.titre + " x" + ligne.quantity + " — " + formaterPrix(sousTotal);
    listePanier.appendChild(item);
  });

  montantTotal.textContent = formaterPrix(total);
}

function ajouterAuPanier(id) {
  const ligneExistante = panier.find(function (ligne) {
    return ligne.article_id === id;
  });

  if (ligneExistante) {
    ligneExistante.quantity = ligneExistante.quantity + 1;
  } else {
    panier.push({ article_id: id, quantity: 1 });
  }

  mettreAJourBadge();
  afficherPanier();
}


// Deduit le stock uniquement en memoire : rien n'est reecrit sur l'API a
// cette etape (voir la page admin pour une vraie sauvegarde).
function livrerCommande() {
  if (panier.length === 0) {
    statutLivraison.textContent = "Le panier est vide.";
    return;
  }

  const manques = [];

  panier.forEach(function (ligne) {
    const article = trouverArticle(ligne.article_id);
    if (!article || article.stock < ligne.quantity) {
      manques.push(article ? article.titre : ligne.article_id);
    }
  });

  if (manques.length > 0) {
    statutLivraison.textContent = "Stock insuffisant pour : " + manques.join(", ");
    return;
  }

  panier.forEach(function (ligne) {
    const article = trouverArticle(ligne.article_id);
    article.stock = article.stock - ligne.quantity;
  });

  panier = [];
  mettreAJourBadge();
  afficherPanier();

  statutLivraison.textContent = "Commande livree.";
}


function ouvrirModalPaiement() {
  if (panier.length === 0) {
    statutLivraison.textContent = "Le panier est vide.";
    return;
  }

  listePaiement.innerHTML = "";
  let total = 0;

  panier.forEach(function (ligne) {
    const article = trouverArticle(ligne.article_id);
    const sousTotal = article.price * ligne.quantity;
    total = total + sousTotal;

    const item = document.createElement("li");
    item.textContent = article.titre + " x" + ligne.quantity + " — " + formaterPrix(sousTotal);
    listePaiement.appendChild(item);
  });

  montantPaiementTotal.textContent = formaterPrix(total);
  statutPaiement.textContent = "";

  champNom.value = "";
  champAdresse.value = "";
  champTelephone.value = "";
  champReferenceMobileMoney.value = "";
  modePaiement.value = "especes";
  afficherChampsModePaiement();

  contenuPaiement.hidden = false;
  confirmationMobileMoney.hidden = true;

  modalPaiement.hidden = false;
}

function fermerModalPaiement() {
  modalPaiement.hidden = true;
}

function afficherChampsModePaiement() {
  const estMobileMoney = modePaiement.value === "mobile_money";
  blocEspeces.hidden = estMobileMoney;
  blocMobileMoney.hidden = !estMobileMoney;
}

boutonsAjouterPanier.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    ajouterAuPanier(bouton.dataset.id);
    declencherEffetBouton(bouton);
  });
});

lienPanier.addEventListener("click", function (evenement) {
  evenement.preventDefault();
  panierLateral.classList.toggle("ouvert");
});

boutonFermerPanier.addEventListener("click", function () {
  panierLateral.classList.remove("ouvert");
});

boutonLivrer.addEventListener("click", function () {
  ouvrirModalPaiement();
});

boutonFermerModal.addEventListener("click", fermerModalPaiement);

modePaiement.addEventListener("change", afficherChampsModePaiement);

boutonConfirmerPaiement.addEventListener("click", function () {
  const estMobileMoney = modePaiement.value === "mobile_money";
  let messageSucces = "";

  if (!estMobileMoney) {
    const nom = champNom.value.trim();
    const adresse = champAdresse.value.trim();
    const telephone = champTelephone.value.trim();

    if (!nom || !adresse || !telephone) {
      statutPaiement.textContent = "Merci de renseigner ton nom, ton adresse de livraison et ton numero de telephone.";
      return;
    }

    messageSucces = "Merci pour ta commande, " + nom + " ! Livraison a l'adresse indiquee, paiement en especes a la reception.";
  } else {
    const reference = champReferenceMobileMoney.value.trim();

    if (!reference) {
      statutPaiement.textContent = "Merci d'indiquer la reference de ton paiement Mobile Money.";
      return;
    }

    messageSucces = "Paiement en cours de verification. La confirmation te sera envoyee par SMS (ref. " + reference + ").";
  }

  livrerCommande();

  if (panier.length === 0) {
    if (estMobileMoney) {
      confirmationTexte.textContent = messageSucces;
      contenuPaiement.hidden = true;
      confirmationMobileMoney.hidden = false;
    } else {
      statutPaiement.textContent = messageSucces;
      fermerModalPaiement();
    }
  } else {
    statutPaiement.textContent = statutLivraison.textContent;
  }
});

boutonFermerConfirmation.addEventListener("click", fermerModalPaiement);
