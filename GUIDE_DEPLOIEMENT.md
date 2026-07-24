# Guide de déploiement — front sur GitHub Pages, back sur Vercel

Les deux dépôts existent déjà sur GitHub :
- Front : `https://github.com/harivonyR/gallery_d_art`
- Back : `https://github.com/harivonyR/gallery_api`

## ⚠️ À savoir avant de déployer

Vercel exécute le backend en **serverless** : pas de disque persistant.
`GET /articles` et `POST /login` fonctionneront normalement (lecture seule),
mais `PUT /articles/{id}` (l'édition de stock dans `admin.html`) risque de
renvoyer une erreur 500 ("Read-only file system") une fois déployé, car le
dossier `app/data/` n'est pas modifiable en production. La page admin reste
utilisable pour consulter le stock, pas pour le modifier durablement tant
que l'API ne passe pas sur une vraie base de données (Mongo, déjà entrevue
dans `.env`).

## 1. Pousser le code sur GitHub

Depuis chaque dossier :

> **Z_gallery_d_art a un merge en cours** (un `git pull` a ramené un
> `README.md` et un `LICENSE` créés depuis GitHub, en conflit avec les
> fichiers locaux). Le conflit sur `README.md` a été résolu en gardant la
> version détaillée locale — vérifie le résultat avec `git diff --cached`
> puis termine le merge avant de continuer :
> ```
> cd Z_gallery_d_art
> git add README.md
> git commit
> ```

```
cd Z_gallery_d_art
git add -A
git commit -m "Prepare le deploiement (index.html, migration API)"
git push origin main
```

```
cd Z_gallery_d_art_api/gallery_api
git add -A
git commit -m "Ajoute requirements.txt et vercel.json pour le deploiement"
git push origin main
```

## 2. Déployer le front sur GitHub Pages

1. Sur `https://github.com/harivonyR/gallery_d_art` → **Settings** →
   **Pages**.
2. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Sauvegarder. Le site sera visible sous
   `https://harivonyr.github.io/gallery_d_art/` après une minute ou deux.
   `index.html` redirige automatiquement vers `gallery.html`.

## 3. Déployer le back sur Vercel

1. Sur [vercel.com](https://vercel.com), se connecter avec le compte
   GitHub.
2. **Add New... → Project**, choisir le dépôt `gallery_api`.
3. Vercel devrait détecter `vercel.json` automatiquement (build Python via
   `@vercel/python`) — pas de configuration supplémentaire à saisir.
4. Déployer. Une fois terminé, Vercel donne une URL du type
   `https://gallery-api-xxxx.vercel.app`.
5. Vérifier que ça répond : ouvrir `https://<ton-url>.vercel.app/docs`
   (documentation Swagger) et `https://<ton-url>.vercel.app/articles`.

## 4. Reconnecter le front à l'API déployée

✅ Fait — l'API est déployée sur `https://gallery-api-nine.vercel.app` et
`script.js` / `admin.js` pointent déjà vers cette URL.

Reste à recommit/repush le front (étape 1) pour que GitHub Pages serve la
version à jour.

## 5. Vérifier

Ouvrir `https://harivonyr.github.io/gallery_d_art/gallery.html` :
- Les 9 œuvres doivent apparaître (preuve que `script.js` joint bien
  l'API Vercel).
- Ajouter au panier, ouvrir `admin.html`, se connecter (`admin`/`admin`)
  doivent fonctionner.
- L'édition de stock dans `admin.html` peut échouer (voir l'avertissement
  en haut de ce guide) — normal tant que l'API reste sur des fichiers JSON.
