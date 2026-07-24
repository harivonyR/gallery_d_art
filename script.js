// ===== Elements de la page =====

// Badge et lien du panier (dans le header)
const badgePanier = document.querySelector(".badge-panier");
const lienPanier = document.querySelector(".lien-panier");

// La sidebar du panier et ses elements internes
const panierLateral = document.querySelector("#panier-lateral");
const boutonFermerPanier = document.querySelector(".bouton-fermer-panier");
const listePanier = document.querySelector(".liste-panier");
const messagePanierVide = document.querySelector(".panier-vide");
const montantTotal = document.querySelector(".montant-total");
const boutonLivrer = document.querySelector(".bouton-livrer");
const statutLivraison = document.querySelector(".statut-livraison");

// La fenetre modale de paiement (recap + confirmation), ouverte au clic sur
// "Livrer la commande"
const modalPaiement = document.querySelector("#modal-paiement");
const boutonFermerModal = document.querySelector(".bouton-fermer-modal");
const boutonConfirmerPaiement = document.querySelector(".bouton-confirmer-paiement");
const listePaiement = document.querySelector(".liste-paiement");
const montantPaiementTotal = document.querySelector(".montant-paiement-total");
const statutPaiement = document.querySelector(".statut-paiement");

// Le mode de paiement change les champs demandes : coordonnees de livraison
// pour les especes, reference de transaction pour le Mobile Money.
const modePaiement = document.querySelector("#mode-paiement");
const blocEspeces = document.querySelector("#bloc-especes");
const blocMobileMoney = document.querySelector("#bloc-mobile-money");
const champNom = document.querySelector("#livraison-nom");
const champAdresse = document.querySelector("#livraison-adresse");
const champTelephone = document.querySelector("#livraison-telephone");
const champReferenceMobileMoney = document.querySelector("#mobile-money-reference");

// Vue de confirmation affichee a la place du formulaire une fois un
// paiement Mobile Money valide (recap+formulaire vs confirmation visuelle)
const contenuPaiement = document.querySelector(".contenu-paiement");
const confirmationMobileMoney = document.querySelector(".confirmation-mobile-money");
const confirmationTexte = document.querySelector(".confirmation-texte");
const boutonFermerConfirmation = document.querySelector(".bouton-fermer-confirmation");

// Tous les boutons "Ajouter au panier" (un par carte d'oeuvre)
const boutonsAjouterPanier = document.querySelectorAll(".bouton-ajouter-panier");


// ===== Donnees =====

// L'API (gallery_api) sert de base de donnees : catalogue et connexion admin.
const API_BASE = "https://gallery-api-nine.vercel.app";

// La liste des oeuvres, chargee depuis l'API
let articles = [];

// Le panier de l'utilisateur, garde uniquement en memoire (il se vide si on recharge la page).
// Meme structure que data/panier.json : un tableau de { article_id, quantity }
let panier = [];


// Tant que data/article.json n'est pas charge, on desactive les boutons
// "Ajouter au panier" : sans les articles (prix, nom...), impossible de
// remplir correctement la sidebar.
boutonsAjouterPanier.forEach(function (bouton) {
  bouton.disabled = true;
});

// On charge les oeuvres depuis l'API des qu'on arrive sur la page
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

// Message visible si le catalogue ne charge pas (evite de devoir ouvrir la
// console pour comprendre pourquoi les boutons restent desactives). La cause
// la plus frequente : l'API (gallery_api, port 8001) n'est pas lancee.
function afficherErreurChargement() {
  const banniere = document.createElement("p");
  banniere.className = "erreur-chargement";
  banniere.textContent =
    "Impossible de charger le catalogue depuis l'API (" + API_BASE + "), les boutons \"Ajouter au panier\" restent desactives. " +
    "Verifie que le serveur gallery_api est bien lance.";
  document.querySelector("main").prepend(banniere);
}


// ===== Fonctions =====

// Retrouve les infos d'une oeuvre (nom, prix...) a partir de son id
function trouverArticle(id) {
  return articles.find(function (article) {
    return article.id === id;
  });
}

// Met a jour le badge (nombre total d'articles) dans le header
function mettreAJourBadge() {
  const total = panier.reduce(function (somme, ligne) {
    return somme + ligne.quantity;
  }, 0);

  badgePanier.textContent = total;
  lienPanier.setAttribute("aria-label", "Voir le panier (" + total + " articles)");
}

