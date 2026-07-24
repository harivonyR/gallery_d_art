// Lit l'id de l'oeuvre depuis l'adresse (ex: detail.html?id=PAINT01)
// et remplit la page a partir de data/article.json. Une seule page sert
// ainsi de modele pour toutes les oeuvres, au lieu d'une page par oeuvre.

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

fetch("data/article.json")
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
    console.error("Impossible de charger data/article.json :", erreur);
    detailTitre.textContent = "Erreur de chargement";
    detailHistoire.textContent = "Le catalogue n'a pas pu etre charge. Verifie que la page est ouverte via un serveur local (http://...), pas en double-clic.";
  });
