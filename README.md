# Petite Galerie — site vitrine

Exercice d'apprentissage HTML5 / CSS / JavaScript : site vitrine pour vendre
des œuvres d'art, parti d'une simple galerie statique (voir `subject/`) puis
étendu avec un panier, un parcours de commande, et une page d'administration.

## Structure

```
gallery.html      Page d'accueil : galerie (9 œuvres), panier, modal de paiement
detail.html       Page détail UNIQUE (modèle), peuplée dynamiquement via ?id=
admin.html        Page d'administration : login + tableau de stock éditable
script.js         Logique panier/checkout, partagée par gallery.html et detail.html
detail.js         Charge l'œuvre demandée (via ?id=) depuis l'API
admin.js          Login + tableau reliés à l'API gallery_api
style.css         Styles partagés par toutes les pages
data/             Anciennes copies locales du catalogue/identifiants — voir note plus bas
img/              Images des œuvres + visuel de publicité
videos/           Vidéo interview + extrait audio (extrait de la vidéo)
subject/          Sujets d'exercice originaux (photos des consignes)
```

**Le site ne stocke plus aucune donnée lui-même.** Le catalogue des œuvres et
la vérification du login admin viennent tous les deux de l'API
[`gallery_api`](../Z_gallery_d_art_api/gallery_api/README.md) — ce dossier ne
contient plus que la mise en forme (HTML/CSS) et la logique d'interaction.

> `data/article.json` et `data/user.json` restent dans ce dossier mais **ne
> sont plus lus par rien** depuis la migration vers l'API — c'est
> `gallery_api/app/data/` qui fait maintenant foi. Gardés pour l'instant par
> précaution, à supprimer si plus besoin de comparer avec l'ancien état.

## Lancer le projet

Deux serveurs doivent tourner en même temps :

1. **Le site** (statique) :
   ```
   C:\Anaconda\python.exe -m http.server 8080 --directory "C:\Users\harivonyratefiarison\Documents\4_perso\Z_gallery_d_art"
   ```
   Puis ouvrir `http://localhost:8080/gallery.html`.

2. **L'API** (catalogue + login) — voir
   [`Z_gallery_d_art_api/gallery_api/README.md`](../Z_gallery_d_art_api/gallery_api/README.md)
   pour la commande exacte (port 8001).

Depuis `Z_CLAUDE`, les configs `gallery_d_art` et `gallery_api` de
`.claude/launch.json` lancent déjà les deux.

**Sans l'API lancée, plus rien ne fonctionne** : la galerie affiche un
message d'erreur à la place des œuvres, et la page admin ne peut ni se
connecter ni afficher le tableau. C'est le changement principal depuis que
"tout ce qui est stockage" a été déplacé côté API — avant, le site pouvait
au moins afficher son catalogue de façon 100% statique.

Ne jamais ouvrir les fichiers `.html` en double-clic (`file://...`) non
plus : les appels vers l'API (`fetch`) sont bloqués depuis une page ouverte
ainsi.

## Fonctionnalités actuelles

- Galerie de 9 œuvres (cartes statiques dans `gallery.html`, mais prix/stock
  vérifiés en direct contre l'API au moment d'ajouter au panier).
- Panier **en mémoire uniquement** (JS), se vide si la page est rechargée.
- Bouton "Livrer la commande" → fenêtre de confirmation avec choix du mode
  de paiement :
  - **Espèces à la livraison** : formulaire nom / adresse / téléphone.
  - **Mobile Money** : affiche le numéro du vendeur + un champ pour la
    référence de transaction, puis écran de confirmation ("paiement en
    cours de vérification, confirmation par SMS").
- Déduction du stock en mémoire à la livraison (pas de nouvelle écriture
  disque à cette étape précise — voir page admin pour une vraie sauvegarde).
- `detail.html?id=PAINT01` (etc.) : page détail unique, peuplée depuis l'API
  selon l'id dans l'URL.
- `admin.html` : connexion (identifiant/mot de passe envoyés à
  `POST /login` sur l'API, par défaut `admin` / `admin`), puis tableau du
  stock avec édition ligne par ligne (crayon → champs modifiables →
  valider/annuler). La validation appelle `PUT /articles/{id}` sur l'API,
  qui réécrit réellement le fichier sur son disque.

## Points d'attention (pour une prochaine session)

- **Le login admin n'est pas une vraie sécurité** : pas de session ni de
  jeton, juste une comparaison login/mot de passe à chaque connexion,
  refaite côté API mais toujours en clair. Volontaire — exercice pour
  manipuler du JSON, pas un vrai contrôle d'accès.
- Le panier et la déduction de stock du **storefront**
  (`gallery.html`/`script.js`) restent en mémoire uniquement à l'étape
  "Livrer" — choix explicite, pour ne pas bloquer le parcours client sur
  un enregistrement à chaque commande. Seule la page admin persiste
  vraiment ses modifications.
- Toutes les données (catalogue, identifiants) vivent maintenant dans
  `Z_gallery_d_art_api/gallery_api/app/data/` — ce dossier-ci n'a plus de
  copie à jour, voir la note en haut de ce fichier.
