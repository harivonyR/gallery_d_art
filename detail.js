// API_BASE vient de script.js, charge avant ce fichier dans detail.html.

const parametres = new URLSearchParams(window.location.search);
const idOeuvre = parametres.get("id");

const detailImage = document.getElementById("detail-image");
const detailTitre = document.getElementById("detail-titre");
const detailArtiste = document.getElementById("detail-artiste");
const detailPrix = document.getElementById("detail-prix");
const detailHistoire = document.getElementById("detail-histoire");
const detailBoutonAjouter = document.getElementById("detail-bouton-ajouter");

function formaterPrixDetail(nombre) {
  return nombre.toLocaleString("fr-FR") + " Ar";
}

fetch(API_BASE + "/articles")
  .then(function (reponse) {
    return reponse.json();
  })
  .then(function (donnees) {
    const article = donnees.find(function (a) {
      return a.id === idOeuvre;
    });

    if (!article) {
      detailTitre.textContent = "Oeuvre introuvable";
      detailHistoire.textContent = "Aucune oeuvre ne correspond a ce lien. Retourne a la galerie pour en choisir une.";
      return;
    }

    document.title = "Petite Galerie - " + article.titre;

    detailImage.src = article.image;
    detailImage.alt = article.titre + ", en grand format";
    detailTitre.textContent = article.titre;
    detailArtiste.textContent = "Par " + article.artiste;
    detailPrix.textContent = formaterPrixDetail(article.price);
    detailHistoire.textContent = article.detail;
    detailBoutonAjouter.dataset.id = article.id;
  })
  .catch(function (erreur) {
    console.error("Impossible de charger le catalogue depuis l'API :", erreur);
    detailTitre.textContent = "Erreur de chargement";
    detailHistoire.textContent = "Le catalogue n'a pas pu etre charge depuis l'API. Verifie que le serveur gallery_api est bien lance.";
  });