// Formate un nombre en prix, ex: 250000 -> "250 000 Ar"
function formaterPrix(nombre) {
  return nombre.toLocaleString("fr-FR") + " Ar";
}

// Reconstruit le contenu de la sidebar a partir du panier
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

// Ajoute une oeuvre au panier (ou augmente sa quantite si elle y est deja)
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


// ===== Livraison de la commande (deduction du stock) =====
//
// Le stock est deduit uniquement en memoire (dans le tableau "articles" deja
// charge depuis data/article.json) : rien n'est reecrit sur le disque, donc
// aucune demande de connecter un fichier au moment de payer. Comme le panier,
// ca se reinitialise si la page est rechargee.

// Verifie le stock et deduit les quantites commandees si tout s'est bien passe.
function livrerCommande() {
  if (panier.length === 0) {
    statutLivraison.textContent = "Le panier est vide.";
    return;
  }

  // On verifie d'abord qu'il y a assez de stock pour toute la commande
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

  // Stock suffisant partout : on deduit vraiment
  panier.forEach(function (ligne) {
    const article = trouverArticle(ligne.article_id);
    article.stock = article.stock - ligne.quantity;
  });

  panier = [];
  mettreAJourBadge();
  afficherPanier();

  statutLivraison.textContent = "Commande livree.";
}


// ===== Fenetre modale de paiement =====

// Recopie le contenu du panier dans le recap de la modale, puis l'affiche
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

  // On repart d'un formulaire vide a chaque ouverture, pour ne pas garder
  // les coordonnees d'une commande precedente.
  champNom.value = "";
  champAdresse.value = "";
  champTelephone.value = "";
  champReferenceMobileMoney.value = "";
  modePaiement.value = "especes";
  afficherChampsModePaiement();

  // On repart toujours sur le formulaire, pas sur l'ecran de confirmation
  // d'une commande precedente.
  contenuPaiement.hidden = false;
  confirmationMobileMoney.hidden = true;

  modalPaiement.hidden = false;
}

function fermerModalPaiement() {
  modalPaiement.hidden = true;
}

// Affiche le bloc correspondant au mode de paiement choisi (especes ou
// Mobile Money) et cache l'autre.
function afficherChampsModePaiement() {
  const estMobileMoney = modePaiement.value === "mobile_money";
  blocEspeces.hidden = estMobileMoney;
  blocMobileMoney.hidden = !estMobileMoney;
}


// ===== Evenements =====

// Un clic sur "Ajouter au panier" ajoute l'oeuvre correspondante (via data-id)
boutonsAjouterPanier.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    ajouterAuPanier(bouton.dataset.id);
  });
});

// Un clic sur l'icone panier ouvre/ferme la sidebar
lienPanier.addEventListener("click", function (evenement) {
  evenement.preventDefault();
  panierLateral.classList.toggle("ouvert");
});

// Le bouton "✕" ferme la sidebar
boutonFermerPanier.addEventListener("click", function () {
  panierLateral.classList.remove("ouvert");
});

// Le bouton "Livrer la commande" ouvre d'abord la fenetre de confirmation
boutonLivrer.addEventListener("click", function () {
  ouvrirModalPaiement();
});

// Le bouton "✕" de la modale ferme la confirmation sans rien valider
boutonFermerModal.addEventListener("click", fermerModalPaiement);

// Changer de mode de paiement affiche les champs correspondants
modePaiement.addEventListener("change", afficherChampsModePaiement);

// "Confirmer et payer" verifie d'abord que les champs necessaires au mode
// de paiement choisi sont remplis, puis execute la vraie livraison
// (deduction du stock). La modale ne se ferme que si tout s'est bien passe.
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
      // Confirmation visuelle bien visible plutot qu'un simple message texte
      confirmationTexte.textContent = messageSucces;
      contenuPaiement.hidden = true;
      confirmationMobileMoney.hidden = false;
    } else {
      statutPaiement.textContent = messageSucces;
      fermerModalPaiement();
    }
  } else {
    // La livraison a echoue (stock insuffisant, panier vide...) : on garde
    // la modale ouverte et on affiche le message d'erreur correspondant.
    statutPaiement.textContent = statutLivraison.textContent;
  }
});

// Le bouton "OK" de l'ecran de confirmation Mobile Money ferme la modale
boutonFermerConfirmation.addEventListener("click", fermerModalPaiement);
